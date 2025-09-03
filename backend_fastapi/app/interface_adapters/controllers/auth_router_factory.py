from __future__ import annotations
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.use_cases.auth.google_callback import GoogleCallbackUseCase
from app.use_cases.ports.oauth_port import GoogleOAuthPort
from app.use_cases.ports.token_port import JwtPort
from typing import Callable

def make_auth_router(
    *,
    oauth: GoogleOAuthPort,
    redirect_uri: str,
    frontend_origin: str,
    uc_factory_google_callback: Callable[[AsyncSession], GoogleCallbackUseCase],
    get_session_dep: Callable[[], AsyncSession],
    jwt_port: JwtPort,
) -> APIRouter:
    router = APIRouter(prefix="/auth", tags=["auth"])

    @router.get("/google/login")
    async def google_login():
        import secrets
        if not getattr(oauth, "build_authorize_url", None):
            raise HTTPException(status_code=500, detail="OAuth client missing URL builder")
        state = secrets.token_urlsafe(16)
        url = oauth.build_authorize_url(redirect_uri=redirect_uri, state=state)
        return RedirectResponse(url=url, status_code=302)

    @router.get("/google/callback")
    async def google_callback(code: str | None = None, session: AsyncSession = Depends(get_session_dep)):
        if not code:
            raise HTTPException(status_code=400, detail="missing code")

        uc = uc_factory_google_callback(session)
        try:
            result = await uc.execute(code=code)
            await session.commit()
        except Exception:
            await session.rollback()
            raise

        resp = RedirectResponse(url=f"{frontend_origin}/dashboard", status_code=302)
        resp.set_cookie(
            key="app_session",
            value=result.jwt,
            httponly=True,
            secure=False,
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
    async def logout():
        from fastapi import Response
        resp = Response(status_code=204)
        resp.delete_cookie(
            key="app_session",
            path="/",
            secure=False,
            httponly=True,
            samesite="lax",
        )
        return resp

    return router
