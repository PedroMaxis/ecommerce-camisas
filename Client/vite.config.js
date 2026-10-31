import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// em desenvolvimento, /api vai para o Express (porta 3000): mesmo domínio, sem CORS
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://localhost:3000" } },
  test: { environment: "node" },
});
