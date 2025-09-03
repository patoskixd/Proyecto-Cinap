"use client";

import { useEffect, useMemo, useState } from "react";
import type { MySlot, SlotStatus } from "@domain/mySlots";
import { InMemoryMySlotsRepo } from "@infrastructure/my-slots/InMemoryMySlotsRepo";
import { GetMySlots } from "@application/my-slots/usecases/GetMySlots";
import { UpdateMySlot } from "@application/my-slots/usecases/UpdateMySlot";
import { DeleteMySlot } from "@application/my-slots/usecases/DeleteMySlot";
import Link from "next/link";


const WORK_START = 9;  
const WORK_END   = 18; 

function endTime(start: string, duration: number) {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + duration;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDateEs(iso: string) {
  const [y, mo, d] = iso.split("-").map(Number);
  const dt = new Date(y, (mo ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function isWeekendISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  const wd = dt.getDay(); 
  return wd === 0 || wd === 6;
}
function isPastISO(iso: string) {
  return iso < todayLocalISO();
}
function clampToWorkingHour(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  if (h < WORK_START) return `${String(WORK_START).padStart(2, "0")}:00`;
  if (h > WORK_END)   return `${String(WORK_END).padStart(2, "0")}:00`;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function validStartWithinShift(hhmm: string, duration: number) {
  const [h, m] = hhmm.split(":").map(Number);
  const start = h * 60 + m;
  const end = start + duration;
  return start >= WORK_START * 60 && end <= WORK_END * 60;
}


type Filters = { category: string; service: string; status: "" | SlotStatus; date: string };

const repo = new InMemoryMySlotsRepo();

export default function MySlotsManager() {
  const [slots, setSlots] = useState<MySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ category: "", service: "", status: "", date: "" });


  const [editing, setEditing] = useState<MySlot | null>(null);
  const [confirmPatch, setConfirmPatch] = useState<MySlot | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MySlot | null>(null);

  const [toast, setToast] = useState<{ msg: string; tone: "info" | "success" | "error" } | null>(null);
  const notify = (msg: string, tone: "info" | "success" | "error" = "info") => {
    setToast({ msg, tone }); setTimeout(() => setToast(null), 2600);
  };

  const ucGet = new GetMySlots(repo);
  const ucUpdate = new UpdateMySlot(repo);
  const ucDelete = new DeleteMySlot(repo);

  const refresh = async () => {
    setLoading(true);
    const data = await ucGet.exec();
    setSlots(data);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    return slots.filter(s =>
      (!filters.category || s.category.toLowerCase().includes(filters.category)) &&
      (!filters.service  || s.service.toLowerCase().includes(filters.service)) &&
      (!filters.status   || s.status === filters.status) &&
      (!filters.date     || s.date === filters.date)
    );
  }, [slots, filters]);

  const stats = useMemo(() => {
    const disponibles = slots.filter(s => s.status === "disponible").length;

    const ocupadasMin = slots
      .filter(s => s.status === "ocupado")
      .reduce((acc, s) => acc + s.duration, 0);

    const ocupadasHM = (() => {
      const h = Math.floor(ocupadasMin / 60);
      const m = ocupadasMin % 60;
      return `${h}h ${m}m`;
    })();

    return { disponibles, ocupadasMin, ocupadasHM };
  }, [slots]);


  const startEdit = (id: number) => {
    const s = slots.find(x => x.id === id);
    if (s) setEditing({ ...s });
  };

  const openDelete = (id: number) => {
    const s = slots.find(x => x.id === id);
    if (s) setConfirmDelete(s);
  };

  const confirmDeleteYes = async () => {
    if (!confirmDelete) return;
    try {
      await ucDelete.exec(confirmDelete.id);
      setConfirmDelete(null);
      await refresh();
      notify("Cupo eliminado", "success");
    } catch {
      notify("No se puede eliminar un cupo ocupado", "error");
    }
  };

  const saveEdit = () => {
    if (!editing) return;

    if (isPastISO(editing.date)) {
      notify("No puedes seleccionar fechas pasadas", "error");
      return;
    }
    if (isWeekendISO(editing.date)) {
      notify("No hay cupos en fines de semana", "error");
      return;
    }
    const clamped = clampToWorkingHour(editing.time);
    if (clamped !== editing.time) editing.time = clamped;
    if (!validStartWithinShift(editing.time, editing.duration)) {
      notify("Horario fuera de la jornada (09:00 AM - 06:00 PM)", "error");
      return;
    }


    setConfirmPatch({ ...editing });
  };

  const confirmSaveYes = async () => {
    if (!confirmPatch) return;
    await ucUpdate.exec(confirmPatch.id, confirmPatch);
    setConfirmPatch(null);
    setEditing(null);
    await refresh();
    notify("Cambios confirmados y guardados", "success");
  };


  return (
    <div className="py-6">
      {/* encabezado  */}
      <div className="mb-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Mis cupos</h1>
            <p className="text-neutral-600">Gestiona y modifica tus cupos disponibles</p>
          </div>
          <Link
            href="/asesorias/crear-cupos"
            className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-2.5 font-semibold text-white shadow"
          >
            Crear cupos
          </Link>
        </div>
      </div>

      {/* filtros */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-neutral-800">Categoría</label>
            <select
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
              value={filters.category}
              onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
            >
              <option value="">Todas</option>
              <option value="acad">Asesoría Académica</option>
              <option value="invest">Investigación</option>
              <option value="tesis">Tesis y Proyectos</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-neutral-800">Servicio</label>
            <select
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
              value={filters.service}
              onChange={(e) => setFilters(f => ({ ...f, service: e.target.value }))}
            >
              <option value="">Todos</option>
              <option value="individual">Asesoría Individual</option>
              <option value="grupal">Asesoría Grupal</option>
              <option value="revisión">Revisión de Documentos</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-neutral-800">Estado</label>
            <select
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value as Filters["status"] }))}
            >
              <option value="">Todos</option>
              <option value="disponible">Disponible</option>
              <option value="ocupado">Ocupado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-neutral-800">Fecha</label>
            <input
              type="date"
              min={todayLocalISO()}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
              value={filters.date}
              onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* stats (Horas ocupadas) */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Cupos totales", value: slots.length },
          { label: "Disponibles", value: stats.disponibles },
          { label: "Horas ocupadas", value: stats.ocupadasHM },
        ].map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div>
              <div className="text-xl font-bold text-blue-600">{s.value}</div>
              <div className="text-sm font-medium text-neutral-600">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* cards */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-neutral-500">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <h3 className="mb-1 text-lg font-semibold text-neutral-900">No hay cupos</h3>
          <p className="mb-4 text-neutral-600">Crea tu primer cupo para comenzar</p>
          <Link href="/asesorias/cupos" className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-2.5 font-semibold text-white">
            Crear cupo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(s => (
            <div key={s.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                    s.status === "disponible"
                      ? "bg-emerald-50 text-emerald-700"
                      : s.status === "ocupado"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {s.status}
                </span>
                {/* sin iconos en el header */}
              </div>

              <div className="space-y-3 px-5 py-4">
                <div className="text-sm font-semibold text-blue-600">{s.category}</div>
                <div className="text-lg font-semibold text-neutral-900">{s.service}</div>

                <div className="space-y-2 text-sm text-neutral-700">
                  <div className="flex items-center gap-2"><span className="font-medium">Fecha:</span><span>{formatDateEs(s.date)}</span></div>
                  <div className="flex items-center gap-2"><span className="font-medium">Hora:</span><span>{s.time} - {endTime(s.time, s.duration)}</span></div>
                  <div className="flex items-center gap-2"><span className="font-medium">Lugar:</span><span>{s.location} - {s.room}</span></div>
                  <div className="flex items-center gap-2"><span className="font-medium">Duración:</span><span>{s.duration} min</span></div>
                  {s.notes && <div className="flex items-start gap-2"><span className="font-medium">Notas:</span><span>{s.notes}</span></div>}
                </div>

                {s.student && (
                  <div className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">
                    {s.student.name} — {s.student.email}
                  </div>
                )}
              </div>

              {/* acciones según estado */}
              {(s.status === "disponible" || s.status === "cancelado") && (
                <div className="flex gap-2 border-t border-slate-100 p-4">
                  {s.status === "disponible" && (
                    <button
                      onClick={() => startEdit(s.id)}
                      className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Modificar
                    </button>
                  )}
                  <button
                    onClick={() => openDelete(s.id)}
                    className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                  >
                    Eliminar
                  </button>
                </div>
              )}
              {/* ocupado: sin acciones */}
            </div>
          ))}
        </div>
      )}

      {/* Modal editar */}
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-neutral-900">Modificar cupo</h3>
              <button onClick={() => setEditing(null)} className="h-8 w-8 rounded-md text-xl text-neutral-500 hover:bg-slate-100">×</button>
            </div>

            <div className="space-y-3 px-5 py-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-900">Categoría</label>
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
                >
                  <option>Asesoría Académica</option>
                  <option>Investigación</option>
                  <option>Tesis y Proyectos</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-900">Servicio</label>
                <select
                  value={editing.service}
                  onChange={(e) => setEditing({ ...editing, service: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
                >
                  <option>Asesoría Individual</option>
                  <option>Asesoría Grupal</option>
                  <option>Revisión de Documentos</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-900">Fecha</label>
                  <input
                    type="date"
                    min={todayLocalISO()}
                    value={editing.date}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (isPastISO(v)) { notify("No puedes seleccionar fechas pasadas","error"); return; }
                      if (isWeekendISO(v)) { notify("No se permiten fines de semana","error"); return; }
                      setEditing({ ...editing, date: v });
                    }}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-900">Hora inicio</label>
                  <input
                    type="time"
                    min="09:00"
                    max="06:00"
                    step={60 * 5}
                    value={editing.time}
                    onChange={(e) => setEditing({ ...editing, time: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Jornada permitida: 09:00 AM – 06:00 PM</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-900">Duración (min)</label>
                  <select
                    value={editing.duration}
                    onChange={(e) => setEditing({ ...editing, duration: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
                  >
                    <option value={30}>30</option>
                    <option value={60}>60</option>
                    <option value={90}>90</option>
                    <option value={120}>120</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-900">Sala</label>
                  <input
                    value={editing.room}
                    onChange={(e) => setEditing({ ...editing, room: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
                    placeholder="Ej: Sala 201"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-900">Ubicación</label>
                  <input
                    value={editing.location}
                    onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
                    placeholder="Ej: Edificio A"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-900">Notas adicionales</label>
                  <textarea
                    value={editing.notes ?? ""}
                    onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                    className="h-24 w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
                    placeholder="Instrucciones, recordatorios, etc."
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-200 px-5 py-4">
              <button onClick={() => setEditing(null)} className="flex-1 rounded-full border-2 border-slate-200 px-5 py-2 font-semibold text-neutral-700 hover:border-blue-600 hover:text-blue-600">
                Cancelar
              </button>
              <button onClick={saveEdit} className="flex-1 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-2 font-semibold text-white">
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar cambios */}
      {confirmPatch && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-neutral-900">Confirmar cambios</h3>
            </div>
            <div className="space-y-2 px-5 py-4 text-sm text-neutral-800">
              <div><span className="font-semibold">Fecha:</span> {formatDateEs(confirmPatch.date)}</div>
              <div><span className="font-semibold">Hora:</span> {confirmPatch.time} – {endTime(confirmPatch.time, confirmPatch.duration)}</div>
              <div><span className="font-semibold">Lugar:</span> {confirmPatch.location} — {confirmPatch.room}</div>
              <div><span className="font-semibold">Duración:</span> {confirmPatch.duration} min</div>
              {confirmPatch.notes && <div><span className="font-semibold">Notas:</span> {confirmPatch.notes}</div>}
            </div>
            <div className="flex gap-2 border-t border-slate-200 px-5 py-4">
              <button onClick={() => setConfirmPatch(null)} className="flex-1 rounded-full border-2 border-slate-200 px-5 py-2 font-semibold text-neutral-700 hover:border-blue-600 hover:text-blue-600">
                Volver
              </button>
              <button onClick={confirmSaveYes} className="flex-1 rounded-full bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700">
                Confirmar y guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-neutral-900">Eliminar cupo</h3>
            </div>
            <div className="space-y-2 px-5 py-4 text-sm text-neutral-800">
              <p className="text-neutral-700">¿Seguro que deseas eliminar este cupo?</p>
              <div><span className="font-semibold">Servicio:</span> {confirmDelete.service}</div>
              <div><span className="font-semibold">Fecha:</span> {formatDateEs(confirmDelete.date)}</div>
              <div><span className="font-semibold">Hora:</span> {confirmDelete.time} – {endTime(confirmDelete.time, confirmDelete.duration)}</div>
            </div>
            <div className="flex gap-2 border-t border-slate-200 px-5 py-4">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-full border-2 border-slate-200 px-5 py-2 font-semibold text-neutral-700 hover:border-blue-600 hover:text-blue-600">
                Cancelar
              </button>
              <button onClick={confirmDeleteYes} className="flex-1 rounded-full bg-rose-600 px-5 py-2 font-semibold text-white hover:bg-rose-700">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className={`fixed right-4 top-24 z-[60] rounded-lg px-4 py-2 text-white shadow-lg ${
          toast.tone === "success" ? "bg-emerald-600" : toast.tone === "error" ? "bg-rose-600" : "bg-blue-600"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
