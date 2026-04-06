"use client"
import styles from './login.module.css';
import useAuth from '@/context/AuthContext';
import { useState } from 'react';

export default function Login() {
  const {login} = useAuth();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const clickHandler = async() => {
    const data = {username, password};
    const success = await login(data);
    if (!success) alert("Пользователь не найден")
  }

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <div className={styles.cardHeader}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🚀</span>
            <span className={styles.logoText}>HackRoom</span>
          </div>
          <h1 className={styles.title}>Добро пожаловать</h1>
          <p className={styles.subtitle}>Войдите в свой аккаунт</p>
        </div>

        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>
              Имя пользователя
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className={styles.input}
              placeholder="введите имя пользователя"
              autoComplete="username"
              required
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Пароль
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={styles.input}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className={styles.options}>
          </div>

          <button type="submit" onClick={clickHandler} className={styles.submitBtn}>
            Войти
          </button>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Нет аккаунта?{' '}
            <a href="/register" className={styles.link}>
              Зарегистрируйтесь
            </a>
          </p>
        </div>
      </div>

      {/* Декоративные элементы */}
      <div className={styles.decorCircle1}></div>
      <div className={styles.decorCircle2}></div>
    </div>
  );
}