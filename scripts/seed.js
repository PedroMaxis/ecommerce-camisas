// Popula o banco em arquivo com o catálogo de demonstração (ver catalogo.js). Reexporta o catálogo para os testes.
const { abrirBanco } = require("../src/db");
const catalogo = require("./catalogo");

const { semear, CATALOGO, CUPONS } = catalogo;
module.exports = catalogo;

if (require.main === module) {
  const { lerConfig } = require("../src/config");
  const fs = require("node:fs");
  const path = require("node:path");
  const config = lerConfig();
  fs.mkdirSync(path.dirname(config.banco), { recursive: true });
  const db = abrirBanco(config.banco);
  const jaTem = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
  (async () => {
    if (!jaTem) await semear(db, { adminEmail: process.env.ADMIN_EMAIL, adminSenha: process.env.ADMIN_PASSWORD });
    console.log(jaTem ? "Catálogo já existe; nada a fazer." : `Catálogo criado (${CATALOGO.length} blusas e ${CUPONS.length} cupons).`);
  })();
}
