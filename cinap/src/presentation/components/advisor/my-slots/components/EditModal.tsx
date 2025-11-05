"use client";

import type { MySlot } from "@/domain/advisor/mySlots";
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
    <div 
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setEditing(null);
      }}
    >
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header con gradiente */}
        <div className="h-20 bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <button
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200"
            onClick={() => setEditing(null)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="px-6 py-6 -mt-6 relative">
          {/* Ícono del modal */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full shadow-xl border-4 border-white flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">Modificar cupo</h3>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Fecha</label>
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
                className="w-full rounded-xl border-2 border-blue-200 bg-white/90 px-4 py-3 text-gray-900 outline-none transition-all duration-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Hora inicio</label>
              <input
                type="time"
                min="09:00"
                max="18:00"
                step={60 * 5}
                value={editing.time}
                onChange={(e) => setEditing({ ...editing, time: e.target.value })}
                className="w-full rounded-xl border-2 border-blue-200 bg-white/90 px-4 py-3 text-gray-900 outline-none transition-all duration-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 focus:bg-white"
              />
              <p className="mt-1 text-xs text-gray-500">Jornada permitida: 09:00 – 18:00</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Duración (min)</label>
              <input
                value={editing.duration}
                readOnly
                className="w-full rounded-xl border-2 border-blue-200 bg-blue-50/50 px-4 py-3 text-gray-900 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Sala</label>
                <input
                  value={editing.room}
                  readOnly
                  className="w-full rounded-xl border-2 border-blue-200 bg-blue-50/50 px-4 py-3 text-gray-900 cursor-not-allowed"
                  placeholder="Ej: Sala 201"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Ubicación</label>
                <input
                  value={editing.location}
                  readOnly
                  className="w-full rounded-xl border-2 border-blue-200 bg-blue-50/50 px-4 py-3 text-gray-900 cursor-not-allowed"
                  placeholder="Ej: Edificio A"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Notas adicionales</label>
              <textarea
                value={editing.notes ?? ""}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                className="h-24 w-full rounded-xl border-2 border-blue-200 bg-white/90 px-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 focus:bg-white"
                placeholder="Instrucciones, recordatorios, etc."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8">
            <button 
              onClick={() => setEditing(null)} 
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
            >
              Cancelar
            </button>
            <button 
              onClick={saveEdit} 
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-yellow-500 hover:from-blue-700 hover:to-yellow-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
