'use client';

import { useState } from 'react';
import styles from './createRoomModal.module.css';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: { name: string; deadline: string }) => void;
}

export default function CreateRoomModal({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !deadline) return;
    
    setIsLoading(true);
    try {
      await onCreateRoom({ name: roomName.trim(), deadline });
      setRoomName('');
      setDeadline('');
      onClose();
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Минимальная дата - сегодня
  const minDate = new Date().toISOString().slice(0, 16);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>Создать комнату</h2>
          <p className={styles.subtitle}>Организуй пространство для своей команды</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="roomName" className={styles.label}>
              Название комнаты
            </label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className={styles.input}
              placeholder="например: Хакатон Цифровой Прорыв"
              maxLength={100}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="deadline" className={styles.label}>
              Дедлайн хакатона
            </label>
            <input
              type="datetime-local"
              id="deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={styles.input}
              min={minDate}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Создание...' : 'Создать комнату'}
          </button>
        </form>

        <div className={styles.info}>
          <p className={styles.infoText}>
            💡 После создания комнаты ты получишь уникальный код для приглашения участников
          </p>
        </div>
      </div>
    </div>
  );
}