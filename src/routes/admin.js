const { Router } = require("express");
const { HttpError } = require("../errors");
const v = require("../validar");
const { autenticar, exigirAdmin } = require("../auth");
const { mudarStatus, pedidoParaApi, FLUXO } = require("../pedidos-servico");

module.exports = function rotasAdmin({ db, config, produtos }) {
  const r = Router();
  r.use(autenticar({ db, segredo: config.segredo }), exigirAdmin);

  r.get("/summary", (_req, res) => {
    const faturado = db.prepare("SELECT COALESCE(SUM(total_cents), 0) AS n FROM orders WHERE status IN ('paid', 'shipped', 'delivered')").get().n;
    const porStatus = Object.fromEntries(db.prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status").all().map((l) => [l.status, l.n]));
    const baixo = db.prepare(`SELECT p.id, p.name, s.size, s.quantity FROM stock s JOIN products p ON p.id = s.product_id
      WHERE p.active = 1 AND s.quantity <= 2 ORDER BY s.quantity, p.name LIMIT 20`).all();
    res.json({
      revenueCents: faturado, ordersByStatus: porStatus, lowStock: baixo,
      customers: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'customer'").get().n,
      subscribers: db.prepare("SELECT COUNT(*) AS n FROM subscribers").get().n,
      messages: db.prepare("SELECT COUNT(*) AS n FROM messages").get().n,
    });
  });

  r.get("/orders", (_req, res) => {
    const linhas = db.prepare("SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.id DESC LIMIT 200").all();
    res.json(linhas.map((o) => ({ ...pedidoParaApi(db, o), customer: { name: o.customer_name, email: o.customer_email }, next: FLUXO[o.status] })));
  });

  r.patch("/orders/:id", (req, res) => {
    const status = req.body?.status;
    if (!Object.keys(FLUXO).includes(status)) throw new HttpError(400, "Status inválido.");
    res.json(pedidoParaApi(db, mudarStatus(db, v.idDaRota(req.params.id), status)));
  });

  r.get("/products", (_req, res) => {
    res.json(db.prepare("SELECT * FROM products ORDER BY id").all().map(produtos.paraApi));
  });

  r.get("/messages", (_req, res) => {
    res.json(db.prepare("SELECT id, name, email, subject, body, created_at AS createdAt FROM messages ORDER BY id DESC LIMIT 100").all());
  });
  return r;
};
