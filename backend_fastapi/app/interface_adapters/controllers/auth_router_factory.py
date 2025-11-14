from __future__ import annotations
from fastapi import APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Callable
import secrets, json
from urllib.parse import urlsplit
import ipaddress

from app.use_cases.auth.google_callback import GoogleCallbackUseCase
from app.use_cases.ports.oauth_port import GoogleOAuthPort
from app.use_cases.ports.token_port import JwtPort
from app.use_cases.auth.logout import LogoutUseCase
from app.use_cases.ports.cache_port import CachePort


def _detect_origin(request: Request) -> str | None:
    proto = request.headers.get("x-forwarded-proto") or request.url.scheme
    host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    if not host:
        return None
    proto = proto.split(",")[0].strip() if proto else "http"
    host = host.split(",")[0].strip()
    if not proto or not host:
        return None
    return f"{proto}://{host}".rstrip("/")


def _is_secure_request(request: Request) -> bool:
    proto = request.headers.get("x-forwarded-proto") or request.url.scheme
    if not proto:
        return False
    proto = proto.split(",")[0].strip().lower()
    return proto == "https"


def _resolve_frontend_origin(preconfigured: str, detected: str | None) -> str:
    preconfigured = (preconfigured or "").rstrip("/")
    if not detected:
        return preconfigured
    if not preconfigured:
        return detected
    try:
        detected_host = urlsplit(detected).hostname
    except Exception:
        detected_host = None
    try:
        pre_host = urlsplit(preconfigured).hostname
    except Exception:
        return detected
    if not pre_host:
        return detected if detected_host else preconfigured
    try:
        ip = ipaddress.ip_address(pre_host)
        if ip.is_private and detected_host:
            return detected
    except ValueError:
        # Not an IP; keep configured origin
        pass
    return preconfigured


def make_auth_router(
    *,
    oauth: GoogleOAuthPort,
    redirect_uri: str,
    frontend_origin: str,
    uc_factory_google_callback: Callable[[AsyncSession], GoogleCallbackUseCase],
    get_session_dep: Callable[[], AsyncSession],
    jwt_port: JwtPort,
    uc_factory_logout: Callable[[AsyncSession], LogoutUseCase],
    cache: CachePort
) -> APIRouter:
    router = APIRouter(prefix="/api/auth", tags=["auth"])

    @router.get("/google/login")
    async def google_login():
        state = secrets.token_urlsafe(24)
        await cache.set(f"oauth:state:{state}", b"1", ttl_seconds=300)
        url = oauth.build_authorize_url(redirect_uri=redirect_uri, state=state)
        return RedirectResponse(url=url, status_code=302)

    @router.get("/google/callback")
    async def google_callback(
        request: Request,
        code: str | None = None,
        state: str | None = None,
        session=Depends(get_session_dep),
    ):
        detected_origin = _detect_origin(request)
        resolved_origin = _resolve_frontend_origin(frontend_origin, detected_origin)
        cookie_secure = _is_secure_request(request)

        if not code or not state:
            return RedirectResponse(url=f"{resolved_origin}/auth/login?error=missing_code")

        val = await cache.get(f"oauth:state:{state}")
        if not val:
            return RedirectResponse(url=f"{resolved_origin}/auth/login?error=invalid_state")

        await cache.delete(f"oauth:state:{state}")

        uc = uc_factory_google_callback(session)
        try:
            result = await uc.execute(code=code)
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        resp = RedirectResponse(url=f"{resolved_origin}/dashboard", status_code=302)
        resp.set_cookie(
            "app_session",
            result.jwt,
            httponly=True,
            secure=cookie_secure,
            samesite="lax",
            max_age=result.max_age,
            path="/",
        )
        return resp

    @router.get("/me")
    async def me(request: Request):
        token = request.cookies.get("app_session")
        if not token:
            return {"authenticated": False}
        try:
            data = jwt_port.decode(token)
        except Exception:
            return {"authenticated": False}

        user = {
            "id": str(data.get("sub")),
            "email": data.get("email"),
            "name": data.get("name") or data.get("email"),
            "role": data.get("role"),
        }
        return {"authenticated": True, "user": user}

    @router.post("/logout")
    async def logout(request: Request, session: AsyncSession = Depends(get_session_dep)):

        token = request.cookies.get("app_session")
        if token:
            try:
                data = jwt_port.decode(token)
                user_id = str(data.get("sub") or "")
            except Exception:
                user_id = ""

            if user_id:
                uc = uc_factory_logout(session)
                try:
                    await uc.execute(user_id=user_id)
                    await session.commit()
                except Exception:
                    await session.rollback()
        try:
            resp = Response(status_code=204)
            resp.delete_cookie(
                key="app_session",
                path="/",
                secure=_is_secure_request(request),
                httponly=True,
                samesite="lax",
            )
            return resp
        except Exception as e:
            import logging
            logging.exception("Error en /auth/logout")
            raise HTTPException(status_code=500, detail="Logout failed")

    return router
