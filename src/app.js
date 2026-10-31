const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("node:path");
const fs = require("node:fs");
const { HttpError } = require("./errors");

/** Monta a aplicação a partir das dependências (banco e config), o que permite testar sem subir servidor */
function criarApp({ db, config }) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // atrás do proxy do Render/Vercel, o IP real vem em X-Forwarded-For
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: config.origens.length ? config.origens : true }));
  app.use(express.json({ limit: "20kb" }));

  // limite só nas rotas de autenticação (força bruta de senha); desligado nos testes
  if (config.limitarAutenticacao) {
    app.use("/api/users", rateLimit({ windowMs: 15 * 60_000, limit: 60, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Muitas tentativas. Tente de novo em alguns minutos." } }));
  }

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/users", require("./routes/usuarios")({ db, config }));
  app.use("/api/products", require("./routes/produtos")({ db, config }));
  app.use("/api/cart", require("./routes/carrinho")({ db, config }));
  app.use("/api/orders", require("./routes/pedidos")({ db, config }));
  app.use("/api", (_req, _res, next) => next(new HttpError(404, "Rota não encontrada.")));

  // em produção o mesmo servidor entrega o front já compilado
  const dist = path.join(__dirname, "..", "Client", "dist");
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((erro, _req, res, _next) => {
    if (erro instanceof HttpError) return res.status(erro.status).json({ error: erro.message });
    if (erro.type === "entity.parse.failed") return res.status(400).json({ error: "JSON inválido." });
    if (erro.type === "entity.too.large") return res.status(413).json({ error: "Requisição grande demais." });
    console.error(erro);
    res.status(500).json({ error: "Erro interno. Tente novamente." });
  });
  return app;
}

module.exports = { criarApp };
