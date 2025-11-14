"use client";

export function ErrorModal({ message, onClose }: { message: string | null; onClose?: () => void }) {
  if (!message) return null;

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
          <h3 className="text-xl font-bold text-blue-900">Error al agendar</h3>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6">
          <p className="text-center text-gray-600 mb-6">{message}</p>

          <button
            onClick={handleClose}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-100/80 backdrop-blur-sm border border-red-200/50 text-red-700 font-semibold rounded-xl shadow-md hover:bg-red-200/80 hover:shadow-lg transition-all duration-200"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
