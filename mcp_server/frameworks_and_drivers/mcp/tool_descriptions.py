EVENT_CREATE_DESC = """
Create a new event. \
Required: title, start, end. Optionals: calendar_id (default 'primary'), description, location, attendees[]. \
Dates in ISO 8601 with timezone.
"""

EVENT_LIST_DESC = """
Lists events in a certain range. \
Required: start_from, end_to. Opcional: calendar_id (default 'primary'). \
"Example: {\"start_from\":\"2025-09-01T00:00:00-04:00\",\"end_to\":\"2025-09-07T23:59:59-04:00\"}.
"""

EVENT_GET_DESC = """
Get event by ID. \
Required: event_id. Opcional: calendar_id (default 'primary').
"""

EVENT_DELETE_DESC = """
Delete events by ID or Title. \
If using title, window of time required (or use the default). \
Allow multiple deletes with allow_multiple=true.
"""

EVENT_FIND_DESC = """
Search event by title. \
Required: title. Optionals: start_from/end_to (if missing, use default range), calendar_id. \
Example: {\"title\":\"Reunión de asesoría\"
"""

EVENT_UPDATE_DESC = """
Update or reprogram existing event or meeting. \
Identification by `selector.event_id` or `selector.title` (+ optional window start_from/end_to). \
`patch` can have absolute (title/start/end/attendees/location/description) or relative changes \
(shift_days, shift_minutes, new_date, new_start_time, new_end_time, keep_duration). \
If window is missing, a default range is used (now-30d → now+365d). \
Example: \
{\
   \"selector\": {\"title\": \"Daily standup\", \"start_from\":\"2025-09-01T00:00:00-04:00\", \"end_to\":\"2025-09-07T23:59:59-04:00\"}, \
   \"patch\": {\"shift_days\": 1} \
}
"""