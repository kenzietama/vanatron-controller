import { create } from 'zustand';
import { axiosInstance } from '../lib/axios.js';
import { useAuthStore } from "./useAuthStore.js";

export const useControlStore = create((set, get) => ({
    settings: null,
    isSettingsLoading: false,
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

    setSettings: async (setting) => {
        set({ isUpdatingSetting: true});
        try {
            await axiosInstance.post('/control/', setting);
        } catch (error) {
            console.log("Error updating control setting: ", error.message);
        } finally {
            set({ isUpdatingSetting: false} );
        }
    }
}));