import { create } from 'zustand';
import { axiosInstance } from '../lib/axios.js';
import { useAuthStore } from "./useAuthStore.js";
import toast from 'react-hot-toast';

export const useControlStore = create((set, get) => ({
    settings: null,
    history: [],
    vfdData: null, // Add VFD data state
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    },
    isSettingsLoading: false,
    isHistoryLoading: false,
    isUpdatingSetting: false,

    getSettings: async () => {
        set({ isSettingsLoading: true });
        try {
            const response = await axiosInstance.get('/control/');
            set({ settings: response.data });
        } catch (error) {
            console.log("Error fetching control settings: ", error.message);
            toast.error("Failed to fetch control settings");
        } finally {
            set({ isSettingsLoading: false });
        }
    },

    getHistory: async (page = 1, limit = 10) => {
        set({ isHistoryLoading: true });
        try {
            const response = await axiosInstance.get(`/control/history?page=${page}&limit=${limit}`);
            set({
                history: response.data.data,
                pagination: {
                    currentPage: response.data.currentPage,
                    totalPages: response.data.totalPages,
                    totalItems: response.data.totalItems,
                    itemsPerPage: response.data.itemsPerPage
                }
            });
        } catch (error) {
            console.log("Error fetching control history: ", error.message);
            toast.error("Failed to fetch control history");
        } finally {
            set({ isHistoryLoading: false });
        }
    },

    setSettings: async (setting) => {
        set({ isUpdatingSetting: true });
        try {
            await axiosInstance.post('/control/', setting);
            toast.success("Control settings updated successfully");
            // Refresh settings and history after update
            await get().getSettings();
            await get().getHistory(get().pagination.currentPage);
        } catch (error) {
            console.log("Error updating control setting: ", error.message);
            const errorMessage = error.response?.data?.error || "Failed to update control settings";
            toast.error(errorMessage);
            throw error;
        } finally {
            set({ isUpdatingSetting: false });
        }
    },

    // Subscribe to VFD data via WebSocket
    subscribeToVFD: () => {
        const socket = useAuthStore.getState().socket;

        if (!socket) {
            console.log("Socket not available");
            return;
        }

        // Hardcoded to device A - change if needed
        socket.on('vfdsA', (newData) => {
            set({ vfdData: newData });
        });
    },

    // Unsubscribe from VFD
    unsubscribeFromVFD: () => {
        const socket = useAuthStore.getState().socket;

        if (socket) {
            socket.off('vfdsA');
        }
    }
}));