"use client";

import type { MySlot } from "@domain/mySlots";
import { isPastISO, isWeekendISO, todayLocalISO, validStartWithinShift } from "../utils/time";

type Props = {
  editing: MySlot;
  setEditing: (s: MySlot | null) => void;
  onConfirm: (patch: MySlot) => void;
  notify: (msg: string, tone?: "info" | "success" | "error") => void;
};

export default function EditModal({ editing, setEditing, onConfirm, notify }: Props) {
  const saveEdit = () => {

    if (isPastISO(editing.date)) { notify("No puedes seleccionar fechas pasadas", "error"); return; }
    if (isWeekendISO(editing.date)) { notify("No hay cupos en fines de semana", "error"); return; }


    if (!validStartWithinShift(editing.time, editing.duration)) {
      notify("Horario fuera de la jornada (09:00–18:00)", "error");
      return;
    }

    onConfirm({ ...editing });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-neutral-900">Modificar cupo</h3>
          <button onClick={() => setEditing(null)} className="h-8 w-8 rounded-md text-xl text-neutral-500 hover:bg-slate-100">×</button>
        </div>

        <div className="space-y-3 px-5 py-4">
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
              max="18:00"
              step={60 * 5}
              value={editing.time}
              onChange={(e) => setEditing({ ...editing, time: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
            />
            <p className="mt-1 text-xs text-neutral-500">Jornada permitida: 09:00 – 18:00</p>
          </div>

          {/* Duración */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-neutral-900">Duración (min)</label>
            <input
              value={editing.duration}
              readOnly
              className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-neutral-900"
            />
          </div>

          {/* Sala y Ubicación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-neutral-900">Sala</label>
              <input
                value={editing.room}
                readOnly
                className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-neutral-900"
                placeholder="Ej: Sala 201"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-neutral-900">Ubicación</label>
              <input
                value={editing.location}
                readOnly
                className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-neutral-900"
                placeholder="Ej: Edificio A"
              />
            </div>
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
  );
}
