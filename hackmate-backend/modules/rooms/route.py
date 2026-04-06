from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from .types import RoomData, IDReq, CodeReq
from .service import RoomService
from core.types import APIResponce, WSMessage
from core.security import verify_user
from core.websocket import manager
import asyncio

router = APIRouter()
service = RoomService()

@router.post("/create")
def room_create(req: RoomData, user = Depends(verify_user)):
    room = service.create(req, user["id"])
    if not room:
        return APIResponce(status="error")
    return APIResponce(status="success", data=room)

@router.get("/list")
def list_room():
    rooms = service.list_rooms()
    if not rooms:
        return APIResponce(status="error")
    return APIResponce(status="success", data=rooms)

@router.get("/get/{code}")
def get_room(code: str):
    room = service.get_room(code)
    members = service.get_room_particiants(code)
    out = {"room": room, "members": members}
    if not room:
        return APIResponce(status="error")
    return APIResponce(status="success", data=out)

@router.post("/join")
def join_room(req: CodeReq, user = Depends(verify_user)):
    room = service.join(req.code, user["id"])
    if not room:
        return APIResponce(status="error")
    return APIResponce(status="success", data=room)

@router.post("/leave")
def leave_room(req: IDReq, user = Depends(verify_user)):
    success = service.leave(req.id, user["id"])
    if not success:
        return APIResponce(status="error")
    return APIResponce(status="success")

@router.get("/list_connections")
def list_connections():
    connections = service.list_connections()
    if not connections:
        return APIResponce(status="error")
    return APIResponce(status="success", data=connections)

@router.get("/ws/rooms")
def list_wsrooms():
    return {
        "len": len(manager.rooms),
        "id_list": [(i, len(manager.rooms[i])) for i in manager.rooms]
    }

@router.post("/get_users")
def get_users_rooms(req: IDReq):
    rooms = service.get_user_rooms(req.id)
    print(rooms)
    if not rooms:
        return APIResponce(status="error")
    return APIResponce(status="success", data=rooms)

# ws
@router.websocket("/ws/{code}")
async def connect(ws: WebSocket, code: str):
    connection_id = await manager.connect(code, ws)
    
    try:
        await ws.send_json({"msg_type": "connection_est", "message": connection_id})
        
        while True:
            # Добавляем таймаут для получения сообщения
            try:
                data = await asyncio.wait_for(ws.receive_json(), timeout=60.0)
                req = WSMessage(**data)
                print(f"Received: {req.msg_type} from {connection_id}")
                
                # Отправляем всем, кроме отправителя
                await manager.broadcast(
                    code, 
                    WSMessage(
                        msg_type=req.msg_type, 
                        me=connection_id, 
                        message=req.message
                    ),
                )
            except asyncio.TimeoutError:
                # Отправляем ping для проверки соединения
                try:
                    await ws.send_json({"msg_type": "ping"})
                except:
                    break
                    
    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {connection_id}")
        
    except Exception as e:
        print(f"WebSocket error: {repr(e)}")
        
    finally:
        # Уведомляем остальных о выходе
        await manager.broadcast(
            code,
            WSMessage(
                msg_type="user_left",
                me=connection_id,
                message={"connection_id": connection_id}
            ),
        )
        await manager.disconnect(code, ws)