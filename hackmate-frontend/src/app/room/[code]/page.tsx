'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './room.module.css';
import request from '@/api/api';
import useAuth from '@/context/AuthContext';
import { WSMessage } from '@/api/types';

interface RoomData{
  room: Room
  members: Member[]
  tasks?: Task[]
}

interface Room{
  id: number;
  name: string;
  code: string;
  deadline: Date
  members: Member[]
}

// Типы для демо-данных
interface Member {
  id: number;
  username: string;
}

interface Task {
  id: number;
  name: string;
  desc?: string;
  status: 'todo' | 'in_progress' | 'done';
  assignedTo?: number; // ID участника
  assignedToName?: string; // Имя участника (для отображения)
}

interface Message {
  id: number;
  author: number;
  username: string;
  text: string;
}

export default function RoomPage() {
  const { code } = useParams();
  const router = useRouter();
  const connectionRef = useRef<string>("0");
  const {user, isLoading } = useAuth();
  const wsRef = useRef<WebSocket>(0);
  const roomCode = code as string;
  // Демо-данные
  const [tasks, setTasks] = useState<Task[]>([]);
  const [roomData, setRoomData] = useState<RoomData>({room: {
    id: 0,
    name: '',
    code: '',
    deadline: new Date(),
    members: []
  }, members: [], tasks: []});
  const { room, members } = roomData;

  function shuffle(array: string[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

  const genUUID = () => {
    const chars = "01234567890qwertyuiopasdfghjklzxcvbnm";
    const arr = shuffle(Array.from(chars));
    return arr.join("")
  }

  useEffect(() => {
    if (!user) return;
    console.log(user)
    let isMounted = true;
    async function getRoomData(code: string) {
      request(`/room/get/${code}`, "get").then(data => {
        if (!isMounted) return;
        if(data.status === "success"){
          setRoomData(data.data as RoomData)
          const members = data.data.members as Member[];
          if (!members.some(member => member.id === user?.id)){
            console.log(members, user)
            router.push("/unauthorized");
            wsRef.current.close();
          }
        }
         else {
          router.push("/notFound");
          wsRef.current.close();
        }
      }
      );
    }

    async function getTasks(code: string) {
      const res = await request(`/task/room/${code}`, 'get');
      if (res.status === "success"){
        setTasks(res.data);
      }
      else{
        setTasks([]);
      }
    }

    async function getMessages(code: string) {
      const res = await request(`/chat/room/${code}`, "get");
      if (res.status === "success"){
        console.log(JSON.stringify(res.data))
        setMessages(res.data);
      }
      else{
        console.log("ERROR WHILE LOADING MESSAGES")
      }
    }

    if (!wsRef.current){
      const ws = new WebSocket(`ws://127.0.0.1:8000/room/ws/${code}`);
      wsRef.current = ws;

      ws.onopen = (event) => {
        
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data) as WSMessage;
        if (data.msg_type === "connection_est"){
          connectionRef.current = data.message;
          const sendData: WSMessage = {msg_type: "user_joined", me: data.message, message: user};
          ws.send(JSON.stringify(sendData));
        }

        if (data.msg_type === "user_joined"){
          if (data.me !== connectionRef.current){
            getRoomData(roomCode);
          }
        }

        else if (data.msg_type === "user_left"){
          if (data.me !== connectionRef.current){
            getRoomData(roomCode);
          }
        }

        else if (data.msg_type === "task_created"){
          if (data.me !== connectionRef.current){
            getTasks(roomCode);
          }
        }

        else if (data.msg_type === "task_deleted"){
          if (data.me !== connectionRef.current){
            getTasks(roomCode);
          }
        }

        else if (data.msg_type === "task_updated"){
          if (data.me !== connectionRef.current){
            getTasks(roomCode);
          }
        }

        else if (data.msg_type === "chat_messaged"){
          if (data.me !== connectionRef.current){
            getMessages(roomCode);
          }
        }
      }
    }

    getRoomData(roomCode);
    getTasks(roomCode);
    getMessages(roomCode);

    return () => {
      isMounted = false;
      
      if (wsRef.current) {
          const wsToClose = wsRef.current;
          
          // Убираем все обработчики, чтобы они не вызывались после закрытия
          wsToClose.onopen = null;
          wsToClose.onmessage = null;
          wsToClose.onerror = null;
          wsToClose.onclose = null;
          
          if (wsToClose.readyState === WebSocket.OPEN) {
              wsToClose.close();
          }
          
          wsRef.current = null;
      }
}}, [user])

  const [messages, setMessages] = useState<Message[]>([]);

  const [newMessage, setNewMessage] = useState("");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat'>('tasks');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    alert("Код комнаты скопирован!");
  };

  const handleLeaveRoom = () => {
    if (confirm("Вы уверены, что хотите покинуть комнату?")) {
      request("/room/leave", "post", {id: room.id});
      const sendData: WSMessage = {msg_type: "user_left"};
      wsRef.current.send(JSON.stringify(sendData));
      router.push("/");
    }
  };

  const handleAddTask = async() => {
    if (!newTaskTitle.trim()) return;
    
    const assignee = members.find(m => m.id === newTaskAssignee);
    
    const newTask: Task = {
      name: newTaskTitle,
      desc: newTaskDesc,
      status: "todo",
      assignedTo: newTaskAssignee,
      assignedToName: assignee?.username,
    };

    console.log({ name: newTaskTitle, status: "todo", assignedTo: newTaskAssignee, room_id: room.id });

    const res = await request("/task/create", "post", { name: newTaskTitle, desc: newTaskDesc, status: "todo", assignedTo: newTaskAssignee, room_id: room.id });

    if (res.status === "success"){
      setTasks([...tasks, res.data]);
      wsRef.current.send(JSON.stringify({msg_type: "task_created"}))
    }

    else{
      console.log("ERROR ADDING A TASK")
    }

    setNewTaskTitle("");
    setNewTaskAssignee(null);
    setIsAddTaskOpen(false);
  };

  const handleUpdateTaskStatus = async(taskId: number, newStatus: Task['status']) => {
    const task = tasks.find(el => el.id == taskId);
    if (!task) return;
    const res = await request("/task/update", "post", {name: task.name, desc: task.desc, status: newStatus, assignedTo: task.assignedTo, task_id: taskId});
    if (res.status === "success"){
      setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
    }
    else{
      alert("HUH")
    }
  };

  const handleReassignTask = async(taskId: number, memberId: number | null) => {
    const assignee = members.find(m => m.id === memberId);
    const task = tasks.find(el => el.id == taskId);
    if (!task) return;
    const res = await request("/task/update", "post", {name: task.name, desc: task.desc, status: task.status, assignedTo: memberId, task_id: taskId});
    if (res.status === "success"){
      setTasks(tasks.map(task => 
      task.id === taskId ? { 
        ...task, 
        assignedTo: memberId,
        assignedToName: assignee?.username
      } : task
    ));
    wsRef.current.send(JSON.stringify({msg_type: "task_updated"}))
    }
    else{
      alert("HUH")
    }
  };

  const deleteTask = async(taskID: number) => {
    console.log(taskID);
    const res = await request("/task/delete", "post", { id: taskID });
    if (res.status === "success"){
      setTasks(data => data.filter((el) => el.id !== taskID));
      wsRef.current.send(JSON.stringify({msg_type: "task_deleted"}))
    }
    else{
      console.log(res);
      console.error("CAN NOT DELETE TASK");
    }
  }

  const handleSendMessage = async(e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const message: Message = {
      author: user?.id,
      username: user?.username,
      text: newMessage,
    };
    const res = await request("/chat/send", "post", {text: newMessage, room_id: room.id});
    if (res.status === "success"){
      setMessages([...messages, message]);
      setNewMessage("");
      wsRef.current.send(JSON.stringify({msg_type: "chat_messaged"}));
    }
    
  };

  const getTaskStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'todo': return { text: 'К выполнению', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
      case 'in_progress': return { text: 'В процессе', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' };
      case 'done': return { text: 'Выполнено', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    }
  };

  // Подсчет статистики задач
  const tasksStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  return (
    <div className={styles.container}>
      {/* Шапка комнаты */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.roomName}>{room?.name}</h1>
            <div className={styles.roomCode}>
              Код комнаты: 
              <code className={styles.codeValue}>{roomCode}</code>
              <button className={styles.copyBtn} onClick={handleCopyCode}>
                📋
              </button>
            </div>
          </div>
        </div>
        <button className={styles.leaveBtn} onClick={handleLeaveRoom}>
          Покинуть комнату
        </button>
      </header>

      {/* Основной контент */}
      <div className={styles.mainGrid}>
        {/* Левая колонка - Участники */}
        <aside className={styles.membersPanel}>
          <div className={styles.panelHeader}>
            <h2>Участники</h2>
            <span className={styles.membersCount}>{members.length}</span>
          </div>
          <div className={styles.membersList}>
            {members.map(member => (
              <div key={member.id} className={styles.memberItem}>
                <div className={styles.memberAvatar}>
                  {member.username[0]}
                </div>
                <div className={styles.memberInfo}>
                  <div className={styles.memberName}>{member.username}</div>
                  { /*{member.role && <div className={styles.memberRole}>{member.role}</div>} */}
                </div>
              </div>
            ))}
          </div>

          {/* Статистика задач */}
          <div className={styles.statsBlock}>
            <div className={styles.statsHeader}>
              <span>📊 Статистика задач</span>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{tasksStats.total}</div>
                <div className={styles.statLabel}>Всего</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue} style={{ color: '#fbbf24' }}>{tasksStats.todo}</div>
                <div className={styles.statLabel}>В ожидании</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue} style={{ color: '#8b5cf6' }}>{tasksStats.inProgress}</div>
                <div className={styles.statLabel}>В работе</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue} style={{ color: '#10b981' }}>{tasksStats.done}</div>
                <div className={styles.statLabel}>Выполнено</div>
              </div>
            </div>
          </div>

          {/* Техническое задание */}
          <div className={styles.specBlock}>
            <div className={styles.specHeader}>
              <span>📋 Техническое задание</span>
            </div>
            <div className={styles.specContent}>
              <p>Разработать веб-приложение для организации хакатонов с возможностью:</p>
              <ul>
                <li>Создания комнат по коду</li>
                <li>Управления задачами с назначением ответственных</li>
                <li>Внутреннего чата</li>
                <li>Отслеживания прогресса команды</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Правая колонка - Задачи/Чат */}
        <div className={styles.mainPanel}>
          {/* Табы */}
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'tasks' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              📋 Задачи
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'chat' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              💬 Чат
            </button>
          </div>

          {/* Контент вкладок */}
          {activeTab === 'tasks' ? (
            <div className={styles.tasksPanel}>
              <div className={styles.tasksHeader}>
                <h2>Задачи спринта</h2>
                <button className={styles.addTaskBtn} onClick={() => setIsAddTaskOpen(true)}>
                  + Добавить задачу
                </button>
              </div>

              <div className={styles.tasksList}>
                {tasks.map(task => {
                  const statusStyle = getTaskStatusLabel(task.status);
                  return (
                    <div key={genUUID()} className={styles.taskItem}>
                      <div className={styles.taskContent}>
                        <div className={styles.taskTitle}>{task.name}</div>
                        <div className={styles.taskSubtitle}>{task.desc}</div>
                        <div className={styles.taskMeta}>
                          <span className={styles.taskStatus} style={{ background: statusStyle.bg, color: statusStyle.color }}>
                            {statusStyle.text}
                          </span>
                          <span className={styles.taskAssignee}>
                            👤 {task.assignedToName || "Не назначен"}
                          </span>
                        </div>
                      </div>
                      <div className={styles.taskActions}>
                        <select
                          value={task.assignedTo || ""}
                          onChange={(e) => handleReassignTask(task.id, e.target.value ? Number(e.target.value) : null)}
                          className={styles.assigneeSelect}
                        >
                          <option value="">Назначить...</option>
                          {members.map(member => (
                            <option key={member.id} value={member.id}>
                              {member.username}
                            </option>
                          ))}
                        </select>
                        <select 
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as Task['status'])}
                          className={styles.statusSelect}
                        >
                          <option value="todo">К выполнению</option>
                          <option value="in_progress">В процессе</option>
                          <option value="done">Выполнено</option>
                        </select>
                        <button className={styles.delBtn} onClick={() => deleteTask(task.id)}>X</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={styles.chatPanel}>
              <div className={styles.chatMessages}>
                {messages.map(message => (
                  <div key={genUUID()} className={styles.messageItem}>
                    <div className={styles.messageAvatar}>
                      {message.username[0]}
                    </div>
                    <div className={styles.messageContent}>
                      <div className={styles.messageHeader}>
                        <span className={styles.messageAuthor}>{message.username}</span>
                      </div>
                      <div className={styles.messageText}>{message.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              <form className={styles.chatInputForm} onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Введите сообщение..."
                  className={styles.chatInput}
                />
                <button type="submit" className={styles.sendBtn}>
                  Отправить
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно добавления задачи */}
      {isAddTaskOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddTaskOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Добавить задачу</h3>
              <button className={styles.modalClose} onClick={() => setIsAddTaskOpen(false)}>✕</button>
            </div>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Название задачи"
              className={styles.modalInput}
              autoFocus
            />
            <input
              type="text"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              placeholder="Описание задачи"
              className={styles.modalInput}
              autoFocus
            />
            <select
              value={newTaskAssignee || ""}
              onChange={(e) => setNewTaskAssignee(e.target.value ? Number(e.target.value) : null)}
              className={styles.modalSelect}
            >
              <option value="">Назначить ответственного (опционально)</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.username}
                </option>
              ))}
            </select>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setIsAddTaskOpen(false)}>
                Отмена
              </button>
              <button className={styles.modalSubmit} onClick={handleAddTask}>
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}