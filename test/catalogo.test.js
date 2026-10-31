const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { montar } = require("./ajuda");
const { DESENHOS } = require("../src/validar");
const { CATALOGO } = require("../scripts/seed");

let t;
beforeEach(async () => { t = await montar(); });

test("catálogo é público, com estoque por tamanho, categorias e nota", async () => {
  const r = await t.api.get("/api/products");
  assert.equal(r.status, 200);
  assert.equal(r.body.length, 11);
  const ginga = r.body.find((p) => p.name === "Ginga");
  assert.equal(ginga.priceCents, 11990);
  assert.equal(ginga.stock.M, 12);
  assert.deepEqual(ginga.rating, { avg: null, count: 0 });
  assert.deepEqual([...new Set(r.body.map((p) => p.category))].sort(), ["festa", "futebol", "praia", "raiz"]);
  assert.equal((await t.api.get("/api/products/abc")).status, 404);
  assert.equal((await t.api.get("/api/products/9999")).status, 404);
});

test("toda estampa do catálogo existe na lista que o front sabe desenhar", () => {
  for (const p of CATALOGO) assert.ok(DESENHOS.includes(p.design), `${p.name}: estampa "${p.design}" desconhecida`);
});

test("só administrador cria, edita e remove produtos", async () => {
  const { auth } = await t.cadastrar();
  const novo = { name: "Teste", description: "Blusa de teste", price: 50, color: "#112233", design: "lisa", cut: "regata", category: "praia", stock: { M: 2 } };
  assert.equal((await t.api.post("/api/products").set(auth).send(novo)).status, 403);

  const admin = await t.loginAdmin();
  const criado = await t.api.post("/api/products").set(admin).send(novo);
  assert.equal(criado.status, 201);
  assert.equal(criado.body.priceCents, 5000);
  assert.equal(criado.body.cut, "regata");
  assert.deepEqual(criado.body.stock, { M: 2 });

  const editado = await t.api.patch(`/api/products/${criado.body.id}`).set(admin).send({ price: 60, stock: { G: 7 }, category: "festa" });
  assert.equal(editado.body.priceCents, 6000);
  assert.equal(editado.body.category, "festa");
  assert.deepEqual(editado.body.stock, { M: 2, G: 7 });

  assert.equal((await t.api.post("/api/products").set(admin).send({ ...novo, design: "xyz" })).status, 400);
  assert.equal((await t.api.post("/api/products").set(admin).send({ ...novo, category: "sapato" })).status, 400);
  assert.equal((await t.api.post("/api/products").set(admin).send({ ...novo, cut: "calça" })).status, 400);
  assert.equal((await t.api.delete(`/api/products/${criado.body.id}`).set(admin)).status, 204);
  assert.equal((await t.api.get(`/api/products/${criado.body.id}`)).status, 404);
});

test("avaliações: só quem comprou avalia, uma por pessoa, e a nota entra na média", async () => {
  const ana = await t.cadastrar("ana@exemplo.com", "Ana Souza");
  const bia = await t.cadastrar("bia@exemplo.com", "Bia Lima");
  const p = t.produto("Saudade");

  assert.equal((await t.api.post(`/api/products/${p.id}/reviews`).set(ana.auth).send({ rating: 5, body: "Linda demais" })).status, 403, "sem compra não avalia");
  await t.naSacola(ana.auth, "Saudade", "M");
  await t.fechar(ana.auth);
  assert.equal((await t.api.post(`/api/products/${p.id}/reviews`).set(ana.auth).send({ rating: 6, body: "Linda demais" })).status, 400);
  assert.equal((await t.api.post(`/api/products/${p.id}/reviews`).set(ana.auth).send({ rating: 5, body: "Linda demais" })).status, 201);
  // reescrever não cria duplicata
  await t.api.post(`/api/products/${p.id}/reviews`).set(ana.auth).send({ rating: 4, body: "Linda, mas encolheu um pouco" });
  assert.equal((await t.api.post(`/api/products/${p.id}/reviews`).set(bia.auth).send({ rating: 5, body: "Quero uma" })).status, 403);

  const lista = await t.api.get(`/api/products/${p.id}/reviews`);
  assert.equal(lista.body.length, 1);
  assert.equal(lista.body[0].author, "Ana", "só o primeiro nome aparece");
  assert.equal(lista.body[0].rating, 4);
  assert.deepEqual((await t.api.get(`/api/products/${p.id}`)).body.rating, { avg: 4, count: 1 });
});

test("pedido cancelado não dá direito a avaliar", async () => {
  const ana = await t.cadastrar();
  await t.naSacola(ana.auth, "Saudade", "M");
  const pedido = await t.fechar(ana.auth);
  await t.api.post(`/api/orders/${pedido.body.id}/cancel`).set(ana.auth);
  const r = await t.api.post(`/api/products/${t.produto("Saudade").id}/reviews`).set(ana.auth).send({ rating: 5, body: "Nunca recebi" });
  assert.equal(r.status, 403);
});
