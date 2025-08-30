from __future__ import annotations

from datetime import datetime, timedelta, timezone
import uuid
import httpx
import jwt

from fastapi import APIRouter, HTTPException, Depends, Response, Request
from fastapi.responses import RedirectResponse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from app.frameworks_drivers.config.db import get_session
# === Modelos / DB ===
from app.frameworks_drivers.orm.models_auth import (
    UsuarioModel,
    UserIdentityModel,
    RolModel,
)

# === Settings ===
from app.frameworks_drivers.config.settings import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    JWT_SECRET,
    JWT_ISSUER,
    JWT_MINUTES,
    FRONTEND_ORIGIN,
    TEACHER_ROLE_ID,
)

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
SCOPE = "openid email profile https://www.googleapis.com/auth/calendar"

# Normalizamos TEACHER_ROLE_ID a UUID
TEACHER_ROLE_ID = uuid.UUID(str(TEACHER_ROLE_ID))


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _issue_jwt(*, user: UsuarioModel, role_name: str) -> str:
    """Firma un JWT minimalista con el nombre del rol (no el UUID)."""
    now = _now_utc()
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.nombre,
        "role": role_name,  # ← nombre legible del rol (Docente/Asesor/Administrador)
        "iss": JWT_ISSUER,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=int(JWT_MINUTES))).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def _find_user_by_google_sub(session: AsyncSession, sub: str) -> UsuarioModel | None:
    q = (
        select(UsuarioModel)
        .join(UserIdentityModel, UserIdentityModel.usuario_id == UsuarioModel.id)
        .where(
            UserIdentityModel.provider == "google",
            UserIdentityModel.provider_user_id == sub,
        )
        .options(selectinload(UsuarioModel.rol))
    )
    return (await session.execute(q)).scalars().first()


async def _find_user_by_email(session: AsyncSession, email: str) -> UsuarioModel | None:
    q = (
        select(UsuarioModel)
        .where(UsuarioModel.email == email)
        .options(selectinload(UsuarioModel.rol))
    )
    return (await session.execute(q)).scalars().first()


async def _get_role_name_for_user(session: AsyncSession, user_id: uuid.UUID) -> str | None:
    """
    Obtiene el nombre del rol del usuario SIN disparar lazy-load.
    (JOIN explícito para evitar MissingGreenlet en async)
    """
    q = (
        select(RolModel.nombre)
        .join(UsuarioModel, UsuarioModel.rol_id == RolModel.id)
        .where(UsuarioModel.id == user_id)
    )
    return (await session.execute(q)).scalar_one_or_none()


async def _upsert_user(
    session: AsyncSession,
    *,
    email: str,
    name: str | None,
    sub: str,
    refresh_token: str | None = None,
) -> UsuarioModel:
    """
    Busca o crea el Usuario y UserIdentity para Google.
    Devuelve el Usuario con su relación de rol precargada.
    """

    # 1) Buscar por provider_user_id (Google sub)
    user = await _find_user_by_google_sub(session, sub)
    if user:
        # Opcional: actualiza refresh_token si llegó uno nuevo
        ident = (
            await session.execute(
                select(UserIdentityModel).where(
                    UserIdentityModel.provider == "google",
                    UserIdentityModel.provider_user_id == sub,
                )
            )
        ).scalars().first()
        if ident and refresh_token:
            ident.refresh_token_hash = refresh_token
            await session.flush()
        return user

    # 2) Buscar por email para reusar usuario existente
    user = await _find_user_by_email(session, email)

    if not user:
        # Crear usuario nuevo con rol por defecto (Teacher) si no existe
        user = UsuarioModel(
            id=uuid.uuid4(),
            rol_id=TEACHER_ROLE_ID,
            email=email,
            nombre=(name or email.split("@")[0]),
        )
        session.add(user)
        await session.flush()  # genera PK

    # 3) Crear identidad Google si no existe
    exists_ident = (
        await session.execute(
            select(UserIdentityModel).where(
                UserIdentityModel.provider == "google",
                UserIdentityModel.provider_user_id == sub,
            )
        )
    ).scalars().first()

    if not exists_ident:
        ident = UserIdentityModel(
            id=uuid.uuid4(),
            usuario_id=user.id,
            provider="google",
            provider_user_id=sub,
            email=email,
            refresh_token_hash=refresh_token,
        )
        session.add(ident)
        await session.flush()

    # 4) Relee el usuario con rol precargado para evitar lazy-load
    user = await _find_user_by_email(session, email)
    return user


