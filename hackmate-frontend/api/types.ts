type SuccessResponce = {
    status: "success"
    data: unknown
}

type ErrorResponce = {
    status: "error"
    error: unknown
}

export type User = {
    id: number
    username: string
    github_username: string | undefined
}

export type WSMessage = {
    msg_type: string,
    me?: string,
    message: any
}

interface RoomData{
  room: Room
  members: Member[]
  tasks?: Task[]
}

export interface Room{
  id: number;
  name: string;
  code: string;
  desc: string;
  connected_user?: string;
  github_repo?: string;
  deadline: Date;
  members: Member[];
}

export interface Member {
  id: number;
  username: string;
}

export interface Task {
  id: number;
  name: string;
  desc?: string;
  status: 'todo' | 'in_progress' | 'done';
  assignedTo?: number;
  assignedToName?: string;
}

export interface Message {
  id: number;
  author: number;
  username: string;
  text: string;
}

export interface Commit {
  sha: string;
  commit: string;
  author: string;
  date: string;
  url: string;
}

export type APIResponce = SuccessResponce | ErrorResponce