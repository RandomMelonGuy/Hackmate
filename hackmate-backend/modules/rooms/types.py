from pydantic import BaseModel
from datetime import datetime

class RoomData(BaseModel):
    name: str
    deadline: datetime

class User_RoomData(BaseModel):
    roomID: int
    userID: int

class IDReq(BaseModel):
    id: int

class CodeReq(BaseModel):
    code: str