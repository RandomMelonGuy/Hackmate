from sqlmodel import Session, select
from data.database import engine
from core.types import Task, Room, User
from .types import TaskData, UpdateTaskData

class TaskService:
    def __init__(self):
        self.engine = engine
    
    def create_task(self, data: TaskData):
        try:
            with Session(self.engine) as session:
                task = Task(name=data.name, room_id=data.room_id, status=data.status, assignedTo=data.assignedTo, desc=data.desc)
                session.add(task)
                session.flush()
                taskData = task.model_dump()
                session.commit()
            return taskData
        except Exception as e:
            print(repr(e))
            return False
        
    def list_tasks(self):
        try:
            with Session(self.engine) as session:
                tasks = session.exec(select(Task)).all()
            return tasks
        except Exception as e:
            print(repr(e))
            return None
        
    def update_task(self, data: UpdateTaskData):
        try:
            with Session(self.engine) as session:
                task = session.exec(select(Task).where(Task.id == data.task_id)).one()
                task.assignedTo = data.assignedTo
                task.desc = data.desc
                task.name = data.name
                task.status = data.status
                session.add(task)
                session.commit()
                session.refresh(task)
            return True
        except Exception as e:
            print(repr(e))
            return False
        
    def delete_task(self, taskID: int):
        try:
            with Session(self.engine) as session:
                task = session.get(Task, taskID)
                session.delete(task)
                session.commit()
            return True
        except Exception as e:
            print(repr(e))
            return False
        
    def get_rooms_tasks(self, roomCode: str):
        try:
            with Session(self.engine) as session:
                roomID = session.exec(select(Room).where(Room.code == roomCode)).one().id
                stat = select(Task, User.username).join(User, Task.assignedTo == User.id, isouter=True).where(Task.room_id == roomID)
                tasks = session.exec(stat).all()
                out = []
                for task, username in tasks:
                    out.append({
                        "id": task.id,
                        "name": task.name,
                        "desc": task.desc,
                        "status": task.status,
                        "assignedTo": task.assignedTo,
                        "assignedToName": username  # None если не назначен
                    })
                # tasks = session.exec(select(Task).where(Task.room_id == roomID)).all()
            return out
        except Exception as e:
            print(repr(e))
            return None