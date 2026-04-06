from pydantic import BaseModel
from core.types import TaskStatus

class TaskData(BaseModel):
    name: str
    desc: str
    assignedTo: int | None = None
    room_id: int
    status: TaskStatus

class UpdateTaskData(BaseModel):
    name: str
    desc: str
    assignedTo: int | None
    status: TaskStatus
    task_id: int

class IDReq(BaseModel):
    id: int