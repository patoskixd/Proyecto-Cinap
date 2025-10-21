from __future__ import annotations
import uuid
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select

from zoneinfo import ZoneInfo

from app.interface_adapters.orm.models_scheduling import AsesorPerfilModel
from app.use_cases.ports.confirmations_port import AdvisorConfirmationsRepo, PendingConfirmationDTO


CL_TZ = ZoneInfo("America/Santiago")

def _slugify_categoria(nombre: str) -> str:
    n = (nombre or "").strip().lower()
    if "matem" in n:  return "matematicas"
    if "físic" in n or "fisic" in n: return "fisica"
    if "químic" in n or "quimic" in n: return "quimica"
    if "program" in n: return "programacion"
    return "programacion"

class SqlAlchemyAdvisorConfirmationsRepo(AdvisorConfirmationsRepo):
    def __init__(self, session: AsyncSession):
        self.s = session

    async def resolve_asesor_id(self, usuario_id: str) -> str | None:
        q = select(AsesorPerfilModel.id).where(AsesorPerfilModel.usuario_id == uuid.UUID(usuario_id))
        x = (await self.s.execute(q)).scalar_one_or_none()
        return str(x) if x else None

    async def get_pending_for(self, asesor_id: str) -> list[PendingConfirmationDTO]:
        sql = text("""
            SELECT
              asesoria_id,
              estado,
              creado_en,
              servicio_nombre,
              categoria_nombre,
              docente_nombre,
              docente_email,
              inicio,
              fin,
              campus_nombre,
              edificio_nombre,
              recurso_alias,
              sala_numero
            FROM pending_confirmations_v
            WHERE asesor_id = :asesor_id
            ORDER BY creado_en DESC
        """)
        rows = (await self.s.execute(sql, {"asesor_id": uuid.UUID(asesor_id)})).mappings().all()

        out: list[PendingConfirmationDTO] = []
        for r in rows:
            inicio = r["inicio"]
            inicio_local = inicio.astimezone(CL_TZ) if inicio.tzinfo else inicio
            category_label = r["categoria_nombre"] or ""
            category_slug = _slugify_categoria(category_label)
            location = " / ".join([x for x in [r["campus_nombre"], r["edificio_nombre"]] if x])
            room = " ".join([x for x in [r["recurso_alias"], r["sala_numero"]] if x])

            out.append({
                "id": str(r["asesoria_id"]),
                "category": category_slug,
                "categoryLabel": category_label,
                "serviceTitle": r["servicio_nombre"] or "",
                "teacher": r["docente_nombre"] or "",
                "teacherEmail": r["docente_email"] or "",
                "dateISO": inicio_local.date().isoformat(),
                "time": inicio_local.strftime("%H:%M"),
                "location": location,
                "room": room,
                "createdAtISO": (r["creado_en"].astimezone(CL_TZ).isoformat() if getattr(r["creado_en"], "tzinfo", None) else r["creado_en"].isoformat()),
                "status": "pending",
            })
        return out
