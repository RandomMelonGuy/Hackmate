from sqlmodel import Session, select
import jwt
from passlib.hash import pbkdf2_sha256
from core.types import User
from data.database import engine
from .types import AuthData
from datetime import datetime, timezone, timedelta
from core.settings import settings
from uuid import uuid4

class AuthService:
    def __init__(self):
        self.engine = engine
    
    def create_jwt(self, data: User) -> str:
        jwt_data = {
            "id": data.id,
            "username": data.username,
            "iat": datetime.now(timezone.utc),
            "jti": str(uuid4()),
            "exp": datetime.now() + timedelta(days=1)
        }
        code = jwt.encode(jwt_data, settings.JWT_KEY, algorithm="HS256")
        return code

    def auth(self, data: AuthData):
        stat = select(User).where(User.username == data.username)
        try:
            with Session(self.engine) as session:
                user = session.exec(stat).one()
                if pbkdf2_sha256.verify(data.password, user.password):
                    code = self.create_jwt(user)
                    return code
                else:
                    return False
        except Exception as e:
            print(repr(e))
            return False
        
    def get_jwt(self, session: str):
        try:
            obj = jwt.decode(session, settings.JWT_KEY, "HS256")
            with Session(self.engine) as s:
                user = s.get(User, obj["id"])
                assert user
            out = {"id": user.id, "username": user.username, "github_username": user.github_username}
            print(out)
            return out
        except Exception as e:
            print(repr(e))
            return None