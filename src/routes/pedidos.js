const { Router } = require("express");
const { HttpError } = require("../errors");
const v = require("../validar");
const { autenticar } = require("../auth");
const { transacao } = require("../db");
const { calcularTotais } = require("../checkout");
const { mudarStatus, pedidoParaApi } = require("../pedidos-servico");

module.exports = function rotasPedidos({ db, config }) {
  const r = Router();
  r.use(autenticar({ db, segredo: config.segredo }));

  const doUsuario = (req) => {
    const o = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(v.idDaRota(req.params.id), req.usuario.id);
    if (!o) throw new HttpError(404, "Pedido não encontrado.");
    return o;
  };

  const lerEndereco = (a) => ({
    name: v.texto(a?.name, { campo: "nome do destinatário", min: 2, max: 80 }),
    cep: v.cep(a?.cep),
    street: v.texto(a?.street, { campo: "rua", min: 2, max: 120 }),
    number: v.texto(String(a?.number ?? ""), { campo: "número", min: 1, max: 10 }),
    complement: a?.complement ? v.texto(a.complement, { campo: "complemento", min: 1, max: 60 }) : "",
    district: v.texto(a?.district, { campo: "bairro", min: 2, max: 80 }),
    city: v.texto(a?.city, { campo: "cidade", min: 2, max: 80 }),
    state: v.uf(a?.state),
  });

  /* Pré-visualiza os totais da sacola atual (cupom, PIX, frete) sem criar nada: o front nunca repete a regra de dinheiro. */
  r.post("/preview", (req, res) => {
    const b = req.body ?? {};
    const cep = v.cep(b.cep);
    const pagamento = v.pagamento(b.payment ?? "pix");
    const envio = v.envio(b.shipping ?? "economico");
    const codigo = b.coupon ? String(b.coupon).trim().slice(0, 40) : null;
    const cupom = codigo ? db.prepare("SELECT * FROM coupons WHERE code = ?").get(codigo) : null;
    if (codigo && !cupom) throw new HttpError(400, "Cupom inválido ou expirado.");
    const { subtotal } = db.prepare(`SELECT COALESCE(SUM(c.quantity * p.price_cents), 0) AS subtotal
      FROM cart_items c JOIN products p ON p.id = c.product_id AND p.active = 1 WHERE c.user_id = ?`).get(req.usuario.id);
    const t = calcularTotais({ subtotalCents: subtotal, cupom, pagamento, envio, cep });
    if (t.erro) throw new HttpError(400, t.erro);
    res.json(t);
  });

  r.get("/", (req, res) => {
    res.json(db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC").all(req.usuario.id).map((o) => pedidoParaApi(db, o)));
  });

  r.get("/:id", (req, res) => res.json(pedidoParaApi(db, doUsuario(req))));

  /* Fecha a sacola: confere e baixa o estoque, calcula os totais (preço, cupom, PIX, frete) só no servidor,
     grava o pedido e esvazia a sacola numa única transação. */
  r.post("/", (req, res) => {
    const b = req.body ?? {};
    const endereco = lerEndereco(b.address);
    const pagamento = v.pagamento(b.payment ?? "pix");
    const envio = v.envio(b.shipping ?? "economico");
    const codigo = b.coupon ? String(b.coupon).trim().slice(0, 40) : null;
    const cupom = codigo ? db.prepare("SELECT * FROM coupons WHERE code = ?").get(codigo) : null;
    if (codigo && !cupom) throw new HttpError(400, "Cupom inválido ou expirado.");

    const id = transacao(db, () => {
      const itens = db.prepare(`
        SELECT c.product_id, c.size, c.quantity, p.name, p.color, p.design, p.cut, p.price_cents
        FROM cart_items c JOIN products p ON p.id = c.product_id AND p.active = 1
        WHERE c.user_id = ? ORDER BY c.rowid`).all(req.usuario.id);
      if (!itens.length) throw new HttpError(400, "Sua sacola está vazia.");

      const baixa = db.prepare("UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND size = ? AND quantity >= ?");
      for (const i of itens) {
        if (!baixa.run(i.quantity, i.product_id, i.size, i.quantity).changes) throw new HttpError(409, `"${i.name}" (${i.size}) não tem mais estoque suficiente.`);
      }
      const subtotal = itens.reduce((s, i) => s + i.price_cents * i.quantity, 0);
      const t = calcularTotais({ subtotalCents: subtotal, cupom, pagamento, envio, cep: endereco.cep });
      if (t.erro) throw new HttpError(400, t.erro);

      const { lastInsertRowid } = db.prepare(`INSERT INTO orders
        (user_id, subtotal_cents, discount_cents, pix_discount_cents, shipping_cents, shipping_method, total_cents, coupon, payment_method,
         ship_name, ship_cep, ship_street, ship_number, ship_complement, ship_district, ship_city, ship_state)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        req.usuario.id, t.subtotalCents, t.discountCents, t.pixDiscountCents, t.shippingCents, envio, t.totalCents, cupom ? cupom.code.toUpperCase() : null, pagamento,
        endereco.name, endereco.cep, endereco.street, endereco.number, endereco.complement, endereco.district, endereco.city, endereco.state);
      const orderId = Number(lastInsertRowid);
      const ins = db.prepare("INSERT INTO order_items (order_id, product_id, name, color, design, cut, size, unit_price_cents, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
      for (const i of itens) ins.run(orderId, i.product_id, i.name, i.color, i.design, i.cut, i.size, i.price_cents, i.quantity);
      db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(req.usuario.id);
      return orderId;
    });
    res.status(201).json(pedidoParaApi(db, db.prepare("SELECT * FROM orders WHERE id = ?").get(id)));
  });

  // pagamento simulado: no mundo real isto viria de um webhook do gateway
  r.post("/:id/pay", (req, res) => {
    const o = doUsuario(req);
    res.json(pedidoParaApi(db, mudarStatus(db, o.id, "paid")));
  });

  r.post("/:id/cancel", (req, res) => {
    const o = doUsuario(req);
    if (o.status !== "pending") throw new HttpError(409, "Só dá para cancelar pedidos que ainda não foram pagos. Fale com a gente.");
    res.json(pedidoParaApi(db, mudarStatus(db, o.id, "cancelled")));
  });
  return r;
};
