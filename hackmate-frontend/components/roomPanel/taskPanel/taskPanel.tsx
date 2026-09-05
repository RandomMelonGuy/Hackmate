'use client'
import styles from "./taskPanel.module.css"
import { Task, Member } from "@/api/types";
import { Ref } from "react";
import request from "@/api/api";
import { Dispatch, SetStateAction, useState } from "react";
import { genUUID } from "@/utils/utils";

export default function TaskPanel({tasks, members, wsRef, setTasks, room_id}: {setTasks: Dispatch<SetStateAction<Task[]>>, wsRef: Ref<WebSocket>, members: Member[], tasks: Task[], room_id: number}){

    
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDesc, setNewTaskDesc] = useState("");
    const [newTaskAssignee, setNewTaskAssignee] = useState<number | null>(null);
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

    const deleteTask = async(taskID: number) => {
        console.log(taskID);
        const res = await request("/task/delete", "post", { id: taskID });
        if (res.status === "success"){
            setTasks(data => data.filter((el) => el.id !== taskID));
            wsRef?.current.send(JSON.stringify({msg_type: "task_deleted"})) // ignore
        }
        else{
            console.log(res);
            console.error("CAN NOT DELETE TASK");
        }
    }
     const handleReassignTask = async(taskId: number, memberId: number | null) => {
        const assignee = members.find(m => m.id === memberId);
        const task = tasks.find(el => el.id == taskId);
        if (!task) return;
        const res = await request("/task/update", "post", {name: task.name, desc: task.desc, status: task.status, assignedTo: memberId, task_id: taskId});
        if (res.status === "success"){
        setTasks(tasks.map(task => 
        task.id === taskId ? { 
            ...task, 
            assignedTo: memberId,
            assignedToName: assignee?.username
        } : task
        ));
        wsRef.current.send(JSON.stringify({msg_type: "task_updated"}))
        }
        else{
        alert("HUH")
        }
    };

    const handleUpdateTaskStatus = async(taskId: number, newStatus: Task['status']) => {
        const task = tasks.find(el => el.id == taskId);
        if (!task) return;
        const res = await request("/task/update", "post", {name: task.name, desc: task.desc, status: newStatus, assignedTo: task.assignedTo, task_id: taskId});
        if (res.status === "success"){
        wsRef.current.send(JSON.stringify({msg_type: "task_updated"}))
        setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
        ));
        }
        else{
        alert("Не удалось изменить статус. Проверьте соединение с интернетом.")
        }
    };

    const getTaskStatusLabel = (status: Task['status']) => {
        switch (status) {
        case 'todo': return { text: 'К выполнению', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
        case 'in_progress': return { text: 'В процессе', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' };
        case 'done': return { text: 'Выполнено', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
        }
    };

    const handleAddTask = async() => {
        if (!newTaskTitle.trim()) return;
        
        const assignee = members.find(m => m.id === newTaskAssignee);
        
        const newTask: Task = {
            name: newTaskTitle,
            desc: newTaskDesc,
            status: "todo",
            assignedTo: newTaskAssignee,
            assignedToName: assignee?.username,
        };

        const res = await request("/task/create", "post", { name: newTaskTitle, desc: newTaskDesc, status: "todo", assignedTo: newTaskAssignee, room_id: room_id });

        if (res.status === "success"){
        setTasks([...tasks, res.data]);
        wsRef.current.send(JSON.stringify({msg_type: "task_created"}))
        }

        else{
        console.log("ERROR ADDING A TASK")
        }

        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskAssignee(null);
        setIsAddTaskOpen(false);
    };

    return (
        <>
        <div className={styles.tasksPanel}>
            <div className={styles.tasksHeader}>
            <h2>Задачи спринта</h2>
            <button className={styles.addTaskBtn} onClick={() => setIsAddTaskOpen(true)}>
                + Добавить задачу
            </button>
            </div>

            <div className={styles.tasksList}>
            {tasks?.map(task => {
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
            {isAddTaskOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddTaskOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Добавить задачу</h3>
              <button className={styles.modalClose} onClick={() => setIsAddTaskOpen(false)}>✕</button>
            </div>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Название задачи"
              className={styles.modalInput}
              autoFocus
            />
            <input
              type="text"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              placeholder="Описание задачи"
              className={styles.modalInput}
            />
            <select
              value={newTaskAssignee || ""}
              onChange={(e) => setNewTaskAssignee(e.target.value ? Number(e.target.value) : null)}
              className={styles.modalSelect}
            >
              <option value="">Назначить ответственного (опционально)</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.username}
                </option>
              ))}
            </select>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setIsAddTaskOpen(false)}>
                Отмена
              </button>
              <button className={styles.modalSubmit} onClick={handleAddTask}>
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
        </>
    )
}