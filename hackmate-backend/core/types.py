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
    token: bytes | None = Field(default=None)
    github_username: str | None = Field(default=None)

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
    desc: str | None = Field(default=None)
    deadline: datetime
    github_repo: str | None = Field(default=None)
    connected_user: str | None = Field(default=None)

    @computed_field
    @property
    def expired(self) -> bool:
        # Приводим deadline к offset-aware, предполагая что он в UTC
        if self.deadline.tzinfo is None:
            deadline_aware = self.deadline.replace(tzinfo=timezone.utc)
        else:
            deadline_aware = self.deadline
        return datetime.now(timezone.utc) > deadline_aware

class User_Room(SQLModel, table=True):
    __table_args__= (
        UniqueConstraint("user_id", "room_id"),
    )
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    room_id: int = Field(foreign_key="room.id")


class Cached_Commits(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    room_id: int = Field(foreign_key="room.id", ondelete="CASCADE")
    commit: str
    author: str
    sha: str
    date: datetime

class APIResponce(BaseModel):
    status: Literal["success", "error"]
    data: Any | None = None
    error: Any | None = None


class WSMessage(BaseModel):
    msg_type: str
    me: str | None = None
    message: Any | None = None