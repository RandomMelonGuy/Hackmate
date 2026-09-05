'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './room.module.css';
import request from '@/api/api';
import useAuth from '@/context/AuthContext';
import { WSMessage } from '@/api/types';
import TaskPanel from '@/components/roomPanel/taskPanel/taskPanel';
import ChatPanel from '@/components/roomPanel/chatPanel/chatPanel';
import CommitPanel from '@/components/roomPanel/commitPanel/commitPanel';
import { Member, Task, Commit, Message, Room } from '@/api/types';

interface RoomData{
  room: Room
  members: Member[]
  tasks?: Task[]
}



export default function RoomPage() {
  const { code } = useParams();
  const router = useRouter();
  const connectionRef = useRef<string>("0");
  const {user, isLoading } = useAuth();
  const wsRef = useRef<WebSocket>(0);
  const roomCode = code as string;
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [roomData, setRoomData] = useState<RoomData>({room: {
    id: 0,
    name: '',
    code: '',
    desc: "",
    deadline: new Date(),
    members: []
  }, members: [], tasks: []});
  const { room, members } = roomData;

  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat' | 'commits'>('tasks');

  // GitHub состояния
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  const [repositories, setRepositories] = useState<{ name: string; description: string }[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [connectedRepo, setConnectedRepo] = useState<string | null>(room?.github_repo);

  // Загрузка коммитов подключённого репозитория
  const loadCommits = async () => {
    if (!connectedRepo) return;
    
    setIsLoadingCommits(true);
    try {
      const response = await request(`/github/rooms/${roomCode}/commits`, "get");
      if (response.status === "success" && response.data) {
        setCommits(response.data);
      } else {
        setCommits([]);
        if (response.message) {
          console.error(response.message);
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки коммитов:", error);
      setCommits([]);
    } finally {
      setIsLoadingCommits(false);
    }
  };

  // Проверка подключённого репозитория при загрузке комнаты

  // Загрузка списка репозиториев GitHub
  const handleOpenRepoModal = async () => {
    setIsRepoModalOpen(true);
    setIsLoadingRepos(true);
    
    try {
      const response = await request("/github/repos", "get");
      if (response.status === "success" && response.data) {
        setRepositories(response.data);
      } else {
        setRepositories([]);
        alert("Не удалось загрузить репозитории. Возможно, вы не авторизованы через GitHub.");
      }
    } catch (error) {
      console.error("Ошибка загрузки репозиториев:", error);
      setRepositories([]);
      alert("Ошибка при загрузке репозиториев");
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Подключение выбранного репозитория
  const handleConnectRepo = async () => {
    if (!selectedRepo) {
      alert("Выберите репозиторий");
      return;
    }
    
    setIsConnecting(true);
    
    try {
      const response = await request("/github/repo/connect", "post", {
        room_id: room.id,
        repo: selectedRepo
      });
      
      if (response.status === "success") {
        alert(`Репозиторий ${selectedRepo} успешно подключён к комнате!`);
        setConnectedRepo(selectedRepo);
        
        const commitsResponse = await request(`/github/commits/${room.id}`, "get");
        if (commitsResponse.status === "success" && commitsResponse.data) {
          setCommits(commitsResponse.data);
        }
        
        setActiveTab('commits');
        setIsRepoModalOpen(false);
        setSelectedRepo(null);
      } else {
        alert(response.message || "Ошибка при подключении репозитория");
      }
    } catch (error) {
      console.error("Ошибка подключения:", error);
      alert("Ошибка при подключении репозитория");
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    console.log(user)
    let isMounted = true;
    async function getRoomData(code: string) {
      request(`/room/get/${code}`, "get").then(data => {
        if (!isMounted) return;
        if(data.status === "success"){
          setRoomData(data.data as RoomData)
          console.log(data.data)
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

    const checkConnectedRepo = async (roomCode: string) => {
    try {
      const res = await request(`/github/rooms/${roomCode}/commits`, "get")
      if (res.status == "success"){
        setCommits(res.data)
      }
      else {
        setConnectedRepo(null);
        setCommits([]);
      }
    } catch (error) {
      console.error("Ошибка проверки репозитория:", error);
      setConnectedRepo(null);
    }
  };

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
        console.log(data);
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
        else if (data.msg_type === "commits_updated"){
           setCommits(data.message)
        }
      }
    }

    getRoomData(roomCode);
    getTasks(roomCode);
    getMessages(roomCode);
    checkConnectedRepo(roomCode);

    return () => {
      isMounted = false;
      
      if (wsRef.current) {
          const wsToClose = wsRef.current;
          
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

  const tasksStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  return (
    <div className={styles.container}>
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
        <div style={{ display: 'flex', gap: '1rem' }}>
          {!room.github_repo ?
          <button 
            className={styles.githubRepoBtn} 
            onClick={handleOpenRepoModal}
          >
            🔗 Подключить репозиторий
          </button> : 
          <>
          <p>Подключен репозиторий <a href={`https://github.com/${room.connected_user}/${room.github_repo}`} style={{color: "white"}}>{connectedRepo}</a></p>
          <button 
            className={styles.githubRepoBtn} 
            onClick={handleOpenRepoModal}
          >
            🔗 Переключить репозиторий
          </button>
          </>
          }
          <button className={styles.leaveBtn} onClick={handleLeaveRoom}>
            Покинуть комнату
          </button>
        </div>
      </header>

      <div className={styles.mainGrid}>
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
                </div>
              </div>
            ))}
          </div>

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

          {room.desc && (
          <div className={styles.specBlock}>
            <div className={styles.specHeader}>
              <span>📋 Техническое задание</span>
            </div>
            <div className={styles.specContent}>
              <pre className={styles.pre}>{room.desc}</pre>
            </div>
          </div>
        )}
        </aside>

        <div className={styles.mainPanel}>
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
            {room?.github_repo ? (
              <button 
                className={`${styles.tab} ${activeTab === 'commits' ? styles.activeTab : ''}`}
                onClick={() => {
                  setActiveTab('commits');
                  if (commits.length === 0 && !isLoadingCommits) {
                    loadCommits();
                  }
                }}
              >
                📜 Коммиты
              </button>
            ) : ""}
          </div>

          {activeTab === 'tasks' ? (
            <TaskPanel tasks={tasks} members={members} wsRef={wsRef} setTasks={setTasks} room_id={room.id} />
          ) : activeTab === 'chat' ? (
            <ChatPanel wsRef={wsRef} messages={messages} room_id={room.id} setMessages={setMessages} user={user} />
          ) : activeTab === 'commits' ? (
            <CommitPanel commits={commits} loadCommits={loadCommits} isLoadingCommits={isLoadingCommits} connectedRepo={connectedRepo} />
          ) : ""}
        </div>
      </div>


      {/* Модальное окно выбора репозитория GitHub */}
      {isRepoModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsRepoModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🔗 Подключить репозиторий</h3>
              <button className={styles.modalClose} onClick={() => setIsRepoModalOpen(false)}>✕</button>
            </div>
            
            {isLoadingRepos ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className={styles.loader} style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Загрузка репозиториев...</p>
              </div>
            ) : repositories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                <p>📦 Нет доступных репозиториев</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  Убедитесь, что вы авторизовались через GitHub<br />
                  и у вас есть публичные репозитории
                </p>
              </div>
            ) : (
              <>
                <div className={styles.repoList}>
                  {repositories.map((repo) => (
                    <div
                      key={repo.name}
                      className={`${styles.repoItem} ${selectedRepo === repo.name? styles.repoItemSelected : ''}`}
                      onClick={() => setSelectedRepo(repo.name)}
                    >
                      <span className={styles.repoIcon}>📁</span>
                      <div className={styles.repoInfo}>
                        <div className={styles.repoName}>{repo.name}</div>
                        <div className={styles.repoFullName}>{repo.description}</div>
                      </div>
                      {selectedRepo === repo.description && (
                        <span className={styles.repoCheck}>✓</span>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className={styles.modalActions}>
                  <button 
                    className={styles.modalCancel} 
                    onClick={() => setIsRepoModalOpen(false)}
                    disabled={isConnecting}
                  >
                    Отмена
                  </button>
                  <button 
                    className={styles.modalSubmit} 
                    onClick={handleConnectRepo}
                    disabled={!selectedRepo || isConnecting}
                  >
                    {isConnecting ? 'Подключение...' : 'Подключить'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}