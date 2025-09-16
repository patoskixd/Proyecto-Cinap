from __future__ import annotations
from typing import Callable, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.use_cases.asesorias.create_asesorias import CreateAsesoria
from app.use_cases.ports.asesoria_port import CreateAsesoriaIn
from app.use_cases.ports.token_port import JwtPort
from app.interface_adapters.gateways.db.sqlalchemy_asesoria_repo import SqlAlchemyAsesoriaRepo
from app.interface_adapters.gateways.db.sqlalchemy_slots_repo import SqlAlchemySlotsRepo
from app.interface_adapters.orm.models_scheduling import (
    CategoriaModel, ServicioModel, AsesorPerfilModel, AsesorServicioModel, CupoModel
)
from app.interface_adapters.orm.models_auth import UsuarioModel


class CreateAsesoriaBody(BaseModel):
    cupoId: str = Field(..., alias="cupo_id")
    origen: str | None = None
    notas: str | None = None

def make_asesorias_router(*, get_session_dep: Callable[[], AsyncSession], jwt_port: JwtPort) -> APIRouter:
    r = APIRouter(prefix="/api/asesorias", tags=["asesorias"])

    def ensure_user(req: Request) -> dict[str, Any]:
        token = req.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
        try:
            return jwt_port.decode(token)
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    @r.post("", status_code=201)
    async def create_asesoria(
        request: Request,
        body: CreateAsesoriaBody,
        db: AsyncSession = Depends(get_session_dep),
    ):
        data = ensure_user(request)
        usuario_id = str(data.get("sub"))
        usecase = CreateAsesoria(SqlAlchemyAsesoriaRepo(db))
        out = await usecase.exec(
            CreateAsesoriaIn(
                docente_usuario_id=usuario_id,
                cupo_id=body.cupoId,
                origen=body.origen,
                notas=body.notas,
            )
        )
        return out

    @r.get("/create-data")
    async def create_data(
        request: Request,
        db: AsyncSession = Depends(get_session_dep),
    ):
        token = request.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
        try:
            jwt_port.decode(token)
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

        cupos_abiertos = (await db.execute(
            select(CupoModel.servicio_id, CupoModel.asesor_id)
            .where(CupoModel.estado == "ABIERTO")
        )).all()
        servicios_con_cupo = set(str(sid) for sid, _ in cupos_abiertos)
        asesores_por_servicio = {}
        for sid, aid in cupos_abiertos:
            asesores_por_servicio.setdefault(str(sid), set()).add(str(aid))
        svcs = (await db.execute(select(ServicioModel).where(ServicioModel.activo == True))).scalars().all()
        services_by_cat = {}
        for s in svcs:
            if str(s.id) not in servicios_con_cupo:
                continue
            services_by_cat.setdefault(str(s.categoria_id), []).append({
                "id": str(s.id),
                "categoryId": str(s.categoria_id),
                "name": s.nombre,
                "description": "",
                "duration": f"{s.duracion_minutos} min",
            })
        cats = (await db.execute(select(CategoriaModel).where(CategoriaModel.activo == True))).scalars().all()
        categories = [
            {"id": str(c.id), "icon": "🎓", "name": c.nombre, "description": c.descripcion or ""}
            for c in cats if str(c.id) in services_by_cat
        ]
        asesores = (await db.execute(
            select(AsesorPerfilModel, UsuarioModel)
            .join(UsuarioModel, UsuarioModel.id == AsesorPerfilModel.usuario_id)
            .where(AsesorPerfilModel.activo == True)
        )).all()
        asesores_dict = {str(a[0].id): a for a in asesores}

        asesores_servicio = (await db.execute(select(AsesorServicioModel))).scalars().all()
        advisors_by_service = {}
        for asv in asesores_servicio:
            sid = str(asv.servicio_id)
            aid = str(asv.asesor_id)
            if sid not in servicios_con_cupo:
                continue
            if aid not in asesores_por_servicio.get(sid, set()):
                continue
            asesor_tuple = asesores_dict.get(aid)
            if asesor_tuple:
                asesor, usuario = asesor_tuple
                advisors_by_service.setdefault(sid, []).append({
                    "id": str(asesor.id),
                    "name": usuario.nombre,
                    "email": usuario.email,
                    "specialties": [],
                })


        times = [f"{h:02d}:00" for h in range(8, 19)]

        return {
            "categories": categories,
            "servicesByCategory": services_by_cat,
            "advisorsByService": advisors_by_service,
            "times": times,
        }

    return r
