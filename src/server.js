const fs = require("node:fs");
const path = require("node:path");
const { lerConfig } = require("./config");
const { abrirBanco } = require("./db");
const { criarApp } = require("./app");
const { semear } = require("../scripts/seed");

const config = lerConfig();
fs.mkdirSync(path.dirname(config.banco), { recursive: true });
const db = abrirBanco(config.banco);
// primeira execução: banco vazio ganha o catálogo de exemplo para a loja não abrir sem nada
(async () => {
  if (!db.prepare("SELECT 1 FROM products LIMIT 1").get()) await semear(db, { adminEmail: process.env.ADMIN_EMAIL, adminSenha: process.env.ADMIN_PASSWORD });
  criarApp({ db, config }).listen(config.porta, () => console.log(`Loja rodando em http://localhost:${config.porta}`));
})();
