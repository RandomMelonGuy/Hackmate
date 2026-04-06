from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from data.database import engine

from modules.register.route import router as RegisterRouter
from modules.auth.route import router as AuthRouter
from modules.rooms.route import router as RoomRouter
from modules.tasks.route import router as TaskRouter
from modules.chat.route import router as ChatRouter

server = FastAPI()
server.add_middleware(CORSMiddleware, allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"], allow_methods=["*"], allow_headers=["*"], allow_credentials=True)
server.include_router(RegisterRouter, prefix="/register", tags=["Регистрация"])
server.include_router(AuthRouter, prefix="/auth", tags=["Авторизация"])
server.include_router(RoomRouter, prefix="/room", tags=["Комнаты"])
server.include_router(TaskRouter, prefix="/task", tags=["Задачи"])
server.include_router(ChatRouter, prefix="/chat", tags=["Чат"])

@server.get("/")
def home():
    return ":>"

SQLModel.metadata.create_all(engine)