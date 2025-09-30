# Servidor MCP

El **Servidor MCP** es el encargado de la integración entre el **LLM** y **Google Calendar**.  
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
GOOGLE_CREDENTIALS_FILE=credentials.json
GOOGLE_TOKEN_FILE=token.json
GOOGLE_HEADLESS=false
DEFAULT_TZ=America/Santiago
DEFAULT_CALENDAR_ID=primary
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

- **event_create** → Crea un evento en Google Calendar.  
- **event_list** → Lista eventos dentro de un rango de fechas.  
- **event_get** → Obtiene un evento por ID.  
- **event_find** → Busca un evento específico por título en un rango de fechas. 
- **event_update** → Modifica un evento existente (fecha, hora, título, descripción, asistentes).  
- **event_delete** → Elimina un evento por ID o título.  

---

## Integraciones

- **Google Calendar API** → Para la gestión de eventos en la nube.  

---

## Notas

- Este servicio sigue principios de **Arquitectura Limpia**.  
- Puede ejecutarse de manera independiente o en conjunto con el **Backend** y el **Frontend**.  
