import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // Same paths as online (ui/nginx.conf), so fetch("/api/chat") works on laptops too.
    proxy: {
      "/api/chat": "http://localhost:8787",
      "/api/items": "http://localhost:8790",
      "/images/": "http://localhost:8790",
    },
  },
});
