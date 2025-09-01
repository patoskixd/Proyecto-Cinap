EVENT_CREATE_DESC = """
CREA un evento nuevo (NO edita existentes). \
Campos requeridos: title, start, end. Opcionales: calendar_id (defecto 'primary'), description, location, attendees[]. \
Fechas en ISO 8601 con zona horaria.
"""

EVENT_LIST_DESC = """
LISTA eventos en un rango. \
Requeridos: start_from, end_to. Opcional: calendar_id (defecto 'primary'). \
"Ej: {\"start_from\":\"2025-09-01T00:00:00-04:00\",\"end_to\":\"2025-09-07T23:59:59-04:00\"}.
"""

EVENT_GET_DESC = """
OBTIENE un evento por ID. \
Requerido: event_id. Opcional: calendar_id (defecto 'primary').
"""

EVENT_DELETE_DESC = """
ELIMINA un evento por ID. \
Requerido: event_id. Opcional: calendar_id (defecto 'primary').
"""

EVENT_FIND_DESC = """
BUSCA un evento por título y devuelve candidato único o ambigüedad. \
Requerido: title. Opcionales: start_from/end_to (si faltan, se usa un rango por defecto), calendar_id. \
Ejemplo: {\"title\":\"Reunión de asesoría\"
"""

EVENT_UPDATE_DESC = """
ACTUALIZA (reprograma/mueve/pospone) un evento EXISTENTE. \
Identificación por `selector.event_id` **o** `selector.title` (+ ventana opcional start_from/end_to). \
`patch` puede tener cambios absolutos (title/start/end/attendees/location/description) o relativos \
(shift_days, shift_minutes, new_date, new_start_time, new_end_time, keep_duration). \
Si seleccionas por título y falta ventana, se usa un rango por defecto (ahora-30d → ahora+365d). \
Ejemplo: \
{\
   \"selector\": {\"title\": \"Daily standup\", \"start_from\":\"2025-09-01T00:00:00-04:00\", \"end_to\":\"2025-09-07T23:59:59-04:00\"}, \
   \"patch\": {\"shift_days\": 1} \
}
"""

EVENT_DELETE_BY_TITLE_DESC = """
ELIMINA un evento por TÍTULO. \
Requerido: title. Opcionales para desambiguar: start_from/end_to (si faltan, se usa un rango por defecto), description_contains, calendar_id. \
Si hay múltiples coincidencias, devuelve candidatos en lugar de eliminar.
"""