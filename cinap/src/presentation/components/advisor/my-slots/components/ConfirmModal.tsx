"use client";

import { MySlot } from "@/domain/advisor/mySlots";
import { endTime, formatDateEs } from "../utils/time";

type Props = {
  patch: MySlot;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({ patch, onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-neutral-900">Confirmar cambios</h3>
        </div>
        <div className="space-y-2 px-5 py-4 text-sm text-neutral-800">
          <div><span className="font-semibold">Fecha:</span> {formatDateEs(patch.date)}</div>
          <div><span className="font-semibold">Hora:</span> {patch.time} – {endTime(patch.time, patch.duration)}</div>
          <div><span className="font-semibold">Lugar:</span> {patch.location} — {patch.room}</div>
          <div><span className="font-semibold">Duración:</span> {patch.duration} min</div>
          {patch.notes && <div><span className="font-semibold">Notas:</span> {patch.notes}</div>}
        </div>
        <div className="flex gap-2 border-t border-slate-200 px-5 py-4">
          <button onClick={onCancel} className="flex-1 rounded-full border-2 border-slate-200 px-5 py-2 font-semibold text-neutral-700 hover:border-blue-600 hover:text-blue-600">
            Volver
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-full bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700">
            Confirmar y guardar
          </button>
        </div>
      </div>
    </div>
  );
}
