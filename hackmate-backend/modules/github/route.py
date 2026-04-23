from fastapi import APIRouter, Request, Depends
from core.settings import settings
from core.security import verify_user, decode_jwt
from core.types import APIResponce
from uuid import uuid4
from urllib3 import PoolManager
from fastapi.responses import RedirectResponse, HTMLResponse
import json
from .service import GithubService, RoomUpdater
from .types import ConnectRequest

router = APIRouter()
manager = PoolManager()
service = GithubService()
updater = RoomUpdater(service)

@router.get("/enter")
def enter_request(req: Request):
    session = req.query_params.get("session")
    
    state_temp = str(uuid4())
    req.session["state"] = state_temp
    req.session["session"] = session
    client_id = settings.CLIENT_ID
    url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri=http://localhost:8000/github/callback&scope=read:user,public_repo&state={state_temp}&allow_signup=false"
    return RedirectResponse(url)

@router.get("/callback")
def callback(req: Request,state: str | None = None, code: str | None = None):
    s = req.session["session"]
    if not s:
        return "No session"
    user = decode_jwt(s)
    print("SESSION", req.session)
    state_temp = req.session.get("state")
    if state_temp == state:
        res = manager.request("POST", "https://github.com/login/oauth/access_token", json.dumps({'client_id': settings.CLIENT_ID, 'client_secret': settings.CLIENT_SECRET, 'code': code, 'redirect_uri': "http://localhost:8000/github/callback"}), headers={'Content-Type': "application/json"})
        try:
            #print(res.data)
            token = res.data.decode("utf-8").split("&")[0].split("=")[1]
            print("USER",user)
            service.auth(token, user["id"])
            html_content = """
            <html>
                <script>
                    window.close();
                </script>
            </html>
            """
            return HTMLResponse(content=html_content, status_code=200)
        except:
            return "NOPE TOKEN"
    else:
        print(state, state_temp)
        return "X Here was swimming"


@router.get("/repos")
def get_repos(user = Depends(verify_user)):
    repos = service.get_repos(user["id"])
    if not repos:
        return APIResponce(status="error")
    return APIResponce(status="success", data=repos)

#@router.get("/{repo}/commits")
#def get_repo_commits(repo: str, user = Depends(verify_user)):
#    repos = service.get_repo_commits(user["id"], repo)
#    if not repos:
#        return APIResponce(status="error")
#    return APIResponce(status="success", data=repos)

@router.post("/repo/connect/")
def connect_repo(req: ConnectRequest, user = Depends(verify_user)):
    success = service.connect_github(user["id"], req.repo, req.room_id)
    if not success:
        return APIResponce(status="error")
    return APIResponce(status="success")

@router.get("/rooms/{roomCode}/commits")
def get_repo_commits(roomCode: str):
    commits = service.get_room_commits(roomCode)
    if not commits:
        return APIResponce(status="error")
    return APIResponce(status="success", data=commits)

@router.get("/rooms/{roomID}/commits/cache")
def cache_room_commits(roomID: int):
    commits = service.cache_commits(roomID)
    if not commits:
        return APIResponce(status="error")
    return APIResponce(status="success")

@router.get("/test")
def test():
    print("<:>")

@router.on_event("startup")
async def startup():
    updater.start()  

@router.on_event("shutdown")
async def shutdown():
    updater.shutdown()