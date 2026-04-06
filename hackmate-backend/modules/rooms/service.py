from core.types import Room, User_Room, User
from data.database import engine
from .types import RoomData
from sqlmodel import Session, select, and_
from uuid import uuid4
from fastapi import WebSocket
from core.websocket import manager

class RoomService:
    def __init__(self):
        self.engine = engine
    
    def createCode(self):
        return str(uuid4())[:8]

    def get_code(self, roomID: int):
        with Session(self.engine) as session:
            code = session.get(Room, Room.id == roomID).code
        return code

    def create(self, req: RoomData, userID: int):
        code = self.createCode()
        data = {
            "name": req.name,
            "deadline": req.deadline,
            "code": code
        }
        try:
            with Session(self.engine) as session:
                room = Room(**data)
                session.add(room)
                session.flush()
                roomData = room.model_dump()
                session.commit()
                self.join(roomData["code"], userID)
                print(roomData)
            return roomData
        except Exception as e:
            print(repr(e))
            return None
        
    def list_rooms(self):
        try:
            with Session(self.engine) as session:
                stat = select(Room)
                rooms = session.exec(stat).all()
                return rooms
        except Exception as e:
            print(repr(e))
            return None
        
    def get_room(self, code: str):
        try:
            with Session(self.engine) as session:
                stat = select(Room).where(Room.code == code)
                room = session.exec(stat).one()
                data = {**room.model_dump(), "expired": room.expired}
            return data
        except Exception as e:
            print(repr(e))
            return None
        
    def join(self, roomCode: str, userID: int):
        try:
            with Session(self.engine) as session:
                room = session.exec(select(Room).where(Room.code == roomCode)).one()
                connection = User_Room(user_id=userID, room_id=room.id)
                session.add(connection)
                roomData = room.model_dump()
                session.commit()
                print("JOIN SUCCESSED")
            return roomData
        except Exception as e:
            print(repr(e))
            return False
        
    def delete(self, code: str):
        try:
            with Session(self.engine) as session:
                room = session.exec(select(Room).where(Room.code == code)).one()
                session.delete(room)
                session.commit()
            return True
        except Exception as e:
            print(repr(e))
            return False
        
    def leave(self, roomID: int, userID: int):
        try:
            with Session(self.engine) as session:
               connection = session.exec(select(User_Room).where(and_(User_Room.room_id == roomID, User_Room.user_id == userID))).one()
               session.delete(connection)
               session.commit()
            return True
        except Exception as e:
            print(repr(e))
            return False
        
    def list_connections(self):
        try:
            with Session(self.engine) as session:
                stat = select(User_Room)
                connections = session.exec(stat).all()
                print(connections)
            return connections
        except Exception as e:
            print(repr(e))
            return None
        
    def get_room_particiants(self, code: str):
        try:
            with Session(self.engine) as session:
                roomID = session.exec(select(Room).where(Room.code == code)).one().id
                stat = select(User).join(User_Room, User_Room.user_id == User.id).where(User_Room.room_id == roomID)
                members = session.exec(stat).all()
            return members
        except Exception as e:
            print(repr(e))
            return None
    
    def get_user_rooms(self, userID: int):
        try:
            with Session(self.engine) as session:
                stat = select(Room).join(User_Room, User_Room.room_id == Room.id).where(User_Room.user_id == userID)
                rooms = session.exec(stat).all()
            return rooms
        except Exception as e:
            print(repr(e))
            return None