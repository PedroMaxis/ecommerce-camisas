import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const demo = (arquivo) => path.resolve(raiz, "Client/src/demo", arquivo);

// No demo (modo "demo", publicado no GitHub Pages) as rotas CommonJS do servidor rodam no navegador:
// express, banco, JWT e bcrypt são trocados por versões simples em src/demo.
const servidorNoNavegador = () => ({
  name: "servidor-no-navegador",
  enforce: "pre",
  resolveId(origem, importador) {
    const doServidor = importador && (importador.startsWith(path.join(raiz, "src")) || importador.startsWith(path.join(raiz, "scripts")));
    if (!doServidor) return null;
    if (origem === "express") return demo("express-mini.cjs");
    if (origem === "jsonwebtoken") return demo("jwt-demo.cjs");
    if (origem === "bcryptjs") return demo("bcrypt-demo.cjs");
    if (/(^|\/)db$/.test(origem)) return demo("db-navegador.cjs");
    return null;
  },
});

// fora do modo demo o código do servidor não entra no pacote: o módulo do demo vira um stub vazio
const semDemo = () => ({
  name: "sem-demo",
  enforce: "pre",
  resolveId: (origem) => (/demo\/servidor\.js$/.test(origem) ? "\0demo-vazio" : null),
  load: (id) => (id === "\0demo-vazio" ? "export const chamar = () => { throw new Error('demo desligado'); };" : null),
});

// em desenvolvimento, /api vai para o Express (porta 3000): mesmo domínio, sem CORS
export default defineConfig(({ mode }) => {
  const ehDemo = mode === "demo";
  return {
    base: ehDemo ? "./" : "/",
    plugins: [react(), ehDemo ? servidorNoNavegador() : semDemo()],
    build: ehDemo ? { commonjsOptions: { include: [/node_modules/, new RegExp(escapar(raiz) + "/(src|scripts)/"), /src\/demo\/[^/]+\.cjs$/] } } : {},
    server: { port: 5173, proxy: { "/api": "http://localhost:3000" } },
    test: { environment: "node" },
  };
});
