"use client";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 py-4 sm:py-5">
          <div className="px-6">
            <h3 className="text-lg font-bold text-blue-900 sm:text-xl text-center">{title}</h3>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6">
          <p className="text-gray-600 text-center mb-6 leading-relaxed">{message}</p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 bg-red-100/80 backdrop-blur-sm border border-red-200/50 text-red-700 font-medium rounded-xl shadow-md hover:bg-red-200/80 hover:shadow-lg transition-all duration-200"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
