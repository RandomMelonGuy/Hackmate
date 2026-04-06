from fastapi import APIRouter, Response, Request, Depends
from .types import AuthData
from .service import AuthService
from core.types import APIResponce
from core.security import verify_user
from typing import Dict

router = APIRouter()
service = AuthService()

@router.post("/")
def auth(data: AuthData, responce: Response) -> APIResponce:
    code = service.auth(data)
    if code:
        responce.set_cookie("session", code)
        return APIResponce(status="success")
    else:
        return APIResponce(status="error")

@router.get("/jwt")
def get_jwt(req: Request):
    session = req.cookies.get("session")
    if not session:
        return APIResponce(status="error", error="No session cookie")
    obj = service.get_jwt(session)
    if not obj:
        return APIResponce(status="error", error="Session has been corrupted")

    return APIResponce(status="success", data=obj)

@router.get("/protected")
def protected(req: Request, user: Dict[str, str] = Depends(verify_user)):
    return user