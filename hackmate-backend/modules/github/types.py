from pydantic import BaseModel

class IDRequest(BaseModel):
    id: int

class ConnectRequest(BaseModel):
    repo: str
    room_id: int