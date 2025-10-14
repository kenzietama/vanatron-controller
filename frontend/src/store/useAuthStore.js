import { create } from "zustand"
import {axiosInstance} from "../lib/axios"
import {io} from "socket.io-client"
import toast from "react-hot-toast";

const BASE_URL = process.env.REACT_APP_BACKEND_URL

export const useAuthStore = create((set, get) => ({
    authAccount: null,
    socket: null,
    errorMessage: null,
    isLoggingIn: null,
    isCheckingAuth: false,

    checkAuth: async () => {
        set({isCheckingAuth: true});
        try {
            const res = await axiosInstance.get("/auth/check");

            set({authAccount: res.data});
            get().connectSocket()
        } catch (error) {
            set({authAccount: null});
        } finally {
            set({isCheckingAuth: false});
        }
    },

    login: async (data) => {
        set({isLoggingIn: true});
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({authAccount: res.data});
            toast.success("Logged in successfully");

            get().connectSocket()
        } catch (error) {
            set({errorMessage: error.response.data.message});
        } finally {
            set({isLoggingIn: false});
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({authAccount: null});
            toast.success("Logged out successfully");

            get().disconnectSocket()
        } catch (error) {
            set({errorMessage: error.response.data.message});
        }
    },

    connectSocket: () => {
        const socket = io(BASE_URL);
        socket.connect()
        set({socket: socket})
    },

    disconnectSocket: () => {
        if (get().socket?.connected) {
            get().socket.disconnect()
        }
    }
}))