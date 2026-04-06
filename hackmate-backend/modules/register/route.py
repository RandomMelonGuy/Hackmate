from fastapi import APIRouter
from .types import RegisterData
from .service import RegisterService
from core.types import APIResponce

router = APIRouter()
service = RegisterService()

@router.post("/")
def register(req: RegisterData):
    user = service.register(req)
    if user:
        return APIResponce(status="success")
    return APIResponce(status="error", error="CAN NOT REGISTER")

@router.get("/DELETEME/all")
def get_all():
    return service.get_users()