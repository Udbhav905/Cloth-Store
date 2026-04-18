import { create } from "zustand";

const useApiStore = create(() => ({
  API: "http://localhost:3000/api",
}));

export default useApiStore;