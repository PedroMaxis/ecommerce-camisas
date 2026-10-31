const { DatabaseSync } = require("node:sqlite");

/** Abre o banco (SQLite embutido no Node: nada para compilar) e garante o esquema. Valores em dinheiro são centavos inteiros. */
function abrirBanco(arquivo = ":memory:") {
  const db = new DatabaseSync(arquivo);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
      created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT NOT NULL,
      price_cents INTEGER NOT NULL CHECK (price_cents > 0),
      color       TEXT NOT NULL DEFAULT '#1b1b1b',
      design      TEXT NOT NULL DEFAULT 'lisa',
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS stock (
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      size       TEXT    NOT NULL,
      quantity   INTEGER NOT NULL CHECK (quantity >= 0),
      PRIMARY KEY (product_id, size)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      size       TEXT    NOT NULL,
      quantity   INTEGER NOT NULL CHECK (quantity > 0),
      PRIMARY KEY (user_id, product_id, size)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
      total_cents INTEGER NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    -- foto do que foi comprado: nome e preço ficam gravados mesmo que o produto mude depois
    CREATE TABLE IF NOT EXISTS order_items (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id       INTEGER NOT NULL,
      name             TEXT NOT NULL,
      color            TEXT NOT NULL,
      design           TEXT NOT NULL,
      size             TEXT NOT NULL,
      unit_price_cents INTEGER NOT NULL,
      quantity         INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id, id DESC);
  `);
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
