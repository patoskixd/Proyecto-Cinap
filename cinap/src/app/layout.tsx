import type { Metadata } from "next";
import "@/presentation/styles/globals.css";
import Navbar from "@/presentation/components/layout/Navbar";
import Footer from "@/presentation/components/layout/Footer";

export const metadata: Metadata = {
  title: "CINAP UCT",
  description: "IA para reservar, modificar y cancelar asesorías docentes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="bg-[--background] text-[--foreground]">
      <body className="min-h-screen antialiased">
        <Navbar/>
        <main className="pt-[72px]">{children}</main>
        <Footer/>
      </body>
    </html>
  );
}
