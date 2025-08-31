from typing import TypedDict, Any, Dict

class OkEnvelope(TypedDict, total=False):
    ok: bool
    say: str
    data: Dict[str, Any]

class ErrDetail(TypedDict, total=False):
    code: str
    message: str
    extra: Dict[str, Any]

class ErrEnvelope(TypedDict):
    ok: bool
    error: ErrDetail

def ok_msg(say: str, **data: Any) -> OkEnvelope:
    env: OkEnvelope = {"ok": True, "say": say}
    if data: env["data"] = data
    return env

def err_msg(code: str, message: str, **extra: Any) -> ErrEnvelope:
    det: ErrDetail = {"code": code, "message": message}
    if extra: det["extra"] = extra
    return {"ok": False, "error": det}