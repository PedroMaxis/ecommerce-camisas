const { DatabaseSync } = require("node:sqlite");
const ESQUEMA = require("./esquema");

/** Abre o banco (SQLite embutido no Node: nada para compilar) e garante o esquema. Dinheiro sempre em centavos inteiros. */
function abrirBanco(arquivo = ":memory:") {
  const db = new DatabaseSync(arquivo);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(ESQUEMA);
  return db;
}

/** Executa `fn` numa transação: tudo acontece ou nada acontece */
function transacao(db, fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const resultado = fn();
    db.exec("COMMIT");
    return resultado;
  } catch (erro) {
    db.exec("ROLLBACK");
    throw erro;
  }
}

module.exports = { abrirBanco, transacao };
