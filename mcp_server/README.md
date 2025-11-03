# Servidor MCP

Este **Servidor MCP** es el encargado de la integración entre el **LLM** y **Google Calendar**.  
Expone un conjunto de *tools* que permiten crear, listar, actualizar y eliminar eventos de calendario desde la conversación con el asistente.

---

## Requisitos

- **Python** >= 3.13  
- Credenciales de **Google Cloud** con acceso a la Calendar API  

---

## Instalación

Accede al directorio del servidor MCP e instala las dependencias:

```bash
cd mcp_server
uv venv --python 3.13
source .venv/bin/activate
uv sync
```

Copia el archivo `.env.example` a `.env` y completa las credenciales necesarias:

```bash
cp .env.example .env
```

Variables necesarias:

```
GOOGLE_HEADLESS=false
DEFAULT_TZ=America/Santiago
DEFAULT_CALENDAR_ID=primary
GOOGLE_CLIENT_ID=(TU_ID_APP)
GOOGLE_CLIENT_SECRET=(TU_SECRET_APP)
```

---

## Ejecución

Para iniciar el servidor MCP con Inspector:

```bash
uv run --with mcp mcp dev main.py 
```

---

## Tools disponibles

El servidor MCP implementa las siguientes herramientas:

- **event_create** → Crea un evento en Google Calendar con soporte de asistentes.
- **event_delete_by_id** → Elimina un evento existente de Google Calendar por su event_id (Google).
- **event_patch_attendees** → Actualiza el estado de los asistentes (por ejemplo, cuando un docente confirma o cancela su asistencia).

---

## Integraciones

- **Google Calendar API** → Para la gestión de eventos en la nube.  

---

## Notas

- Este servicio sigue principios de **Arquitectura Limpia**.  
- Puede ejecutarse de manera independiente o en conjunto con el **Backend** y el **Frontend**.  
