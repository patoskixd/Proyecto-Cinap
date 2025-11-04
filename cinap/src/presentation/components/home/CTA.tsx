
import Link from "next/link";
// Seccion de llamado a la accion en la pagina principal
// Incluye un titulo, descripcion y boton para comenzar gratis
// Se usa en la pagina principal (Home) para invitar a los usuarios a registrarse
export default function CTA() {
    return (
        <section className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-24 text-center text-white">
        <div className="mx-auto max-w-[800px]">
          <h2 className="text-balance text-3xl font-bold sm:text-4xl">¿Listo para optimizar tus asesorías?</h2>
          <p className="mx-auto mt-4 max-w-[700px] text-lg opacity-90">
            Únete a cientos de docentes que ya confían en nuestra IA para gestionar sus asesorías de manera eficiente
          </p>

          <Link
            href="/auth/login"
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-lg font-bold text-blue-600 shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)]"
          >
            <span>Comenzar Gratis</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </Link>
        </div>
      </section>
    );
}