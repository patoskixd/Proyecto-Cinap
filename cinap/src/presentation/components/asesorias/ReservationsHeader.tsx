import Link from "next/link"; 

export default function ReservationsHeader() {
        return ( 
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:mb-8 md:p-8">
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center"> 
                    <div> 
                        <h1 className="text-3xl font-bold text-neutral-900">Mis Asesorías</h1> 
                        <p className="mt-1 text-neutral-500">Gestiona y visualiza todas tus reservas de asesorías</p> 
                    </div> 
                <Link href="/asesorias/agendar" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-[0_8px_25px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(37,99,235,0.4)]" > 
                <span>➕</span> Nueva Asesoría </Link> </div> </div> 
        );
    }