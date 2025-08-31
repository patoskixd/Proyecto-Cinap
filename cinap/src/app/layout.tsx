import type { Metadata } from "next";
import "@/presentation/styles/globals.css";
import Navbar from "@/presentation/components/shared/layout/Navbar";
import Footer from "@/presentation/components/shared/layout/Footer";

export const metadata: Metadata = {
  title: "CINAP UCT",
  description: "IA para reservar, modificar y cancelar asesorías docentes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full bg-[--background] text-[--foreground]">
      <body className="min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 pt-[72px]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

