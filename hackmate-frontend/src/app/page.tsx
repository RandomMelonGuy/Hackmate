"use client"
import styles from './page.module.css';
import Link from "next/link"
import useAuth  from '../../contexts/AuthContext';
export default function Home() {
  // Для демонстрации: предположим, что пользователь НЕ авторизован
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
          <a href="#" className={styles.navLink}>О проекте</a>
          <a href="#" className={styles.navLink}>FAQ</a>
        </nav>
        <div className={styles.authButtons}>
          {!isAuth ? (
            <>
              <Link href="/login" className={styles.loginBtn}>Войти</Link>
              <Link href="/register" className={styles.registerBtn}>Регистрация</Link>
            </>
          ) : (
            <div className={styles.userMenu}>
              <span className={styles.userName}>{user?.username}</span>
              <div className={styles.avatar}></div>
            </div>
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
                  <button className={styles.primaryBtn}>➕ Создать комнату</button>
                  <button className={styles.secondaryBtn}>🔑 Войти по коду</button>
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
              <code>🔐 Room code: <span className={styles.highlightCode}>HACK-42NF-9KL</span></code>
              <code>✨ Пригласи друзей и начни кодить!</code>
            </div>
          </div>
        </section>

        {/* Секция преимуществ */}
        <section className={styles.features}>
          <h2 className={styles.sectionTitle}>Как это работает?</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>🏠</div>
              <h3>1. Создай комнату</h3>
              <p>Один клик — и твое командное пространство готово. Назови комнату и получи уникальный код доступа.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>📨</div>
              <h3>2. Поделись кодом</h3>
              <p>Отправь код приглашения своим будущим тиммейтам. Без регистрации и сложных приглашений.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>⚡</div>
              <h3>3. Работайте синхронно</h3>
              <p>Трекинг задач, общий чат и список участников — всё что нужно для победы на хакатоне.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}