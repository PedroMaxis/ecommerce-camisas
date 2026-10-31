// Rotas públicas e de apoio: frete, cupom, favoritos, contato e newsletter
const { Router } = require("express");
const { HttpError } = require("../errors");
const v = require("../validar");
const { autenticar } = require("../auth");
const { opcoesFrete, avaliarCupom } = require("../checkout");

module.exports = function rotasLoja({ db, config }) {
  const r = Router();
  const auth = autenticar({ db, segredo: config.segredo });

  /* frete por CEP: GET /shipping?cep=30130-010&subtotal=12000&coupon=FRETEBRASIL */
  r.get("/shipping", (req, res) => {
    const cep = v.cep(req.query.cep);
    const subtotal = v.inteiro(req.query.subtotal ?? "0", { campo: "subtotal", min: 0 });
    const cupom = req.query.coupon ? db.prepare("SELECT * FROM coupons WHERE code = ?").get(String(req.query.coupon)) : null;
    const freteGratisCupom = !!(cupom && avaliarCupom(cupom, subtotal).ok && cupom.free_shipping);
    res.json(opcoesFrete(cep, subtotal, { freteGratisCupom }));
  });

  r.get("/coupons/:code", (req, res) => {
    const subtotal = v.inteiro(req.query.subtotal ?? "0", { campo: "subtotal", min: 0 });
    const cupom = db.prepare("SELECT * FROM coupons WHERE code = ?").get(String(req.params.code).slice(0, 40));
    const a = avaliarCupom(cupom, subtotal);
    if (!a.ok) throw new HttpError(404, a.motivo);
    res.json({ code: cupom.code.toUpperCase(), percent: cupom.percent, freeShipping: !!cupom.free_shipping, description: cupom.description });
  });

  /* favoritos */
  r.get("/favorites", auth, (req, res) => {
    res.json(db.prepare("SELECT product_id AS productId FROM favorites f JOIN products p ON p.id = f.product_id WHERE f.user_id = ? AND p.active = 1 ORDER BY f.created_at DESC").all(req.usuario.id).map((l) => l.productId));
  });
  r.put("/favorites/:productId", auth, (req, res) => {
    const id = v.idDaRota(req.params.productId);
    if (!db.prepare("SELECT 1 FROM products WHERE id = ? AND active = 1").get(id)) throw new HttpError(404, "Produto não encontrado.");
    db.prepare("INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)").run(req.usuario.id, id);
    res.status(204).end();
  });
  r.delete("/favorites/:productId", auth, (req, res) => {
    db.prepare("DELETE FROM favorites WHERE user_id = ? AND product_id = ?").run(req.usuario.id, v.idDaRota(req.params.productId));
    res.status(204).end();
  });

  /* contato e newsletter (públicos) */
  r.post("/contact", (req, res) => {
    const dados = {
      name: v.texto(req.body?.name, { campo: "nome", min: 2, max: 80 }),
      email: v.email(req.body?.email),
      subject: v.texto(req.body?.subject, { campo: "assunto", min: 3, max: 120 }),
      body: v.texto(req.body?.body, { campo: "mensagem", min: 10, max: 2000 }),
    };
    db.prepare("INSERT INTO messages (name, email, subject, body) VALUES (?, ?, ?, ?)").run(dados.name, dados.email, dados.subject, dados.body);
    res.status(201).json({ ok: true });
  });
  r.post("/newsletter", (req, res) => {
    const email = v.email(req.body?.email);
    const { changes } = db.prepare("INSERT OR IGNORE INTO subscribers (email) VALUES (?)").run(email);
    res.status(changes ? 201 : 200).json({ ok: true, novo: changes > 0 });
  });
  return r;
};
