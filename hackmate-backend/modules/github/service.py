from data.database import engine
from sqlmodel import Session, select, delete
from core.types import User, Cached_Commits, Room, WSMessage
from core.websocket import manager
from urllib3 import PoolManager
from cryptography.fernet import Fernet
from core.settings import settings
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
import asyncio


class GithubService:
    def __init__(self):
        self.engine = engine
        self.manager = PoolManager()
        self.fernet = Fernet(settings.TOKEN_KEY)

    def get_headers(self, token: str):
        return {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "HackmateGithub"
        }

    def auth(self, token: str, user_id: int):
        headers = self.get_headers(token)
        res = self.manager.request("GET", "https://api.github.com/user", headers=headers).json()
        enc = self.fernet.encrypt(token.encode("utf-8"))
        with Session(self.engine) as session:
            user = session.get(User,user_id)
            assert user
            print("DB USER", user)
            user.token = enc
            user.github_username = res["login"]
            session.add(user)
            session.commit()

    def get_repos(self, user_id: int):
        try:
            with Session(self.engine) as session:
                user = session.get(User, user_id)
                assert user and user.token
                token = self.fernet.decrypt(user.token).decode("utf-8")
                headers = self.get_headers(token)
                res = self.manager.request("GET", "https://api.github.com/user/repos", headers=headers).json()
                data = [
                    {'name': i["name"],
                    'description': i["description"]} for i in res
                ]
                return data

        except Exception as e:
            print(repr(e))
            return None
        
    def get_repo_commits(self, user_id: int, repo_name: str):
        try:
            with Session(self.engine) as session:
                user = session.get(User, user_id)
                assert user and user.token
                token = self.fernet.decrypt(user.token).decode("utf-8")
                headers = self.get_headers(token)
                print(f"https://api.github.com/repos/{user.github_username}/{repo_name}/")
                res = self.manager.request("GET", f"https://api.github.com/repos/{user.github_username}/{repo_name}/commits", headers=headers).json()
                data = [{"commit": i["commit"]["message"], "commiter": i["committer"]["login"], "sha": i["sha"], 'date': (i["commit"]["author"]["date"])} for i in res]
                return data
        except Exception as e:
            print(repr(e))
            return None
        

    def connect_github(self, user_id: int, repo_name: str, room_id: int):
        try:
            with Session(self.engine) as session:
                user = session.get(User, user_id)
                room = session.get(Room, room_id)
                assert user and room
                room.connected_user = user.github_username
                room.github_repo = repo_name
                session.add(room)
                session.commit()
            return True
        except Exception as e:
            print(repr(e))
            return False
    
    def cache_commits(self, room_id: int):
        try:
            with Session(self.engine) as session:
                room = session.get(Room, room_id)
                assert room and room.connected_user and room.github_repo, "No required room params"
                connected_user = room.connected_user
                user = session.exec(select(User).where(User.github_username == connected_user)).one()
                assert user.token, "No user token"
                token = self.fernet.decrypt(user.token).decode("utf-8")
                headers = self.get_headers(token)
                res = self.manager.request("GET", f"https://api.github.com/repos/{user.github_username}/{room.github_repo}/commits", headers=headers).json()
                data = [Cached_Commits(room_id=room_id, commit=i["commit"]["message"], author=i["committer"]["login"], sha=i["sha"], date=datetime.strptime(i["commit"]["author"]["date"], "%Y-%m-%dT%H:%M:%SZ")) for i in res]
                if data:
                    session.exec(delete(Cached_Commits).where(Cached_Commits.room_id == room_id)) # ignore
                session.add_all(data)
                session.commit()
                return True
        except Exception as e:
            print(repr(e))
            return None

    def get_cached_room_commits(self, room_id: int):
        try:
            with Session(self.engine) as session:
                res = session.exec(select(Cached_Commits).where(Cached_Commits.room_id == room_id)).all()
                data = [{"commit": i.commit, "author": i.author, "sha": i.sha, 'date': i.date} for i in res]
                return data
        except Exception as e:
            print(repr(e))
            return None
        
    def get_room_commits(self, room_id: int):
        try:
            with Session(self.engine) as session:
                room = session.get(Room, room_id)
                assert room and room.connected_user and room.github_repo, "No required room params"
                connected_user = room.connected_user
                user = session.exec(select(User).where(User.github_username == connected_user)).one()
                assert user.token, "No user token"
                token = self.fernet.decrypt(user.token).decode("utf-8")
                headers = self.get_headers(token)
                res = self.manager.request("GET", f"https://api.github.com/repos/{user.github_username}/{room.github_repo}/commits", headers=headers).json()
                data = [{'commit': i["commit"]["message"], 'author': i["committer"]["login"], 'sha': i["sha"], 'date': i["commit"]["author"]["date"]} for i in res]
                return data
        except Exception as e:
            print(repr(e))
            return None
        
    def get_room_repo(self, roomID: int):
        try:
            with Session(self.engine) as session:
                room = session.get(Room, roomID)
                assert room and room.github_repo
                return room.github_repo
        except Exception as e:
            print(repr(e))
            return None
    
class RoomUpdater:
    def __init__(self, service: GithubService):
        self.engine = engine
        self.service = service
        self.loop = asyncio.get_event_loop()  # ← сохраняем основной loop
        self.scheduler = BackgroundScheduler()
        self.scheduler.add_job(self._update_job, 'interval', seconds=10)
        self._started = False
    
    def start(self):
        if not self._started and not self.scheduler.running:
            self.scheduler.start()
            self._started = True
            print("Scheduler started")
    
    def shutdown(self):
        if self.scheduler.running:
            self.scheduler.shutdown()
            self._started = False
            print("Scheduler stopped")
    def _update_job(self):
        """Запускаем корутину в основном event loop"""
        asyncio.run_coroutine_threadsafe(
            self._update_async(), 
            self.loop  # ← используем сохраненный loop
        )
    
    async def _update_async(self):
        #print("🟢 _update_async started")
        with Session(self.engine) as session:
            rooms = session.exec(select(Room).where(Room.github_repo != None)).all()
           # print(f"🟢 Found {len(rooms)} rooms")
            
            for idx, room in enumerate(rooms):
              #  print(f"🟢 Processing room {idx+1}/{len(rooms)}: {room.code}")
                try:
               #     print(f"🟢 Getting commits for room {room.id}...")
                    commits = self.service.get_room_commits(room.id)
                #    print(f"🟢 Got {len(commits) if commits else 0} commits")
                    
                #    print(f"🟢 Broadcasting to {room.code}...")
                    await manager.broadcast(
                        room.code, 
                        WSMessage(msg_type="commits_updated", message=commits)
                    )
                    print(f"🟢 Broadcast done for {room.code}")
                 #   print("REPEATED")
                    
                except Exception as e:
                 #   print(f"🔴 ERROR in room {room.code}: {repr(e)}")
                    import traceback
                    traceback.print_exc()
    