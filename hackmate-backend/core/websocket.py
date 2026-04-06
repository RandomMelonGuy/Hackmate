from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Any
from core.types import WSMessage
import json
import asyncio
from uuid import uuid4

class RoomWS:
    def __init__(self):
        self.rooms: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, code: str, ws: WebSocket) -> str:
        await ws.accept()
        if code not in self.rooms:
            self.rooms[code] = []
        self.rooms[code].append(ws)
        return str(id(ws))
    
    async def disconnect(self, code: str, ws: WebSocket):
        if code in self.rooms:
            # Используем try/except для безопасного удаления
            try:
                if ws in self.rooms[code]:
                    self.rooms[code].remove(ws)
            except ValueError:
                pass
            
            if not self.rooms[code]:
                del self.rooms[code]
    
    async def broadcast(self, code: str, message: WSMessage):
        if code not in self.rooms:
            return
        
        # Создаём копию списка для безопасной итерации
        connections = self.rooms[code].copy()
        
        for ws in connections:
            # Не отправляем отправителю
            try:
                await ws.send_json(message.model_dump())
            except Exception as e:
                print(f"Failed to send to {id(ws)}: {e}")
                # Если ошибка - удаляем соединение
                await self.disconnect(code, ws)

manager = RoomWS()