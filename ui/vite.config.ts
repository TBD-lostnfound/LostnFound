import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api/items": "http://localhost:8790",
      "/images": "http://localhost:8790",
      "/api": "http://localhost:8787",
    },
  },
});
