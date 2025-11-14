# Backend (FastAPI)

El **Backend** del Proyecto CINAP está desarrollado con **FastAPI**.  
Su función principal es manejar la lógica de negocio, exponer la API REST y coordinar la comunicación entre el **Frontend** y el **Servidor MCP**.

---

## Requisitos

- **Python** >= 3.13  
- **PostgreSQL** >= 17  
- **Docker Engine** >= 28.3.3
- **vLLM** >= 0.10.1.1
- **Redis** >= 7-alpine
- Credenciales de **Telegram Bot API**

---

## Instalación

Accede al directorio del backend e instala las dependencias:

```bash
cd backend
uv venv --python 3.13
source .venv/bin/activate
uv sync
```

Copia el archivo `.env.example` a `.env` y completa las credenciales necesarias:

```bash
cp .env.example .env
```

Ejemplo de `.env`:

```
# Configuración de LLM / vLLM
VLLM_BASE_URL=http://localhost:8000/v1
VLLM_API_KEY=dummy
LLM_MODEL=Qwen/Qwen3-4B
LLM_TIMEOUT=180

# Configuración del Servidor MCP
MCP_COMMAND=uv
MCP_ARGS=run --with mcp mcp run main.py
MCP_CWD=./mcp_server

# CORS y entorno
CORS_ORIGINS=http://localhost:3000
APP_ENV=dev

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=app
DB_USER=postgres
DB_PASSWORD=postgres

# Google OAuth
GOOGLE_CLIENT_ID=dummy-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=dummy-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
GOOGLE_TOKEN_CIPHER_KEY=base64-fernet-key

# JWT
JWT_SECRET=supersecreto
JWT_ISSUER=api
JWT_MINUTES=1440
FRONTEND_ORIGIN=http://localhost:3000

# Roles del sistema
TEACHER_ROLE_ID=00000000-0000-0000-0000-000000000001

# Bot de Telegram
BOT_TOKEN=dummy-telegram-token
TELEGRAM_BOT_USERNAME=ChatBot
```

---

## Ejecución

Para iniciar el backend en desarrollo:

```bash
uv run uvicorn app.frameworks_drivers.web.fastapi_app:app --port 8000
```

Si necesitas exponer únicamente los webhooks (Telegram / Google Calendar) en otro puerto o detrás de un proxy inverso:

```bash
uv run uvicorn app.frameworks_drivers.web.fastapi_app:webhook_app --port 8011
```

Apunta tu proxy o túnel público (por ejemplo `https://asesorias.webhook.inf.uct.cl`) al segundo servicio para que los webhooks de terceros lleguen correctamente.

En producción, se recomienda usar un servidor ASGI como **Uvicorn + Gunicorn** o **Hypercorn**, junto con un **proxy reverso** (Nginx/Caddy).

---

## Endpoints principales

- `/auth/google` → Autenticación con Google OAuth 2.0  
- `/events/...` → Endpoints para gestión de eventos (creados vía MCP)  
- `/users/...` → Endpoints para gestión de usuarios  
- `/telegram/...` → Webhook del bot de Telegram  
- `/assistant/chat` → Endpoint de chat con el agente LangGraph  

---

## Integraciones

- **vLLM** → Inferencia del modelo de lenguaje.  
- **Servidor MCP** → Manejo de herramientas para Google Calendar.  
- **PostgreSQL** → Persistencia de datos.  
- **Telegram Bot API** → Agendamiento y consultas mediante chat/voz.  
- **Google OAuth 2.0** → Integración para acceso a Google Calendar.  

---

## Notas

- Este servicio sigue principios de **Arquitectura Limpia**.  
- Maneja seguridad mediante **JWT** y control de roles.  
- Se conecta con el frontend vía CORS y expone un webhook para Telegram.  
- Genera `GOOGLE_TOKEN_CIPHER_KEY` con `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` y reutiliza el mismo valor en todos los servicios que leen tokens desde la base de datos.
