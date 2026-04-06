"use client"
import styles from './page.module.css';
import Link from "next/link"
import useAuth  from '../../contexts/AuthContext';
import CreateRoomModal from '@/components/createRoomModal';
import JoinRoomModal from '@/components/joinRoomModal';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import request from '@/api/api';
interface Room{
  id: number;
  name: string;
  code: string;
  desc: string;
  deadline: Date;
}
export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const router = useRouter();
  // Для демонстрации: предположим, что пользователь НЕ авторизован
   const handleCreateRoom = async (roomData: { name: string; desc: string; deadline: string }) => {
        try {
            const response = await request('/room/create', 'post', roomData);
            if (response.status === 'success') {
                const room = response.data as Room;
                router.push(`/room/${room.code}`);

            }
        } catch (error) {
            console.error('Failed to create room:', error);
    }
    };
    const handleJoinRoom = async (roomCode: string) => {
      try {
          const response = await request(`/room/join/`, 'post', { code: roomCode });
          if (response.status === 'success') {
              setIsJoinModalOpen(false);
              router.push(`/room/${roomCode}`);
          } else {
              console.error('Join room failed:', response);
              alert('Не удалось присоединиться к комнате');
          }
      } catch (error) {
          console.error('Failed to join room:', error);
          alert('Ошибка при присоединении к комнате');
      }
  };
  const {user, isAuth} = useAuth();
  return (
    <>
      {/* Хедер */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🚀</span>
          <span className={styles.logoText}>HackRoom</span>
        </div>
        <nav className={styles.nav}>

        </nav>
        <div className={styles.authButtons}>
          {!isAuth ? (
            <>
              <Link href="/login" className={styles.loginBtn}>Войти</Link>
              <Link href="/register" className={styles.registerBtn}>Регистрация</Link>
            </>
          ) : (
            <Link href="/dashboard">
            <div className={styles.userMenu}>
              <span className={styles.userName}>{user?.username}</span>
              <div className={styles.avatar}></div>
            </div>
            </Link>
          )}
        </div>
      </header>

      {/* Hero секция */}
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              Создай пространство для команды <br />
              <span className={styles.gradientText}>и начните кодить вместе</span>
            </h1>
            <p className={styles.description}>
              Мгновенная организация участников хакатона. Создайте комнату, пригласите тиммейтов по уникальному коду и управляйте задачами в одном месте.
            </p>
            <div className={styles.buttonGroup}>
              {!isAuth ? (
                <>
                  <Link className={styles.primaryBtn} href="/login">Войдите чтобы создать или войти комнату</Link>
                </>
              ) : (
                <>
                  <button className={styles.primaryBtn} onClick={() => setIsCreateModalOpen(true)}>➕ Создать комнату</button>
                  <button className={styles.secondaryBtn} onClick={() => setIsJoinModalOpen(true)}>Войти по коду</button>
                </>
              )}
            </div>
            {!isAuth && (
              <p className={styles.authHint}>
                ✨ <Link href="/login" className={styles.authLink}>Авторизуйтесь</Link>, чтобы создавать комнаты и присоединяться к командам
              </p>
            )}
          </div>
          <div className={styles.heroGraphic}>
            <div className={styles.codeBlock}>
              <code>$ room create "hack-team-2025"</code>
              <code>Room code: <span className={styles.highlightCode}>HACK-42NF-9KL</span></code>
              <code>Пригласи друзей и начни кодить!</code>
            </div>
          </div>
        </section>

        {/* Секция преимуществ */}
        <section className={styles.features}>
          <h2 className={styles.sectionTitle}>Как это работает?</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              { /* <div className={styles.cardIcon}>🏠</div> */}
              <h3>1. Создай комнату</h3>
              <p>Один клик — и твое командное пространство готово. Назови комнату и получи уникальный код доступа.</p>
            </div>
            <div className={styles.card}>
              { /* <div className={styles.cardIcon}>📨</div> */}
              <h3>2. Поделись кодом</h3>
              <p>Отправь код приглашения своим будущим тиммейтам. Без регистрации и сложных приглашений.</p>
            </div>
            <div className={styles.card}>
              { /* <div className={styles.cardIcon}>⚡</div> */}
              <h3>3. Работайте синхронно</h3>
              <p>Трекинг задач, общий чат и список участников — всё что нужно для победы на хакатоне.</p>
            </div>
          </div>
        </section>
      </div>
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
    </>
  );
}