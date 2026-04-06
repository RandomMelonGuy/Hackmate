// context/AuthContext.tsx
"use client"
import request from "@/api/api";
import { APIResponce, User } from "@/api/types"
import Cookie from "js-cookie";
import { useState, useEffect, createContext, ReactNode, useContext } from "react";
import { useRouter } from "next/navigation";

interface AuthData{
    username: string,
    password: string
}

interface AuthCotnextData{
    user?: User,
    isAuth: boolean,
    login: (data: AuthData) => unknown,
    register: (data: AuthData) => unknown,
    isLoading: boolean
}

const AuthContext = createContext<AuthCotnextData | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}){
    const [user, setUser] = useState<User| undefined>(undefined);
    const [isLoading, setLoading] = useState<boolean>(true); // 👈 ИЗМЕНЕНО: true вместо false
    const router = useRouter();

    useEffect(() => {
        const session = Cookie.get("session");
        
        if (!session) {
            setLoading(false); // 👈 Нет сессии - загрузка закончена
            return;
        }
        
        request("/auth/jwt/", "get")
            .then(data => {
                if (data.status === "success") {
                    setUser(data.data as User);
                }
            })
            .catch(e => console.log(e))
            .finally(() => setLoading(false)); // 👈 Всегда устанавливаем false
    }, []);

    async function login(data: AuthData) {
        const res = await request("/auth/", "post", data);
        if (res.status === "success"){
            // После логина нужно перезагрузить данные пользователя
            const userData = await request("/auth/jwt/", "get");
            if (userData.status === "success") {
                setUser(userData.data as User);
            }
            else{
                return false;
            }
            router.push("/dashboard"); // 👈 На дашборд, а не на главную
            return true;
        }
        return false
    }

    async function register(data: AuthData) {
        const res = await request("/register/", "post", data);
        if (res.status === "success"){
            // После регистрации сразу логиним
            return login(data);
        }
        return false
    }

    const value = {
        user,
        register,
        login,
        isAuth: !!user,
        isLoading: isLoading
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export default function useAuth(){
    const data = useContext(AuthContext);
    if (!data){
        throw new Error("useAuth must be used within AuthProvider")
    }
    return data
}