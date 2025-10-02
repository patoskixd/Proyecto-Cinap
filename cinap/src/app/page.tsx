"use client";
import Hero from "@/presentation/components/home/Hero";
import Features from "@/presentation/components/home/Features";
import Benefits from "@/presentation/components/home/Benefits";
import CTA from "@/presentation/components/home/CTA";

// Página principal de la aplicación
// Muestra secciones como Hero, Features, Benefits y CTA
// Cada sección es un componente separado importado desde presentation/components/home
// Esta página sirve como landing page para los usuarios que visitan el sitio

export default function Home() {
  return (
    <>
    <Hero/>
    <Features/>
    <Benefits/>
    <CTA/> 
    </>
  );
}