@router.get("/google/login")
async def google_login():
    from urllib.parse import urlencode

    st = uuid.uuid4().hex
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPE,
        "state": st,
        "access_type": "offline",
        "prompt": "consent",
    }
    return RedirectResponse(url=f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


@router.get("/google/callback")
async def google_callback(
    code: str | None = None,
    state: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    if not code:
        raise HTTPException(status_code=400, detail="missing code")

    # 1) Intercambiar code -> tokens
    async with httpx.AsyncClient(timeout=20) as client:
        token_res = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=401, detail="token exchange failed")

        tokens = token_res.json()
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")

        # 2) UserInfo
        headers = {"Authorization": f"Bearer {access_token}"}
        profile_res = await client.get(GOOGLE_USERINFO_URL, headers=headers)
        if profile_res.status_code != 200:
            raise HTTPException(status_code=401, detail="userinfo failed")
        info = profile_res.json()

    sub = info.get("sub")
    email = info.get("email")
    name = info.get("name")
    if not sub or not email:
        raise HTTPException(status_code=401, detail="google claims missing")

    # 3) Upsert usuario/identidad (sin lazy)
    try:
        user = await _upsert_user(
            session,
            email=email,
            name=name,
            sub=sub,
            refresh_token=refresh_token,
        )
        await session.commit()
    except Exception:
        await session.rollback()
        raise

    # 4) Obtener nombre de rol por JOIN (evita MissingGreenlet)
    role_name = await _get_role_name_for_user(session, user.id)
    if not role_name:
        role_name = "Docente"  # fallback coherente con TEACHER_ROLE_ID

    # 5) Emitir JWT y setear cookie
    token = _issue_jwt(user=user, role_name=role_name)
    resp = RedirectResponse(url=f"{FRONTEND_ORIGIN}/dashboard", status_code=302)
    resp.set_cookie(
        key="app_session",
        value=token,
        httponly=True,
        secure=False,  # ← ponlo True en producción (HTTPS)
        samesite="lax",
        max_age=60 * int(JWT_MINUTES),
        path="/",
    )
    return resp


@router.post("/logout")
async def logout():
    resp = Response(status_code=204)
    resp.delete_cookie("app_session", path="/")
    return resp


@router.get("/me")
async def me(request: Request):
    token = request.cookies.get("app_session")
    if not token:
        return {"authenticated": False}
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        user = {
            "id": str(data.get("sub")),
            "email": data.get("email"),
            "name": data.get("name") or data.get("email"),
            "role": data.get("role"),
        }
        return {"authenticated": True, "user": user}
    except jwt.PyJWTError:
        return {"authenticated": False}


def _require_auth(request: Request):
    token = request.cookies.get("app_session")
    if not token: raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/reissue")
async def reissue_token(
    request: Request,
    session: AsyncSession = Depends(get_session),
    claims: dict = Depends(_require_auth),
):
    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Leer rol actual desde BD (sin lazy)
    q = (
        select(UsuarioModel, RolModel.nombre)
        .join(RolModel, RolModel.id == UsuarioModel.rol_id)
        .where(UsuarioModel.id == uuid.UUID(user_id))
    )
    row = (await session.execute(q)).first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    user, role_name = row[0], row[1]

    token = _issue_jwt(user=user, role_name=role_name or "Docente")
    resp = Response(status_code=204)
    resp.set_cookie(
        key="app_session",
        value=token,
        httponly=True,
        secure=False,  # True en prod
        samesite="lax",
        max_age=60 * int(JWT_MINUTES),
        path="/",
    )
    return resp