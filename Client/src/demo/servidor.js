// "Servidor" do demo: roda no navegador as MESMAS rotas de src/routes sobre um SQLite em memória (sql.js).
// Um mini-Express (express-mini.cjs) faz o papel do Express; o banco nasce com o catálogo de demonstração a cada visita.
import initSqlJs from "sql.js";
import wasm from "sql.js/dist/sql-wasm.wasm?url";
import { HttpError } from "../../../src/errors.js";
import usuarios from "../../../src/routes/usuarios.js";
import produtos from "../../../src/routes/produtos.js";
import admin from "../../../src/routes/admin.js";
import loja from "../../../src/routes/loja.js";
import carrinho from "../../../src/routes/carrinho.js";
import pedidos from "../../../src/routes/pedidos.js";
import { semear } from "../../../scripts/catalogo.js";
import { Router } from "./express-mini.cjs";
import { abrirBanco } from "./db-navegador.cjs";

const config = { segredo: "demo", validade: "7d", origens: [], limitarAutenticacao: false };

let pronto;
function iniciar() {
  pronto ??= initSqlJs({ locateFile: () => wasm }).then(async (SQL) => {
    globalThis.__SQLJS__ = SQL;
    const db = abrirBanco();
    await semear(db, { adminEmail: "admin@ginga.local", adminSenha: "admin-local-123" });
    const app = Router();
    app.get("/api/health", (_req, res) => res.json({ ok: true }));
    app.use("/api/users", usuarios({ db, config }));
    const rotasProdutos = produtos({ db, config });
    app.use("/api/products", rotasProdutos);
    app.use("/api/admin", admin({ db, config, produtos: rotasProdutos }));
    app.use("/api", loja({ db, config }));
    app.use("/api/cart", carrinho({ db, config }));
    app.use("/api/orders", pedidos({ db, config }));
    return app;
  });
  return pronto;
}

export async function chamar(caminho, { method = "GET", corpo, headers = {} } = {}) {
  const app = await iniciar();
  const { ErroApi } = await import("../lib/api.js");
  const [rota, qs = ""] = caminho.split("?");
  const cab = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  const req = { method, url: `/api${rota}`, query: Object.fromEntries(new URLSearchParams(qs)), body: corpo ?? {}, params: {}, get: (h) => cab[h.toLowerCase()] };
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200, enviado: false,
      status(c) { this.statusCode = c; return this; },
      set() { return this; }, type() { return this; },
      json(b) { this.enviado = true; resolve({ status: this.statusCode, corpo: b }); },
      send(b) { this.enviado = true; resolve({ status: this.statusCode, corpo: b }); },
      end() { this.enviado = true; resolve({ status: this.statusCode, corpo: null }); },
    };
    app(req, res, (erro) => {
      if (!erro) return reject(new ErroApi(404, "Rota não encontrada."));
      if (erro instanceof HttpError) return reject(new ErroApi(erro.status, erro.message));
      console.error(erro);
      return reject(new ErroApi(500, "Erro interno. Tente novamente."));
    });
  }).then((r) => (r.status === 204 ? null : r.corpo));
}
