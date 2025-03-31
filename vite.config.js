import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 3000,
    allowedHosts: [".ngrok-free.app"],
  },
  build: {
    outDir: "dist",
  },
  base: "/", // Ensures correct base path
});
