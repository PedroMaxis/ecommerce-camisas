const { Router } = require("express");
const { HttpError } = require("../errors");
const v = require("../validar");
const { autenticar } = require("../auth");

module.exports = function rotasCarrinho({ db, config }) {
  const r = Router();
  r.use(autenticar({ db, segredo: config.segredo }));

  const montar = (userId) => {
    const itens = db.prepare(`
      SELECT c.product_id AS productId, c.size, c.quantity, p.name, p.color, p.design, p.cut, p.price_cents AS unitPriceCents,
             COALESCE(s.quantity, 0) AS available
      FROM cart_items c JOIN products p ON p.id = c.product_id
      LEFT JOIN stock s ON s.product_id = c.product_id AND s.size = c.size
      WHERE c.user_id = ? AND p.active = 1 ORDER BY c.rowid`).all(userId);
    const items = itens.map((i) => ({ ...i, lineTotalCents: i.unitPriceCents * i.quantity }));
    return { items, totalCents: items.reduce((s, i) => s + i.lineTotalCents, 0), count: items.reduce((s, i) => s + i.quantity, 0) };
  };

  const dadosItem = (corpo) => ({
    productId: v.inteiro(corpo?.productId, { campo: "productId", min: 1 }),
    size: v.tamanho(corpo?.size),
  });
  const conferirProduto = (productId, size) => {
    if (!db.prepare("SELECT 1 FROM products WHERE id = ? AND active = 1").get(productId)) throw new HttpError(404, "Produto não encontrado.");
    return db.prepare("SELECT quantity FROM stock WHERE product_id = ? AND size = ?").get(productId, size)?.quantity ?? 0;
  };

  r.get("/", (req, res) => res.json(montar(req.usuario.id)));

  // soma ao que já existe, respeitando o estoque
  r.post("/items", (req, res) => {
    const { productId, size } = dadosItem(req.body);
    const quantidade = v.inteiro(req.body?.quantity ?? 1, { campo: "quantidade", min: 1, max: 20 });
    const disponivel = conferirProduto(productId, size);
    const atual = db.prepare("SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ?").get(req.usuario.id, productId, size)?.quantity ?? 0;
    if (atual + quantidade > disponivel) throw new HttpError(409, disponivel ? `Só restam ${disponivel} unidades no tamanho ${size}.` : `Tamanho ${size} esgotado.`);
    db.prepare("INSERT INTO cart_items (user_id, product_id, size, quantity) VALUES (?, ?, ?, ?) ON CONFLICT (user_id, product_id, size) DO UPDATE SET quantity = quantity + excluded.quantity")
      .run(req.usuario.id, productId, size, quantidade);
    res.status(201).json(montar(req.usuario.id));
  });

  // define a quantidade exata (0 remove)
  r.put("/items", (req, res) => {
    const { productId, size } = dadosItem(req.body);
    const quantidade = v.inteiro(req.body?.quantity, { campo: "quantidade", min: 0, max: 20 });
    if (quantidade === 0) {
      db.prepare("DELETE FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ?").run(req.usuario.id, productId, size);
    } else {
      const disponivel = conferirProduto(productId, size);
      if (quantidade > disponivel) throw new HttpError(409, disponivel ? `Só restam ${disponivel} unidades no tamanho ${size}.` : `Tamanho ${size} esgotado.`);
      db.prepare("INSERT INTO cart_items (user_id, product_id, size, quantity) VALUES (?, ?, ?, ?) ON CONFLICT (user_id, product_id, size) DO UPDATE SET quantity = excluded.quantity")
        .run(req.usuario.id, productId, size, quantidade);
    }
    res.json(montar(req.usuario.id));
  });

  r.delete("/", (req, res) => {
    db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(req.usuario.id);
    res.json(montar(req.usuario.id));
  });
  return r;
};
