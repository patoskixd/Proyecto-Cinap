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
    <div 
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header con gradiente */}
        <div className="h-16 bg-gradient-to-r from-yellow-500 via-yellow-600 to-blue-600 relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6 -mt-4 relative">
          {/* Ícono de confirmación */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full shadow-xl border-4 border-white flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 text-center mb-4">Confirmar cambios</h3>
          
          <div className="space-y-3 bg-gradient-to-br from-blue-50/50 to-yellow-50/30 rounded-xl p-4 border border-blue-200/50">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <span className="font-semibold text-gray-700">Fecha:</span>
                <p className="text-gray-900">{formatDateEs(patch.date)}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <span className="font-semibold text-gray-700">Hora:</span>
                <p className="text-gray-900">{patch.time} – {endTime(patch.time, patch.duration)}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <span className="font-semibold text-gray-700">Lugar:</span>
                <p className="text-gray-900">{patch.location} — {patch.room}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <span className="font-semibold text-gray-700">Duración:</span>
                <p className="text-gray-900">{patch.duration} min</p>
              </div>
            </div>
            
            {patch.notes && (
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <div className="flex-1">
                  <span className="font-semibold text-gray-700">Notas:</span>
                  <p className="text-gray-900">{patch.notes}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button 
              onClick={onCancel} 
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
            >
              Volver
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onCancel();
              }} 
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-yellow-500 hover:from-blue-700 hover:to-yellow-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Confirmar y guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
