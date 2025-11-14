from __future__ import annotations
import uuid
import json
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, update

from app.use_cases.ports.calendar_events_repo import CalendarEventsRepo, PendingCalendarEvent
from app.interface_adapters.orm.models_scheduling import CupoModel
from app.interface_adapters.orm.models_auth import UsuarioModel

class SqlAlchemyCalendarEventsRepo(CalendarEventsRepo):
    def __init__(self, session: AsyncSession, cache=None):
        self.s = session
        self.cache = cache  

    async def map_channel_owner(self, channel_id: str) -> Optional[str]:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Buscando owner para channel_id: {channel_id}")
        
        if self.cache:
            cache_key = f"gc:channel:{channel_id}"
            logger.info(f"Cache key: {cache_key}")
            
            uid = await self.cache.get(cache_key)
            logger.info(f"Cache result: {uid} (type: {type(uid)})")
            
            if uid:
                result = uid.decode() if hasattr(uid, "decode") else uid
                logger.info(f"Usuario encontrado: {result}")
                return result
            else:
                logger.warning(f"No se encontró usuario en cache para channel_id: {channel_id}")
        else:
            logger.error("Cache no disponible")
        return None

    async def upsert_calendar_event(
        self, *,
        asesoria_id: str,
        organizer_usuario_id: str,
        calendar_event_id: str,
        html_link: str | None
    ) -> None:
        # Usar una aproximación más simple evitando el cast 
        import uuid
        
        # Primero buscar el user_identity_id
        user_identity_query = text("""
            SELECT id FROM user_identity 
            WHERE usuario_id = :org_uid AND provider = 'google'
        """)
        
        user_result = await self.s.execute(user_identity_query, {
            "org_uid": organizer_usuario_id
        })
        
        user_identity_row = user_result.fetchone()
        if not user_identity_row:
            raise RuntimeError(
                "No existe user_identity Google para el asesor organizador. "
                "Conecta Google (provider='google') antes de crear asesorías."
            )
        
        user_identity_id = user_identity_row[0]
        
        # Ahora hacer el upsert con parámetros simples
        sql = text("""
            INSERT INTO calendar_event (
                asesoria_id,
                user_identity_id,
                provider,
                calendar_event_id,
                calendar_html_link
            )
            VALUES (:asesoria_id, :user_identity_id, 'google', :event_id, :html_link)
            ON CONFLICT (provider, calendar_event_id) DO UPDATE
            SET
                user_identity_id   = EXCLUDED.user_identity_id,
                calendar_html_link = EXCLUDED.calendar_html_link,
                actualizado_en     = now()
        """)

        params = {
            "asesoria_id": uuid.UUID(asesoria_id),
            "user_identity_id": user_identity_id,
            "event_id": calendar_event_id,
            "html_link": html_link,
        }

        res = await self.s.execute(sql, params)

        # Si no existe user_identity del asesor, el SELECT no devuelve filas y no inserta nada.
        # Detectamos ese caso:
        if res.rowcount in (0, None):
            raise RuntimeError(
                "No existe user_identity Google para el asesor organizador. "
                "Conecta Google (provider='google') antes de crear asesorías."
            )

        await self.s.commit()



    async def list_pending_for_organizer(self, organizer_usuario_id: str) -> list[PendingCalendarEvent]:
        sql = text("""
          SELECT
             a.id   AS asesoria_id,
             a.cupo_id AS cupo_id,
             u.email AS docente_email,               -- email del docente via JOIN
             ce.calendar_event_id AS provider_event_id
          FROM asesoria a
          JOIN calendar_event ce ON ce.asesoria_id = a.id
          JOIN cupo c            ON c.id = a.cupo_id
          JOIN asesor_perfil ap  ON ap.id = c.asesor_id
          JOIN docente_perfil dp ON dp.id = a.docente_id
          JOIN usuario u         ON u.id = dp.usuario_id
          WHERE a.estado = 'PENDIENTE'
            AND ap.usuario_id = CAST(:org_uid AS uuid)
        """)
        rows = (await self.s.execute(sql, {"org_uid": organizer_usuario_id})).mappings().all()
        return [dict(r) for r in rows]

    async def list_pending_and_cancelled_for_organizer(self, organizer_usuario_id: str) -> list[dict]:
        """Obtiene asesorias activas (pendientes, confirmadas o canceladas) para sincronizar con Google Calendar."""
        sql = text("""
          SELECT
             a.id   AS asesoria_id,
             a.estado AS asesoria_estado,
             a.cupo_id AS cupo_id,
             u.email AS docente_email,
             ce.calendar_event_id AS provider_event_id
          FROM asesoria a
          JOIN calendar_event ce ON ce.asesoria_id = a.id
          JOIN cupo c            ON c.id = a.cupo_id
          JOIN asesor_perfil ap  ON ap.id = c.asesor_id
          JOIN docente_perfil dp ON dp.id = a.docente_id
          JOIN usuario u         ON u.id = dp.usuario_id
          WHERE a.estado IN ('PENDIENTE', 'CANCELADA', 'CONFIRMADA')
            AND (
                ap.usuario_id = CAST(:org_uid AS uuid)
                OR dp.usuario_id = CAST(:org_uid AS uuid)
            )
        """)
        rows = (await self.s.execute(sql, {"org_uid": organizer_usuario_id})).mappings().all()
        return [dict(r) for r in rows]

    async def get_calendar_payload(self, asesoria_id: str) -> Optional[dict]:
        """
        Regresa información básica de Calendar y del docente para una asesoría.
        """
        sql = text("""
            SELECT
                ce.calendar_event_id   AS calendar_event_id,
                ce.provider            AS provider,
                ui.usuario_id          AS organizer_usuario_id,
                a.cupo_id              AS cupo_id,
                u.email                AS docente_email
            FROM asesoria a
            LEFT JOIN calendar_event ce ON ce.asesoria_id = a.id
            LEFT JOIN user_identity ui  ON ui.id = ce.user_identity_id
            JOIN docente_perfil dp      ON dp.id = a.docente_id
            JOIN usuario u              ON u.id = dp.usuario_id
            WHERE a.id = CAST(:id AS uuid)
            ORDER BY ce.actualizado_en DESC NULLS LAST
            LIMIT 1
        """)
        row = (await self.s.execute(sql, {"id": asesoria_id})).mappings().first()
        return dict(row) if row else None

    async def mark_confirmed(self, asesoria_id: str) -> None:
        # 1) Asesoría -> CONFIRMADA
        await self.s.execute(
            text("UPDATE asesoria SET estado = 'CONFIRMADA' WHERE id = CAST(:id AS uuid)"),
            {"id": asesoria_id}
        )

        # 2) Cupo asociado -> RESERVADO (vía subconsulta; sirve tanto si venía CANCELADO como ABIERTO)
        await self.s.execute(
            text("""
                UPDATE cupo
                SET estado = 'RESERVADO'
                WHERE id = (
                    SELECT cupo_id
                    FROM asesoria
                    WHERE id = CAST(:id AS uuid)
                )
            """),
            {"id": asesoria_id}
        )

        await self.s.commit()


    async def update_event_state(self, asesoria_id: str, new_state: str) -> None:
        await self.s.execute(
            text("""
                UPDATE asesoria
                SET estado = :state
                WHERE id = CAST(:id AS uuid)
            """),
            {"id": asesoria_id, "state": new_state}
        )

        upper_state = (new_state or "").upper()
        if upper_state == "CANCELADA":
            await self.s.execute(
                text("""
                    UPDATE cupo
                    SET estado = 'CANCELADO'
                    WHERE id = (
                        SELECT cupo_id FROM asesoria WHERE id = CAST(:id AS uuid)
                    )
                """),
                {"id": asesoria_id}
            )
        elif upper_state == "CONFIRMADA":
            await self.s.execute(
                text("""
                    UPDATE cupo
                    SET estado = 'RESERVADO'
                    WHERE id = (
                        SELECT cupo_id FROM asesoria WHERE id = CAST(:id AS uuid)
                    )
                """),
                {"id": asesoria_id}
            )

        await self.s.commit()


    async def mark_rejected_and_free_slot(self, asesoria_id: str, cupo_id) -> None:
        import logging, uuid
        logger = logging.getLogger(__name__)

        logger.info(f"🔧 Marcando asesoría como CANCELADA y cupo CANCELADO: asesoria_id={asesoria_id}, cupo_id={cupo_id}")

        # 1) Asesoría -> CANCELADA
        await self.s.execute(
            text("UPDATE asesoria SET estado = 'CANCELADA' WHERE id = CAST(:id AS uuid)"),
            {"id": asesoria_id}
        )

        # 2) Cupo -> CANCELADO (no liberar a ABIERTO)
        cupo_uuid = uuid.UUID(cupo_id) if isinstance(cupo_id, str) else cupo_id
        await self.s.execute(
            update(CupoModel)
            .where(CupoModel.id == cupo_uuid)
            .values(estado="CANCELADO")
        )

        await self.s.commit()
        logger.info(f"✅ Asesoría {asesoria_id} en CANCELADA y cupo {cupo_id} en CANCELADO")


    async def delete_asesoria_and_mark_cancelled(self, asesoria_id: str, cupo_id) -> None:
        """
        El asesor borró el EVENTO en Google Calendar.
        Política:
        - No borrar la asesoría (se mantiene el histórico)
        - asesoria -> CANCELADA
        - cupo     -> CANCELADO
        - borrar el calendar_event (desvincular de Google)
        """
        import logging, uuid
        logger = logging.getLogger(__name__)
        logger.info(f"🗑️ Google: asesor eliminó evento. Normalizando estados: asesoria_id={asesoria_id}, cupo_id={cupo_id}")

        # 1) Eliminar vínculo con Google (calendar_event)
        await self.s.execute(
            text("DELETE FROM calendar_event WHERE asesoria_id = CAST(:id AS uuid)"),
            {"id": asesoria_id}
        )
        logger.info("📅 calendar_event eliminado")

        # 2) Asesoría -> CANCELADA (idempotente)
        await self.s.execute(
            text("""
                UPDATE asesoria
                SET estado = 'CANCELADA'
                WHERE id = CAST(:id AS uuid)
            """),
            {"id": asesoria_id}
        )
        logger.info("📝 asesoría marcada como CANCELADA")

        # 3) Cupo -> CANCELADO (idempotente)
        cupo_uuid = uuid.UUID(cupo_id) if isinstance(cupo_id, str) else cupo_id
        await self.s.execute(
            update(CupoModel)
            .where(CupoModel.id == cupo_uuid)
            .values(estado="CANCELADO")
        )
        logger.info("🚫 cupo marcado como CANCELADO")

        await self.s.commit()
        logger.info("✅ normalización completada (asesoría CANCELADA, cupo CANCELADO, calendar_event borrado)")

    async def mark_cancelled(self, asesoria_id: str) -> None:
        await self.s.execute(
            text(
                "UPDATE asesoria SET estado = 'CANCELADA' WHERE id = CAST(:id AS uuid)"
            ),
            {"id": asesoria_id},
        )
        await self.s.execute(
            text(
                """
                UPDATE cupo
                SET estado = 'CANCELADO'
                WHERE id = (
                    SELECT cupo_id
                    FROM asesoria
                    WHERE id = CAST(:id AS uuid)
                )
                """
            ),
            {"id": asesoria_id},
        )
        await self.s.commit()

    async def get_channels_for_user(self, usuario_id: str) -> list[str]:
        """Obtiene los channel_ids configurados para un usuario"""
        if not self.cache:
            return []
        
        # Redis no tiene una forma eficiente de buscar por valor, 
        # pero mantenemos una lista de channels por usuario
        user_channels_key = f"gc:user_channels:{usuario_id}"
        channels_bytes = await self.cache.get(user_channels_key)
        
        if channels_bytes:
            try:
                channels = json.loads(channels_bytes.decode())
                return channels if isinstance(channels, list) else []
            except:
                return []
        
        return []

    async def save_channel_owner(self, channel_id: str, usuario_id: str, resource_id: str | None = None) -> None:
        if self.cache:
            # Guardar el mapping channel -> usuario
            await self.cache.set(f"gc:channel:{channel_id}", usuario_id.encode(), ttl_seconds=86_400)
            if resource_id:
                await self.cache.set(f"gc:channel_resource:{channel_id}", resource_id.encode(), ttl_seconds=86_400)
            
            # Mantener lista de channels por usuario
            user_channels_key = f"gc:user_channels:{usuario_id}"
            channels_bytes = await self.cache.get(user_channels_key)
            
            if channels_bytes:
                try:
                    channels = json.loads(channels_bytes.decode())
                    if isinstance(channels, list) and channel_id not in channels:
                        channels.append(channel_id)
                    else:
                        channels = [channel_id]
                except:
                    channels = [channel_id]
            else:
                channels = [channel_id]
            
            await self.cache.set(user_channels_key, json.dumps(channels).encode(), ttl_seconds=86_400)

    async def get_channel_resource(self, channel_id: str) -> Optional[str]:
        if not self.cache:
            return None
        value = await self.cache.get(f"gc:channel_resource:{channel_id}")
        if not value:
            return None
        return value.decode() if hasattr(value, "decode") else value

    async def drop_channel(self, channel_id: str, usuario_id: str | None = None) -> None:
        if not self.cache:
            return
        await self.cache.delete(f"gc:channel:{channel_id}", f"gc:channel_resource:{channel_id}")

        if usuario_id:
            user_channels_key = f"gc:user_channels:{usuario_id}"
            channels_bytes = await self.cache.get(user_channels_key)
            if not channels_bytes:
                return
            try:
                channels = json.loads(channels_bytes.decode())
            except Exception:
                channels = []
            if isinstance(channels, list) and channel_id in channels:
                channels = [ch for ch in channels if ch != channel_id]
                if channels:
                    await self.cache.set(user_channels_key, json.dumps(channels).encode(), ttl_seconds=86_400)
                else:
                    await self.cache.delete(user_channels_key)

    async def get_all_advisors(self) -> list[dict]:
        """Obtiene todos los asesores del sistema"""
        sql = text("""
            SELECT 
                ap.usuario_id,
                u.email,
                u.nombre
            FROM asesor_perfil ap
            JOIN usuario u ON u.id = ap.usuario_id
            WHERE ap.activo = true
        """)

        rows = (await self.s.execute(sql)).mappings().all()
        normalized: list[dict] = []
        for r in rows:
            data = dict(r)
            uid = data.get("usuario_id")
            normalized.append(
                {
                    "usuario_id": str(uid) if uid is not None else None,
                    "email": data.get("email"),
                    "nombre": data.get("nombre"),
                }
            )
        return normalized



    async def get_all_teachers(self) -> list[dict]:
        """Obtiene todos los docentes activos del sistema"""
        sql = text("""
            SELECT 
                dp.usuario_id,
                u.email,
                u.nombre
            FROM docente_perfil dp
            JOIN usuario u ON u.id = dp.usuario_id
            WHERE dp.activo = true
        """)
        rows = (await self.s.execute(sql)).mappings().all()
        normalized: list[dict] = []
        for r in rows:
            data = dict(r)
            uid = data.get("usuario_id")
            normalized.append(
                {
                    "usuario_id": str(uid) if uid is not None else None,
                    "email": data.get("email"),
                    "nombre": data.get("nombre"),
                }
            )
        return normalized

