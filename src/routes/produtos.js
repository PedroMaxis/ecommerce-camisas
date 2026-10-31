const { Router } = require("express");
const { assincrono, HttpError } = require("../errors");
const v = require("../validar");
const { autenticar, exigirAdmin } = require("../auth");
const { transacao } = require("../db");

const paraApi = (p, estoque) => ({
  id: p.id, name: p.name, description: p.description, price: p.price_cents / 100, priceCents: p.price_cents,
  color: p.color, design: p.design, stock: estoque,
});

module.exports = function rotasProdutos({ db, config }) {
  const r = Router();
  const auth = autenticar({ db, segredo: config.segredo });
  const estoqueDe = (id) => Object.fromEntries(db.prepare("SELECT size, quantity FROM stock WHERE product_id = ? ORDER BY rowid").all(id).map((l) => [l.size, l.quantity]));

  const ler = (corpo, parcial = false) => {
    const campos = {};
    const pega = (chave, fn) => { if (!parcial || corpo?.[chave] !== undefined) campos[chave] = fn(corpo?.[chave]); };
    pega("name", (x) => v.texto(x, { campo: "nome", min: 2, max: 80 }));
    pega("description", (x) => v.texto(x, { campo: "descrição", min: 2, max: 600 }));
    pega("color", v.cor);
    pega("design", v.desenho);
    if (!parcial || corpo?.priceCents !== undefined || corpo?.price !== undefined) {
      campos.price_cents = corpo?.priceCents !== undefined ? v.inteiro(corpo.priceCents, { campo: "priceCents", min: 100, max: 10_000_00 }) : Math.round(Number(corpo?.price) * 100);
      v.inteiro(campos.price_cents, { campo: "preço", min: 100, max: 10_000_00 });
    }
    return campos;
  };
  const lerEstoque = (obj) => {
    if (typeof obj !== "object" || obj === null) throw new HttpError(400, 'Informe o estoque por tamanho, ex.: {"M": 5}.');
    return Object.entries(obj).map(([tam, q]) => [v.tamanho(tam), v.inteiro(q, { campo: `estoque ${tam}`, min: 0, max: 10_000 })]);
  };

  r.get("/", (_req, res) => {
    const linhas = db.prepare("SELECT * FROM products WHERE active = 1 ORDER BY id").all();
    res.json(linhas.map((p) => paraApi(p, estoqueDe(p.id))));
  });

  r.get("/:id", (req, res) => {
    const id = v.idDaRota(req.params.id);
    const p = db.prepare("SELECT * FROM products WHERE id = ? AND active = 1").get(id);
    if (!p) throw new HttpError(404, "Produto não encontrado.");
    res.json(paraApi(p, estoqueDe(id)));
  });

  r.post("/", auth, exigirAdmin, assincrono(async (req, res) => {
    const c = ler(req.body);
    const estoque = lerEstoque(req.body?.stock ?? {});
    const id = transacao(db, () => {
      const { lastInsertRowid } = db.prepare("INSERT INTO products (name, description, price_cents, color, design) VALUES (?, ?, ?, ?, ?)").run(c.name, c.description, c.price_cents, c.color, c.design);
      const ins = db.prepare("INSERT INTO stock (product_id, size, quantity) VALUES (?, ?, ?)");
      for (const [t, q] of estoque) ins.run(Number(lastInsertRowid), t, q);
      return Number(lastInsertRowid);
    });
    res.status(201).json(paraApi(db.prepare("SELECT * FROM products WHERE id = ?").get(id), estoqueDe(id)));
  }));

  r.patch("/:id", auth, exigirAdmin, assincrono(async (req, res) => {
    const id = v.idDaRota(req.params.id);
    if (!db.prepare("SELECT 1 FROM products WHERE id = ? AND active = 1").get(id)) throw new HttpError(404, "Produto não encontrado.");
    const c = ler(req.body, true);
    const estoque = req.body?.stock !== undefined ? lerEstoque(req.body.stock) : [];
    transacao(db, () => {
      for (const [k, val] of Object.entries(c)) db.prepare(`UPDATE products SET ${k} = ? WHERE id = ?`).run(val, id); // chaves vêm de `ler`, nunca do cliente
      for (const [t, q] of estoque) db.prepare("INSERT INTO stock (product_id, size, quantity) VALUES (?, ?, ?) ON CONFLICT (product_id, size) DO UPDATE SET quantity = excluded.quantity").run(id, t, q);
    });
    res.json(paraApi(db.prepare("SELECT * FROM products WHERE id = ?").get(id), estoqueDe(id)));
  }));

  // "excluir" só desativa: pedidos antigos continuam apontando para o produto
  r.delete("/:id", auth, exigirAdmin, (req, res) => {
    const id = v.idDaRota(req.params.id);
    const { changes } = db.prepare("UPDATE products SET active = 0 WHERE id = ? AND active = 1").run(id);
    if (!changes) throw new HttpError(404, "Produto não encontrado.");
    db.prepare("DELETE FROM cart_items WHERE product_id = ?").run(id);
    res.status(204).end();
  });
  return r;
};
