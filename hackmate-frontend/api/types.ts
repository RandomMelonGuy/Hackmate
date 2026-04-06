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
}

export type WSMessage = {
    msg_type: string,
    me?: string,
    message: any
}

export type APIResponce = SuccessResponce | ErrorResponce