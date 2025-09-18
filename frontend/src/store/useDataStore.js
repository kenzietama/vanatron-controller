import { create } from 'zustand';
import { axiosInstance } from '../lib/axios.js';
import { useAuthStore } from "./useAuthStore.js";

export const useDataStore = create((set, get) => ({
    graph: [],
    latestData: null,
    isValueLoading: false,
    isGraphLoading: true,
    isGraphRefreshing: false,

    getLatestData: async () => {
        set({ isValueLoading: true });
        try {
            const response = await axiosInstance.get('/displayitems/monitoring/latest');
            set({ latestData: response.data });
        } catch (error) {
            console.log("Error fetching data: ", error.message);
        } finally {
            set({ isValueLoading: false });
        }
    },

    getGraph: async (interval) => {
        if(get().graph.length === 0) {
            set({ isGraphLoading: true })
            // set({ isGraphRefeshing: true })
        } else {
            set({ isGraphRefreshing: true })
        }
        try {
            const res = await axiosInstance.get('/displayitems/monitoring/graph/interval=' + interval + '/')
            set({graph: res.data})
        } catch (error) {
            console.log("Error fetching graph: ", error.message)
        } finally {
            set({isGraphLoading: false})
            set({isGraphRefreshing: false})
        }
    },

    subscribe: async () => {
      const socket = useAuthStore.getState().socket

        try {
            const response  = await axiosInstance.get('/displayitems/')

            for (const item of response.data) {
                socket.on(`${item.socket}`, (newData) => {
                    set({latestData: get().latestData.map((data) => {
                        if (data.displayName === item.displayName) {
                            data.value = newData[data.parameter]
                        }
                        return data
                    })})
                })
            }
        } catch (error) {
            console.log("Error updating data: ", error.message)
        }
    },

}));
