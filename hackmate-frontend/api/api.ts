import { APIResponce } from "./types";


async function request(url: string, method: "post" | "get", body?: {}): Promise<APIResponce> {
    const path = `http://127.0.0.1:8000${url}`;
    try{
        if (method === "get"){
            const res: APIResponce = await (await fetch(path, {credentials: "include"})).json()
            return res
        }
        const res: APIResponce = await (await fetch(path, {method: "POST", body: JSON.stringify(body), headers: {'Content-Type': "application/json"}, credentials: "include"})).json()
        return res
    }
    catch (e){
        console.log(e);
        return {status: "error", "error": "CONNECTION ERROR"} as APIResponce
    }
}

export default request;