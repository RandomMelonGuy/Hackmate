import styles from "./commit.module.css";
import { Commit } from "@/api/types";

export default function CommitPanel({commits, isLoadingCommits, connectedRepo, loadCommits}: {commits: Commit[],isLoadingCommits: boolean, connectedRepo: string | null, loadCommits: () => {}}){

    return (
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
              ) : commits?.length === 0 ? (
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
                  {commits?.map((commit) => (
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
    )
}