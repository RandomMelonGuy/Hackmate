'use client'
import styles from "./page.module.css"
import { useState } from "react";

export default function RoomPanel(){
    const [activeTab, setActiveTab] = useState<'tasks' | 'chat' | 'commits'>('tasks');
    return (
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
          ) : activeTab === 'chat' ? (
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
          ) : activeTab === 'commits' ? (
            <div className={styles.commitsPanel}>
              <div className={styles.commitsHeader}>
                <h2>📜 История коммитов</h2>
                {connectedRepo && (
                  <div className={styles.connectedRepoInfo}>
                    <span className={styles.repoBadge}>🔗 {connectedRepo}</span>
                    <button 
                      className={styles.refreshCommitsBtn} 
                      onClick={loadCommits}
                      disabled={isLoadingCommits}
                    >
                      🔄 Обновить
                    </button>
                  </div>
                )}
              </div>

              {isLoadingCommits ? (
                <div className={styles.commitsLoader}>
                  <div className={styles.loader}></div>
                  <p>Загрузка коммитов...</p>
                </div>
              ) : commits.length === 0 ? (
                <div className={styles.emptyCommits}>
                  <span className={styles.emptyIcon}>📭</span>
                  <h3>Нет коммитов</h3>
                  <p>
                    {connectedRepo 
                      ? "В этом репозитории пока нет коммитов или они не загрузились" 
                      : "Репозиторий не подключён. Нажмите 'Подключить репозиторий' выше"}
                  </p>
                </div>
              ) : (
                <div className={styles.commitsList}>
                  {commits.map((commit) => (
                    <div key={commit.sha} className={styles.commitItem}>
                      <div className={styles.commitAvatar}>
                        <span>📝</span>
                      </div>
                      <div className={styles.commitContent}>
                        <div className={styles.commitMessage}>{commit.commit}</div>
                        <div className={styles.commitMeta}>
                          <span className={styles.commitAuthor}>👤 {commit.author}</span>
                          <span className={styles.commitDate}>📅 {new Date(commit.date).toLocaleString('ru-RU')}</span>
                          <a 
                            href={commit.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.commitLink}
                          >
                            🔗 #{commit.sha.slice(0, 7)}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : ""}
        </div>
    )
}