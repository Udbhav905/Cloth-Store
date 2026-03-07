import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    // Warn if any single chunk exceeds 400kb
    chunkSizeWarningLimit: 400,

    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — cached separately, never changes
          "vendor-react": ["react", "react-dom"],

          // Router — changes rarely
          "vendor-router": ["react-router-dom"],

          // Zustand state — tiny but isolated
          "vendor-zustand": ["zustand"],
        },
      },
    },
  },

  // Pre-bundle these on dev server start so first HMR is fast
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "zustand",
    ],
  },
});