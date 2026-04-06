from sqlmodel import SQLModel, Field, UniqueConstraint
from pydantic import BaseModel, computed_field, ConfigDict
from datetime import datetime, timezone
from typing import Literal, Any
from enum import Enum
from fastapi import WebSocket

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True)
    password: str

class TaskStatus(Enum):
    DONE = "done"
    IN_PROGRESS = "in_progress"
    TODO = "todo"

class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    desc: str | None = None
    assignedTo: int | None = Field(default=None, foreign_key="user.id")
    room_id: int = Field(foreign_key="room.id")
    status: TaskStatus

class Room(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    code: str = Field(unique=True)
    deadline: datetime

    @computed_field
    @property
    def expired(self) -> bool:
        return datetime.now() > self.deadline

class User_Room(SQLModel, table=True):
    __table_args__= (
        UniqueConstraint("user_id", "room_id"),
    )
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    room_id: int = Field(foreign_key="room.id")


class APIResponce(BaseModel):
    status: Literal["success", "error"]
    data: Any | None = None
    error: Any | None = None


class WSMessage(BaseModel):
    msg_type: str
    me: str | None = None
    message: Any | None = None