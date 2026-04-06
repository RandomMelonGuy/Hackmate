from pydantic import BaseModel
from sqlmodel import SQLModel, Field

class Message(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    text: str
    author: int = Field(foreign_key="user.id")
    room_id: int = Field(foreign_key="room.id")

class MessageReq(BaseModel):
    text: str
    room_id: int