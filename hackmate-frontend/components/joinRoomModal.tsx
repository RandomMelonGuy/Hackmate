'use client';

import { useState } from 'react';
import styles from './joinRoomModal.module.css';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomCode: string) => void;
}

export default function JoinRoomModal({ isOpen, onClose, onJoinRoom }: JoinRoomModalProps) {
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    
    setIsLoading(true);
    try {
      await onJoinRoom(roomCode.trim());
      setRoomCode('');
      onClose();
    } catch (error) {
      console.error('Error joining room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>Войти в комнату</h2>
          <p className={styles.subtitle}>Введи код приглашения от организатора</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="roomCode" className={styles.label}>
              Код комнаты
            </label>
            <input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className={styles.input}
              placeholder="например: HACK-42NF-9KL"
              maxLength={20}
              autoComplete="off"
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Подключение...' : 'Войти в комнату'}
          </button>
        </form>

        <div className={styles.demoCode}>
          <p className={styles.demoText}>
            🔑 Демо-код для теста: <span className={styles.demoCodeValue}>HACK-42NF-9KL</span>
          </p>
        </div>
      </div>
    </div>
  );
}