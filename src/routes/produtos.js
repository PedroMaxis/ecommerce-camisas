const { Router } = require("express");
const { assincrono, HttpError } = require("../errors");
const v = require("../validar");
const { autenticar, exigirAdmin } = require("../auth");
const { transacao } = require("../db");

module.exports = function rotasProdutos({ db, config }) {
  const r = Router();
  const auth = autenticar({ db, segredo: config.segredo });

  const estoqueDe = (id) => Object.fromEntries(db.prepare("SELECT size, quantity FROM stock WHERE product_id = ? ORDER BY rowid").all(id).map((l) => [l.size, l.quantity]));
  const notaDe = (id) => {
    const n = db.prepare("SELECT COUNT(*) AS count, AVG(rating) AS avg FROM reviews WHERE product_id = ?").get(id);
    return { avg: n.count ? Math.round(n.avg * 10) / 10 : null, count: n.count };
  };
  const paraApi = (p) => ({
    id: p.id, name: p.name, description: p.description, story: p.story, price: p.price_cents / 100, priceCents: p.price_cents,
    color: p.color, design: p.design, cut: p.cut, category: p.category, active: !!p.active, stock: estoqueDe(p.id), rating: notaDe(p.id),
  });

  const ler = (corpo, parcial = false) => {
    const campos = {};
    const pega = (chave, fn) => { if (!parcial || corpo?.[chave] !== undefined) campos[chave] = fn(corpo?.[chave]); };
    pega("name", (x) => v.texto(x, { campo: "nome", min: 2, max: 80 }));
    pega("description", (x) => v.texto(x, { campo: "descrição", min: 2, max: 600 }));
    pega("color", v.cor);
    pega("design", v.desenho);
    if (corpo?.cut !== undefined || !parcial) campos.cut = corpo?.cut === undefined ? "camiseta" : v.corte(corpo.cut);
    if (corpo?.category !== undefined || !parcial) campos.category = corpo?.category === undefined ? "raiz" : v.categoria(corpo.category);
    if (corpo?.story !== undefined) campos.story = v.texto(corpo.story, { campo: "história", min: 0, max: 400 });
    if (!parcial || corpo?.priceCents !== undefined || corpo?.price !== undefined) {
      campos.price_cents = corpo?.priceCents !== undefined ? corpo.priceCents : Math.round(Number(corpo?.price) * 100);
      v.inteiro(campos.price_cents, { campo: "preço", min: 100, max: 10_000_00 });
    }
    return campos;
  };
  const lerEstoque = (obj) => {
    if (typeof obj !== "object" || obj === null) throw new HttpError(400, 'Informe o estoque por tamanho, ex.: {"M": 5}.');
    return Object.entries(obj).map(([tam, q]) => [v.tamanho(tam), v.inteiro(q, { campo: `estoque ${tam}`, min: 0, max: 10_000 })]);
  };

  r.get("/", (_req, res) => {
    res.json(db.prepare("SELECT * FROM products WHERE active = 1 ORDER BY id").all().map(paraApi));
  });

  r.get("/:id", (req, res) => {
    const id = v.idDaRota(req.params.id);
    const p = db.prepare("SELECT * FROM products WHERE id = ? AND active = 1").get(id);
    if (!p) throw new HttpError(404, "Produto não encontrado.");
    res.json(paraApi(p));
  });

  /* ---------- avaliações ---------- */
  r.get("/:id/reviews", (req, res) => {
    const id = v.idDaRota(req.params.id);
    res.json(db.prepare(`
      SELECT r.id, r.rating, r.body, r.created_at AS createdAt, u.name AS author
      FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.product_id = ? ORDER BY r.id DESC`).all(id)
      .map((x) => ({ ...x, author: x.author.split(" ")[0] }))); // só o primeiro nome é público
  });

  // só quem comprou (e não cancelou) avalia; uma avaliação por pessoa, que pode ser reescrita
  r.post("/:id/reviews", auth, (req, res) => {
    const id = v.idDaRota(req.params.id);
    if (!db.prepare("SELECT 1 FROM products WHERE id = ?").get(id)) throw new HttpError(404, "Produto não encontrado.");
    const rating = v.inteiro(req.body?.rating, { campo: "nota", min: 1, max: 5 });
    const body = v.texto(req.body?.body, { campo: "comentário", min: 3, max: 600 });
    const comprou = db.prepare(`SELECT 1 FROM order_items i JOIN orders o ON o.id = i.order_id
      WHERE o.user_id = ? AND i.product_id = ? AND o.status != 'cancelled' LIMIT 1`).get(req.usuario.id, id);
    if (!comprou) throw new HttpError(403, "Só quem comprou esta blusa pode avaliar.");
    db.prepare("INSERT INTO reviews (product_id, user_id, rating, body) VALUES (?, ?, ?, ?) ON CONFLICT (product_id, user_id) DO UPDATE SET rating = excluded.rating, body = excluded.body")
      .run(id, req.usuario.id, rating, body);
    res.status(201).json({ rating: notaDe(id) });
  });

  /* ---------- administração ---------- */
  r.post("/", auth, exigirAdmin, assincrono(async (req, res) => {
    const c = ler(req.body);
    const estoque = lerEstoque(req.body?.stock ?? {});
    const id = transacao(db, () => {
      const { lastInsertRowid } = db.prepare("INSERT INTO products (name, description, price_cents, color, design, cut, category, story) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(c.name, c.description, c.price_cents, c.color, c.design, c.cut, c.category, c.story ?? "");
      const ins = db.prepare("INSERT INTO stock (product_id, size, quantity) VALUES (?, ?, ?)");
      for (const [t, q] of estoque) ins.run(Number(lastInsertRowid), t, q);
      return Number(lastInsertRowid);
    });
    res.status(201).json(paraApi(db.prepare("SELECT * FROM products WHERE id = ?").get(id)));
  }));

  r.patch("/:id", auth, exigirAdmin, assincrono(async (req, res) => {
    const id = v.idDaRota(req.params.id);
    if (!db.prepare("SELECT 1 FROM products WHERE id = ?").get(id)) throw new HttpError(404, "Produto não encontrado.");
    const c = ler(req.body, true);
    const estoque = req.body?.stock !== undefined ? lerEstoque(req.body.stock) : [];
    if (req.body?.active !== undefined) c.active = req.body.active ? 1 : 0;
    transacao(db, () => {
      for (const [k, val] of Object.entries(c)) db.prepare(`UPDATE products SET ${k} = ? WHERE id = ?`).run(val, id); // chaves vêm de `ler`, nunca do cliente
      for (const [t, q] of estoque) db.prepare("INSERT INTO stock (product_id, size, quantity) VALUES (?, ?, ?) ON CONFLICT (product_id, size) DO UPDATE SET quantity = excluded.quantity").run(id, t, q);
    });
    res.json(paraApi(db.prepare("SELECT * FROM products WHERE id = ?").get(id)));
  }));

  // "excluir" só desativa: pedidos antigos continuam apontando para o produto
  r.delete("/:id", auth, exigirAdmin, (req, res) => {
    const id = v.idDaRota(req.params.id);
    const { changes } = db.prepare("UPDATE products SET active = 0 WHERE id = ? AND active = 1").run(id);
    if (!changes) throw new HttpError(404, "Produto não encontrado.");
    db.prepare("DELETE FROM cart_items WHERE product_id = ?").run(id);
    res.status(204).end();
  });

  r.paraApi = paraApi;
  return r;
};
