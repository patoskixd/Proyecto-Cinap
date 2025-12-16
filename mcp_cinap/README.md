# MCP — Base de Datos (CINAP)

El **Servidor MCP-BD** conecta el **LLM** con la **base de datos PostgreSQL** del sistema CINAP para consultar y operar, de forma controlada, sobre disponibilidad, asesorías y metadatos vinculados a calendario.  

---

## Requisitos

- **Python** ≥ 3.13  
- **PostgreSQL** ≥ 16  

---

## Instalación

Accede al directorio del servidor MCP e instala las dependencias:

```bash
cd mcp_cinap
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
DATABASE_URL=postgresql+asyncpg://usuario:password@localhost:5432/cinap
DEFAULT_TZ=America/Santiago
GOOGLE_TOKEN_CIPHER_KEY=tu_clave_de_cifrado
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

- **list_advisors** | Lista todos los asesores activos.
- **list_services** | Lista todos los servicios disponibles.
- **resolve_advisor** | Resuelve/busca un asesor por nombre. Si hay un único match, retorna detalle; si no, candidatos.
- **resolve_service** | Resuelve/busca un servicio por nombre. Si hay un único match, retorna detalle con asesores; si no, candidatos.
- **check_availability** | Busca cupos abiertos por servicio y, opcionalmente, por asesor dentro de un rango.
- **list_asesorias** | Lista asesorías del usuario autenticado dentro de un rango.
- **schedule_asesoria** | Reserva una asesoría para un docente con un asesor y servicio.
- **calendar_event_upsert** | Guarda o actualiza el vínculo con un evento de Google Calendar.
- **cancel_asesoria** | Cancela una asesoría pendiente/confirmada y marca el cupo como CANCELADO.  
- **confirm_asesoria** | Confirma la asistencia del docente, cambiando estado a CONFIRMADA.
- **semantic_search** | Búsqueda semántica (RAG) de conocimiento institucional/FAQ. Trae el mejor snippet o el primer resultado truncado a ~700 chars.

---

## Notas

- Este servicio sigue principios de **Arquitectura Limpia**.  
- Puede ejecutarse de manera independiente o en conjunto con el **Backend** y el **Frontend**.  
### Instalaci?n con requirements.txt

Si prefieres instalar rapido con pip, en este servicio basta con:

```bash
pip install -r requirements.txt
```
