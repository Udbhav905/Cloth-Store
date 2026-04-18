import { create } from "zustand";

const useApiStore = create(() => ({
  API: "https://cloth-store-backend-qe63.onrender.com/api"
}));

export default useApiStore;