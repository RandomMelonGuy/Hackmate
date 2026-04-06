from sqlmodel import select, Session
from data.database import engine
from core.types import User
from .types import RegisterData
from passlib.hash import pbkdf2_sha256

class RegisterService:
    def __init__(self):
        self.engine = engine
    
    def register(self, data: RegisterData):
        try:
            with Session(self.engine) as session:
                user = User(username=data.username, password=pbkdf2_sha256.hash(data.password))
                session.add(user)
                session.commit()
            return True
        except Exception as e:
            print(repr(e))
            return False
    
    def get_users(self):
        with Session(self.engine) as session:
            users = session.exec(select(User)).all()
            return users