import { io } from "socket.io-client";
import { BACKEND_BASE_URL } from "./constant";
export const createSocketConnection = () =>{
    return io(BACKEND_BASE_URL)
}