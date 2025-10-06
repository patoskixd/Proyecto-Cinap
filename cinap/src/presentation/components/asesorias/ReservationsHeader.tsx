import Link from "next/link"; 

export default function ReservationsHeader() {
  return ( 
    <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg backdrop-blur-sm md:mb-8 md:p-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center"> 
        <div> 
          <h1 className="text-3xl font-bold text-blue-900">Mis Asesorías</h1> 
          <p className="mt-1 text-blue-700">Gestiona y visualiza todas tus reservas de asesorías</p> 
        </div> 
        <Link 
          href="/profesor/asesorias/agendar" 
          className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl hover:scale-105" 
        > 
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nueva Asesoría 
        </Link> 
      </div> 
    </div>
  );
}