"use client"
import styles from './register.module.css';
import useAuth from '@/context/AuthContext';
import { useState } from 'react';
export default function Register() {
  const {register} = useAuth();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rpass, setRPass] = useState<string>("");

  const clickHandler = async() => {
    if (password !== rpass){
      alert("Пароли не совпадают");
      return;
    }
    const data = {username, password};
    const success = register(data);
    if (!success) alert("Имя пользователя уже занято");
  }

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <div className={styles.cardHeader}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🚀</span>
            <span className={styles.logoText}>HackRoom</span>
          </div>
          <h1 className={styles.title}>Создать аккаунт</h1>
          <p className={styles.subtitle}>Присоединяйся к хакатон-комьюнити</p>
        </div>

          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>
              Имя пользователя
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className={styles.input}
              placeholder="например: hackmaster"
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
              autoComplete="new-password"
              required
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Подтвердите пароль
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={styles.input}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              onChange={e => setRPass(e.target.value)}
            />
          </div>

          <button onClick={clickHandler} className={styles.submitBtn}>
            Зарегистрироваться
          </button>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Уже есть аккаунт?{' '}
            <a href="/login" className={styles.link}>
              Войдите
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