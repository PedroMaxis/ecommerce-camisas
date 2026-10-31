const { DatabaseSync } = require("node:sqlite");

/** Abre o banco (SQLite embutido no Node: nada para compilar) e garante o esquema. Dinheiro sempre em centavos inteiros. */
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
      color       TEXT NOT NULL DEFAULT '#f6efe0',   -- cor do tecido
      design      TEXT NOT NULL DEFAULT 'lisa',      -- qual estampa o front desenha
      cut         TEXT NOT NULL DEFAULT 'camiseta' CHECK (cut IN ('camiseta', 'babylook', 'regata', 'futebol', 'oversized')),
      category    TEXT NOT NULL DEFAULT 'raiz' CHECK (category IN ('futebol', 'praia', 'festa', 'raiz')),
      story       TEXT NOT NULL DEFAULT '',          -- de onde veio a estampa
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

    CREATE TABLE IF NOT EXISTS favorites (
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      PRIMARY KEY (user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      body       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      UNIQUE (product_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      code          TEXT PRIMARY KEY COLLATE NOCASE,
      percent       INTEGER NOT NULL DEFAULT 0 CHECK (percent BETWEEN 0 AND 90),
      free_shipping INTEGER NOT NULL DEFAULT 0,
      min_cents     INTEGER NOT NULL DEFAULT 0,
      active        INTEGER NOT NULL DEFAULT 1,
      description   TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS orders (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id            INTEGER NOT NULL REFERENCES users(id),
      status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
      subtotal_cents     INTEGER NOT NULL,
      discount_cents     INTEGER NOT NULL DEFAULT 0,   -- cupom
      pix_discount_cents INTEGER NOT NULL DEFAULT 0,
      shipping_cents     INTEGER NOT NULL DEFAULT 0,
      shipping_method    TEXT NOT NULL DEFAULT 'economico',
      total_cents        INTEGER NOT NULL,
      coupon             TEXT,
      payment_method     TEXT NOT NULL DEFAULT 'pix' CHECK (payment_method IN ('pix', 'cartao', 'boleto')),
      ship_name          TEXT NOT NULL DEFAULT '',
      ship_cep           TEXT NOT NULL DEFAULT '',
      ship_street        TEXT NOT NULL DEFAULT '',
      ship_number        TEXT NOT NULL DEFAULT '',
      ship_complement    TEXT NOT NULL DEFAULT '',
      ship_district      TEXT NOT NULL DEFAULT '',
      ship_city          TEXT NOT NULL DEFAULT '',
      ship_state         TEXT NOT NULL DEFAULT '',
      created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      paid_at            TEXT,
      shipped_at         TEXT,
      delivered_at       TEXT
    );

    -- foto do que foi comprado: nome e preço ficam gravados mesmo que o produto mude depois
    CREATE TABLE IF NOT EXISTS order_items (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id       INTEGER NOT NULL,
      name             TEXT NOT NULL,
      color            TEXT NOT NULL,
      design           TEXT NOT NULL,
      cut              TEXT NOT NULL DEFAULT 'camiseta',
      size             TEXT NOT NULL,
      unit_price_cents INTEGER NOT NULL,
      quantity         INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      subject    TEXT NOT NULL,
      body       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      email      TEXT PRIMARY KEY COLLATE NOCASE,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id, id DESC);
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews (product_id);
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
