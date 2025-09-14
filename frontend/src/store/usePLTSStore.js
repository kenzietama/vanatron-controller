import { create } from 'zustand';
import { axiosInstance } from '../lib/axios.js';
import { useAuthStore } from "./useAuthStore.js";

export const usePLTSStore = create((set, get) => ({
    VFD: [],              
    latestVFD: null,
    InverterSolis: [],     
    latestInverterSolis: null, 
    InverterSRNE: [],     
    latestInverterSRNE: null, 

    // Fungsi untuk mengambil data VFD (10 data terakhir)
    getVFD: async () => {
        try {
            const res = await axiosInstance.get('/vfd/graph');
            if (Array.isArray(res.data)) {
                const array = res.data.map(VFD => VFD.output_power);
                set({ VFD: array });
            } else {
                console.error("Expected an array but got:", res.data);
            }
        } catch (error) {
            console.log("Error in getVFD:", error.message);
        }
    },

    // Fungsi untuk mengambil data terbaru VFD
    getLatestVFD: async () => {
        try {
            const res = await axiosInstance.get('/vfd/');
            set({latestVFD: {
                    output_power: res.data[0].output_power
                }})
        } catch (error) {
            console.log("Error in getLatestVFD:", error.message);
        }
    },

    // Fungsi untuk mengambil data InverterSolis (10 data terakhir)
    getInverterSolis: async () => {
        try {
            const res = await axiosInstance.get('/InverterSolis/graph');
            if (Array.isArray(res.data)) {
                const array = res.data.map(InverterSolis => InverterSolis.this_month_energy);
                set({ InverterSolis: array });
            } else {
                console.error("Expected an array but got:", res.data);
            }
        } catch (error) {
            console.log("Error in getInverterSolis:", error.message);
        }
    },
    
    // Fungsi untuk mengambil data terbaru InverterSolis
    getLatestInverterSolis: async () => {
        try {
            const res = await axiosInstance.get('/InverterSolis/');
            set({latestInverterSolis: {
                this_month_energy: res.data[0].this_month_energy
                }})
        } catch (error) {
            console.log("Error in getLatestInverterSolis:", error.message);
        }
    },

    // Fungsi untuk mengambil data InverterSRNE (10 data terakhir)
    getInverterSRNE: async () => {
        try {
            const res = await axiosInstance.get('/InverterSRNE/graph');
            if (Array.isArray(res.data)) {
                const array = res.data.map(inverter => ({
                    pv_power: inverter.pv_power,
                    battery_level: inverter.battery_level
                }));
                set({ InverterSRNE: array });
            } else {
                console.error("Expected an array but got:", res.data);
            }
        } catch (error) {
            console.log("Error in getInverterSRNE:", error.message);
        }
    },

    // Fungsi untuk mengambil data terbaru InverterSRNE
    getLatestInverterSRNE: async () => {
        try {
            const res = await axiosInstance.get('/InverterSRNE/');
            if (Array.isArray(res.data) && res.data.length > 0) {
                set({
                    latestInverterSRNE: {
                        pv_power: res.data[0].pv_power,
                        battery_level: res.data[0].battery_level,
                    }
                });
            } else {
                console.error("No data found for InverterSRNE.");
            }
        } catch (error) {
            console.log("Error in getLatestInverterSRNE:", error.message);
        }
    },

    // Fungsi untuk mendengarkan pembaruan data via WebSocket
    subscribeSocket: () => {
        const socket = useAuthStore.getState().socket;

        // Hindari duplikasi listener
        socket.off("newDataVFD");
        socket.off("newDataInverterSolis");
        socket.off("newDataInverterSRNE");

        // Pembaruan data untuk VFD
        socket.on("newDataVFD", (newData) => {
            if (newData?.output_power) {
                set((state) => {
                    const updatedVFD = [...state.VFD];
                    updatedVFD.unshift(newData.output_power);
                    if (updatedVFD.length > 10) updatedVFD.pop();
                    return { latestVFD: newData.output_power, VFD: updatedVFD };
                });
                console.log("Updated VFD Data:", newData.output_power);
            }
        });

        // Pembaruan data untuk Inverter Solis
        socket.on("newDataInverterSolis", (newData) => {
            if (newData?.this_month_energy) {
                set((state) => {
                    const updatedInverterSolis = [...state.InverterSolis];
                    updatedInverterSolis.unshift(newData.this_month_energy);
                    if (updatedInverterSolis.length > 10) updatedInverterSolis.pop();
                    return { latestInverterSolis: newData.this_month_energy, InverterSolis: updatedInverterSolis };
                });
                console.log("Updated Inverter Solis Data:", newData.this_month_energy);
            }
        });

        // Pembaruan data untuk InverterSRNE
        socket.on("newDataInverterSRNE", (newData) => {
            if (newData?.pv_power || newData?.battery_level) {
                set((state) => {
                    const updatedInverterSRNE = [...state.InverterSRNE];
                    updatedInverterSRNE.unshift({
                        pv_power: newData.pv_power,
                        battery_level: newData.battery_level
                    });
                    if (updatedInverterSRNE.length > 10) updatedInverterSRNE.pop();
                    return {
                        latestInverterSRNE: {
                            pv_power: newData.pv_power,
                            battery_level: newData.battery_level
                        },
                        InverterSRNE: updatedInverterSRNE
                    };
                });
                console.log("Updated InverterSRNE Data:", newData);
            }
        });
    },
}));
