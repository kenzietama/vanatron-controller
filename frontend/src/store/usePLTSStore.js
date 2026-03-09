import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

export const usePLTSStore = create((set, get) => ({

  /* =========================
     STATE
  ========================= */

  graphVFD: [],
  graphInverterSRNE: [],

  latestVFD: null,
  latestInverterSRNE: null,

  isValueLoading: false,
  isGraphLoading: true,
  isGraphRefreshing: false,


  /* =========================
     GET LATEST DATA
  ========================= */

  getLatestData: async () => {

    set({ isValueLoading: true });

    try {

      const vfd = await axiosInstance.get("/vfd/");
      const inverter = await axiosInstance.get("/InverterSRNE/");

      set({

        latestVFD: vfd.data?.[0] || null,

        latestInverterSRNE: inverter.data?.[0] || null

      });

    } catch (error) {

      console.log("Error fetching latest PLTS data:", error.message);

    } finally {

      set({ isValueLoading: false });

    }

  },


  /* =========================
     GET GRAPH (10 DATA TERAKHIR)
  ========================= */

  getGraph: async () => {

    if (get().graphVFD.length === 0) {
      set({ isGraphLoading: true });
    } else {
      set({ isGraphRefreshing: true });
    }

    try {

      const vfd = await axiosInstance.get("/vfd/graph");
      const inverter = await axiosInstance.get("/InverterSRNE/graph");

      set({

        graphVFD: vfd.data.slice(0, 10),

        graphInverterSRNE: inverter.data.slice(0, 10)

      });

    } catch (error) {

      console.log("Error fetching graph:", error.message);

    } finally {

      set({ isGraphLoading: false });

      set({ isGraphRefreshing: false });

    }

  },


  /* =========================
     SUBSCRIBE WEBSOCKET
  ========================= */

  subscribe: async () => {

    const socket = useAuthStore.getState().socket;

    if (!socket) return;

    socket.off("vfdsA");
    socket.off("invertersrnesA");


    /* ======================
       UPDATE VFD
    ====================== */

    socket.on("vfdsA", (newData) => {

      if (!newData?.output_power) return;

      set((state) => {

        const updatedGraph = [...state.graphVFD];

        updatedGraph.unshift(newData);

        if (updatedGraph.length > 10) updatedGraph.pop();

        return {

          latestVFD: newData,

          graphVFD: updatedGraph

        };

      });

    });


    /* ======================
       UPDATE INVERTER
    ====================== */

    socket.on("invertersrnesA", (newData) => {

      set((state) => {

        const updatedGraph = [...state.graphInverterSRNE];

        updatedGraph.unshift(newData);

        if (updatedGraph.length > 10) updatedGraph.pop();

        return {

          latestInverterSRNE: newData,

          graphInverterSRNE: updatedGraph

        };

      });

    });

  }

}));