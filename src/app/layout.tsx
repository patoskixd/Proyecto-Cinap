import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/presentation/components/Navbar";

export const metadata: Metadata = {
  title: "CINAP | Asesorías Programadas",
  description: "IA para reservar, modificar y cancelar asesorías docentes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="bg-[--background] text-[--foreground]">
      <body className="min-h-screen antialiased">
        <Navbar />
        {/* padding-top para no quedar tapado por el navbar fijo */}
        <main className="pt-[72px]">{children}</main>
      </body>
    </html>
  );
}
