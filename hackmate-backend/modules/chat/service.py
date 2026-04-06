from sqlmodel import Session, select
from core.types import User, Room
from data.database import engine
from .types import MessageReq, Message

class ChatService:
    def __init__(self):
        self.engine = engine
    
    def send(self, data: MessageReq, userID: int):
        try:
            with Session(self.engine) as session:
                msg = Message(text=data.text, room_id=data.room_id, author=userID)
                session.add(msg)
                session.commit()
            return True
        except Exception as e:
            print(repr(e))
            return False
        
    def get_in_room(self, code: str):
        try:
            with Session(self.engine) as session:
                roomID = session.exec(select(Room).where(Room.code == code)).one().id
                messages = session.exec(select(Message, User.username).join(User, User.id == Message.author).where(Message.room_id == roomID)).all()
                comp = []
                for message, username in messages:
                    comp.append({
                        "id": message.id,
                        "text": message.text,
                        "author": message.author,
                        "username": username,
                    })
                return comp
        except Exception as e:
            print(repr(e))
            return None