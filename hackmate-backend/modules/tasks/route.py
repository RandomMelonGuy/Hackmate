from fastapi import APIRouter
from .types import TaskData, UpdateTaskData, IDReq
from .service import TaskService
from core.types import APIResponce

router = APIRouter()
service = TaskService()

@router.post("/create")
def task_create(req: TaskData):
    task = service.create_task(req)
    if not task:
        return APIResponce(status="error")
    return APIResponce(status="success", data=task)

@router.get("/list")
def list_tasks():
    tasks = service.list_tasks()
    if not tasks:
        return APIResponce(status="error")
    return APIResponce(status="success", data=tasks)

@router.post("/update")
def update_task(req: UpdateTaskData):
    success = service.update_task(req)
    if not success:
        return APIResponce(status="error")
    return APIResponce(status="success") 

@router.post("/delete")
def delete_task(req: IDReq):
    success = service.delete_task(req.id)
    if not success:
        return APIResponce(status="error")
    return APIResponce(status="success") 

@router.get("/room/{code}")
def get_tasks(code: str):
    tasks = service.get_rooms_tasks(code)
    print(tasks)
    if not tasks:
        return APIResponce(status="error")
    return APIResponce(status="success", data=tasks)