import jwt
from fastapi import Request, HTTPException
from core.settings import settings
from core.types import User

def verify_user(req: Request):
    session = req.cookies.get("session")
    if not session:
        raise HTTPException(status_code=401,detail="Not autorized")
    try:
        dict = jwt.decode(session, settings.JWT_KEY, ["HS256"])
        return dict
        
    except Exception as e:
        print(repr(e))
        raise HTTPException(401, "Session token has been corrupted")