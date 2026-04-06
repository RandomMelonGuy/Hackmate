from fastapi import APIRouter, Depends
from .types import MessageReq
from .service import ChatService
from core.security import verify_user
from core.types import APIResponce

router = APIRouter()
service = ChatService()

@router.post("/send")
def send(req: MessageReq, user = Depends(verify_user)):
    success = service.send(req, user["id"])
    if not success:
        return APIResponce(status="error")
    return APIResponce(status="success")

@router.get("/room/{code}")
def get_in_room(code: str):
    messages = service.get_in_room(code)
    return APIResponce(status="success", data=messages)