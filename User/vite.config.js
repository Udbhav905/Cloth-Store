import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    chunkSizeWarningLimit: 400,

    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],

          "vendor-router": ["react-router-dom"],

          "vendor-zustand": ["zustand"],
        },
      },
    },
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "zustand",
    ],
  },
});