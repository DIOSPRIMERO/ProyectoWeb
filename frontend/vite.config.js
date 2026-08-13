import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Todo lo que empiece con /api se reenvia al backend.
    // Asi el frontend llama a "/api/producciones" sin escribir la
    // direccion completa y sin problemas de CORS en desarrollo.
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["tests/preparar.js"],
  },
});
