'use client'
import styles from "./chat.module.css"
import { genUUID } from "@/utils/utils";
import { useState, Ref, SetStateAction, Dispatch } from "react";
import { Message, User } from "@/api/types";
import request from "@/api/api";

export default function ChatPanel({messages, setMessages, wsRef, room_id, user}: {messages: Message[], setMessages: Dispatch<SetStateAction<Message[]>>, wsRef: Ref<WebSocket>, room_id: number, user: User}){
    const [newMessage, setNewMessage] = useState("");
      const handleSendMessage = async(e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim()) return;
      
      const message: Message = {
        author: user?.id,
        username: user?.username,
        text: newMessage,
      };
      const res = await request("/chat/send", "post", {text: newMessage, room_id: room_id});
      if (res.status === "success"){
        setMessages([...messages, message]);
        setNewMessage("");
        wsRef.current.send(JSON.stringify({msg_type: "chat_messaged"}));
      }
      
  };
    return (
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
    )
}