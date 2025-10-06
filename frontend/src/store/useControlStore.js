import { create } from 'zustand';
import { axiosInstance } from '../lib/axios.js';

export const useControlStore = create((set, get) => ({
    settings: null,
    history: [],
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
        } finally {
            set({ isHistoryLoading: false });
        }
    },

    setSettings: async (setting) => {
        set({ isUpdatingSetting: true });
        try {
            await axiosInstance.post('/control/', setting);
            // Refresh history after setting new control
            get().getHistory(get().pagination.currentPage);
        } catch (error) {
            console.log("Error updating control setting: ", error.message);
        } finally {
            set({ isUpdatingSetting: false });
        }
    }
}));