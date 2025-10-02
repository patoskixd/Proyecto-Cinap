# Frontend (Next.js)

El **Frontend** del Proyecto CINAP está desarrollado con **Next.js 15** bajo principios de **Arquitectura Limpia**, organizado en capas (**app, application, domain, infrastructure, presentation**).  
Su función principal es proveer una interfaz moderna e intuitiva que conecta a los **Docentes**, **Asesores** y **Administradores** con los servicios del **Backend (FastAPI)** y el **Servidor MCP**.

---

## Requisitos

- **Node.js** >= 22
- **pnpm** >= 9
---

## Instalación

Accede al directorio del frontend e instala las dependencias:

```bash
cd frontend
pnpm install
```
Configura las variables de entorno copiando el archivo .env.local:
```bash
cp .env.local.example .env.local
```
Ejemplo de .env.local:

```ini
NEXT_PUBLIC_API_URL=http://localhost:8000
BACKEND_BASE_URL=http://localhost:8000
ASSISTANT_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE=http://localhost:8000

```
## Ejecución
Para iniciar el frontend en desarrollo:
```bash
pnpm dev
```
El proyecto quedará disponible en:
```bash
http://localhost:3000

```
Para compilar y ejecutar en modo producción:
```bash
pnpm build
pnpm start
```
## Estructura del Proyecto

El frontend está organizado siguiendo Arquitectura Limpia y principios SOLID:
```bash
src/
├── app/               # Entrypoint de Next.js (rutas App Router)
├── application/       # Casos de uso y lógica de aplicación
├── domain/            # Modelos de dominio (asesorías, usuarios, etc.)
├── infrastructure/    # Gateways, integraciones 
└── presentation/      # Componentes UI, hooks y vistas

```

## Integraciones

- Backend (FastAPI) → API REST para gestión de usuarios, asesorías y catálogos.

- Servidor MCP → Asistente conversacional con conexión a Google Calendar.

- TailwindCSS → Estilado responsivo y utilitario.

## Scripts disponibles

- `pnpm dev` → Inicia el servidor de desarrollo con Turbopack.  
- `pnpm build` → Compila el proyecto para producción.  
- `pnpm start` → Inicia el servidor en modo producción.  
- `pnpm lint` → Ejecuta el linter (ESLint + reglas Next.js).  


