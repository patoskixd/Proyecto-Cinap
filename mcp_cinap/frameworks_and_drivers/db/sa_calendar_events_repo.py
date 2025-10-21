from __future__ import annotations
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from application.ports import CalendarEventsRepo

class SqlAlchemyCalendarEventsRepo(CalendarEventsRepo):
    def __init__(self, session: AsyncSession):
        self.s = session

    async def upsert_calendar_event(
        self, *,
        asesoria_id: str,
        organizer_usuario_id: str,
        calendar_event_id: str,
        html_link: Optional[str] = None
    ) -> None:
        q_uid = text("""
            SELECT id FROM user_identity 
            WHERE usuario_id = :org_uid AND provider = 'google'
            LIMIT 1
        """)
        row = (await self.s.execute(q_uid, {"org_uid": organizer_usuario_id})).first()
        if not row:
            raise RuntimeError(
                "No existe user_identity Google para el organizador. "
                "Conecta Google (provider='google') antes de crear asesorías."
            )
        user_identity_id = row[0]

        sql = text("""
            INSERT INTO calendar_event (
                asesoria_id,
                user_identity_id,
                provider,
                calendar_event_id,
                calendar_html_link
            )
            VALUES (CAST(:asesoria_id AS uuid), :user_identity_id, 'google', :event_id, :html_link)
            ON CONFLICT (provider, calendar_event_id) DO UPDATE
            SET
                user_identity_id   = EXCLUDED.user_identity_id,
                calendar_html_link = EXCLUDED.calendar_html_link,
                actualizado_en     = now()
        """)
        await self.s.execute(sql, {
            "asesoria_id": asesoria_id,
            "user_identity_id": user_identity_id,
            "event_id": calendar_event_id,
            "html_link": html_link,
        })
        await self.s.commit()