const { Router } = require("express");
const { HttpError } = require("../errors");
const v = require("../validar");
const { autenticar } = require("../auth");
const { transacao } = require("../db");

module.exports = function rotasPedidos({ db, config }) {
  const r = Router();
  r.use(autenticar({ db, segredo: config.segredo }));

  const comItens = (o) => ({
    id: o.id, status: o.status, totalCents: o.total_cents, createdAt: o.created_at,
    items: db.prepare("SELECT product_id AS productId, name, color, design, size, unit_price_cents AS unitPriceCents, quantity FROM order_items WHERE order_id = ? ORDER BY id").all(o.id),
  });

  r.get("/", (req, res) => {
    res.json(db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC").all(req.usuario.id).map(comItens));
  });

  r.get("/:id", (req, res) => {
    const o = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(v.idDaRota(req.params.id), req.usuario.id);
    if (!o) throw new HttpError(404, "Pedido não encontrado.");
    res.json(comItens(o));
  });

  // Fecha o carrinho: confere e baixa o estoque, grava o pedido e esvazia o carrinho numa única transação.
  // Preços vêm sempre do banco, nunca do cliente.
  r.post("/", (req, res) => {
    const pedido = transacao(db, () => {
      const itens = db.prepare(`
        SELECT c.product_id, c.size, c.quantity, p.name, p.color, p.design, p.price_cents
        FROM cart_items c JOIN products p ON p.id = c.product_id AND p.active = 1
        WHERE c.user_id = ? ORDER BY c.rowid`).all(req.usuario.id);
      if (!itens.length) throw new HttpError(400, "Seu carrinho está vazio.");

      const baixa = db.prepare("UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND size = ? AND quantity >= ?");
      for (const i of itens) {
        if (!baixa.run(i.quantity, i.product_id, i.size, i.quantity).changes) throw new HttpError(409, `"${i.name}" (${i.size}) não tem mais estoque suficiente.`);
      }
      const total = itens.reduce((s, i) => s + i.price_cents * i.quantity, 0);
      const { lastInsertRowid } = db.prepare("INSERT INTO orders (user_id, total_cents) VALUES (?, ?)").run(req.usuario.id, total);
      const orderId = Number(lastInsertRowid);
      const ins = db.prepare("INSERT INTO order_items (order_id, product_id, name, color, design, size, unit_price_cents, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      for (const i of itens) ins.run(orderId, i.product_id, i.name, i.color, i.design, i.size, i.price_cents, i.quantity);
      db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(req.usuario.id);
      return db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
    });
    res.status(201).json(comItens(pedido));
  });
  return r;
};
