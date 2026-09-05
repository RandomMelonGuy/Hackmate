// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/context/AuthContext';
import request from '@/api/api';
import CreateRoomModal from '@/components/createRoomModal';
import JoinRoomModal from '@/components/joinRoomModal';
import styles from './dashboard.module.css';
import Cookies from 'js-cookie';

interface Room {
    id: number;
    name: string;
    code: string;
    deadline: string;
    expired: boolean;
    member_count?: number;
}

export default function Dashboard() {
    const { user, isLoading: isUserLoading, isAuth } = useAuth();
    const router = useRouter();
    
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isRoomsLoading, setIsRoomsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    
    // Эффект для редиректа — только после завершения загрузки
    useEffect(() => {
        // Если ещё загружается — ничего не делаем
        if (isUserLoading) return;
        
        // Если загрузка закончилась и пользователя нет — редирект
        if (!isAuth) {
            router.push('/login');
        }
    }, [isUserLoading, isAuth, router]);
    
    // Эффект для загрузки комнат — только когда пользователь загружен
    useEffect(() => {
        // Ждём окончания загрузки пользователя
        if (isUserLoading) return;
        
        // Если нет пользователя — не загружаем комнаты
        if (!user) return;
        
        async function fetchUserRooms() {
            setIsRoomsLoading(true);
            try {
                const response = await request('/room/get_users', 'post', {id: user.id});
                console.log('Rooms response:', response);
                
                if (response.status === 'success') {
                    setRooms(response.data || []);
                } else {
                    // Если эндпоинт не найден, используем заглушку для теста
                    console.warn('API endpoint not found, using mock data');
                }
            } catch (error) {
                console.error('Failed to fetch rooms:', error);
            } finally {
                setIsRoomsLoading(false);
            }
        }
        console.log(user)
        
        fetchUserRooms();
    }, [user, isUserLoading]);
    
    const handleCreateRoom = async (roomData: { name: string; description: string; deadline: string }) => {
        try {
            const response = await request('/room/create', 'post', roomData);
            if (response.status === 'success') {
                setRooms(prev => [response.data, ...prev]);
                console.log(roomData)
                setIsCreateModalOpen(false);
            }
        } catch (error) {
            console.error('Failed to create room:', error);
    }
    };
    
    const handleJoinRoom = async (roomCode: string) => {
        try {
            const response = await request(`/room/join/`, 'post', { code: roomCode });
            if (response.status === 'success') {
                setRooms(prev => [response.data, ...prev]);
                setIsJoinModalOpen(false);
            } else {
                console.error('Join room failed:', response);
                alert('Не удалось присоединиться к комнате');
            }
        } catch (error) {
            console.error('Failed to join room:', error);
            alert('Ошибка при присоединении к комнате');
        }
    };
    
    const handleEnterRoom = (roomCode: string) => {
        router.push(`/room/${roomCode}`);
    };
    
    // Показываем лоадер только во время загрузки
    if (isUserLoading || isRoomsLoading) {
        return (
            <div className={styles.loaderContainer}>
                <div className={styles.loader}></div>
                <p>Загрузка...</p>
            </div>
        );
    }
    // GitHub OAuth login handler
    const handleGitHubLogin = () => {
    const session = Cookies.get("session");
    console.log(session, "SESSION")
    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
        `http://localhost:8000/github/enter?session=${session}`,
        'github_login',
        `width=${width},height=${height},left=${left},top=${top},popup=1`
    );

    const checkPopup = setInterval(() => {
        if (popup.closed) {
        clearInterval(checkPopup);
        window.location.reload();
        }
    }, 500);
    };
    
    // Если пользователя нет (и загрузка завершена), не рендерим (редирект уже сработал)
    if (!user) {
        return null;
    }
    
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>🚀</span>
                    <span className={styles.logoText}>HackRoom</span>
                </div>
                <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.username}</span>
                    <button 
                        className={styles.logoutBtn}
                        onClick={() => {
                            Cookies.remove('session');
                            router.push('/login');
                        }}
                    >
                        Выйти
                    </button>
                </div>
            </header>
            
            <main className={styles.main}>
                <div className={styles.actions}>
                    <h1 className={styles.title}>Мои комнаты</h1>
                    <div className={styles.buttonGroup}>
                        <button 
                            className={styles.createBtn}
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            ➕ Создать комнату
                        </button>
                        <button 
                            className={styles.joinBtn}
                            onClick={() => setIsJoinModalOpen(true)}
                        >
                            🔑 Войти по коду
                        </button>
                    </div>
                    {user.github_username ? <></> : 
                    <button onClick={handleGitHubLogin} className={styles.githubBtn}>
                    <span className={styles.githubIcon}>🐙</span>
                    Войти с Github
                    </button>
                    }

                </div>
                
                {rooms.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🏠</div>
                        <h3>У вас пока нет комнат</h3>
                        <p>Создайте новую комнату или присоединитесь к существующей по коду</p>
                    </div>
                ) : (
                    <div className={styles.roomsGrid}>
                        {rooms.map(room => (
                            <div key={room.id} className={styles.roomCard}>
                                <div className={styles.roomHeader}>
                                    <h3 className={styles.roomName}>{room.name}</h3>
                                    {room.expired && <span className={styles.expiredBadge}>Просрочена</span>}
                                </div>
                                <div className={styles.roomDetails}>
                                    <div className={styles.roomCode}>
                                        Код: <code>{room.code}</code>
                                    </div>
                                    <div className={styles.roomDeadline}>
                                        Дедлайн: {new Date(room.deadline).toLocaleString()}
                                    </div>
                                </div>
                                <button 
                                    className={styles.enterBtn}
                                    onClick={() => handleEnterRoom(room.code)}
                                    disabled={room.expired}
                                >
                                    {room.expired ? 'Доступ закрыт' : 'Войти в комнату →'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            
            <CreateRoomModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreateRoom={handleCreateRoom}
            />
            
            <JoinRoomModal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
                onJoinRoom={handleJoinRoom}
            />
        </div>
    );
}