const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { abrirBanco } = require("../src/db");
const { criarApp } = require("../src/app");
const { semear } = require("../scripts/seed");

const config = { segredo: "segredo-de-teste-123456", validade: "1h", origens: [], limitarAutenticacao: false };
let db, api;

beforeEach(async () => {
  db = abrirBanco(":memory:");
  await semear(db, { adminEmail: "admin@loja.local", adminSenha: "senha-do-admin" });
  api = request(criarApp({ db, config }));
});

const cadastrar = async (email = "ana@exemplo.com") => {
  const r = await api.post("/api/users/register").send({ name: "Ana Souza", email, password: "12345678" });
  return { token: r.body.token, auth: { Authorization: `Bearer ${r.body.token}` }, res: r };
};
const login = async (email, password) => (await api.post("/api/users/login").send({ email, password })).body.token;
const produto = (nome) => db.prepare("SELECT * FROM products WHERE name = ?").get(nome);
const estoque = (id, tam) => db.prepare("SELECT quantity FROM stock WHERE product_id = ? AND size = ?").get(id, tam).quantity;

test("cadastro devolve token e nunca o hash da senha", async () => {
  const { res } = await cadastrar();
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.deepEqual(Object.keys(res.body.user).sort(), ["email", "id", "name", "role"]);
  assert.ok(!JSON.stringify(res.body).includes("password"));
});

test("cadastro valida campos e recusa e-mail repetido (sem diferenciar maiúsculas)", async () => {
  assert.equal((await api.post("/api/users/register").send({ name: "A", email: "x", password: "1" })).status, 400);
  assert.equal((await api.post("/api/users/register").send({ name: "Ana Souza", email: "ana@exemplo.com", password: "curta" })).status, 400);
  await cadastrar("ana@exemplo.com");
  assert.equal((await api.post("/api/users/register").send({ name: "Outra Ana", email: "ANA@exemplo.com", password: "12345678" })).status, 409);
});

test("login: senha errada e e-mail inexistente dão a mesma resposta", async () => {
  await cadastrar();
  const errada = await api.post("/api/users/login").send({ email: "ana@exemplo.com", password: "errada123" });
  const inexistente = await api.post("/api/users/login").send({ email: "ninguem@exemplo.com", password: "12345678" });
  assert.equal(errada.status, 401);
  assert.deepEqual(errada.body, inexistente.body);
  assert.ok(await login("ana@exemplo.com", "12345678"));
});

test("rotas protegidas: sem header não derrubam o servidor, token inválido é 401", async () => {
  assert.equal((await api.get("/api/cart")).status, 401);
  assert.equal((await api.get("/api/cart").set("Authorization", "Bearer lixo")).status, 401);
  assert.equal((await api.get("/api/orders").set("Authorization", "qualquer coisa")).status, 401);
});

test("catálogo é público e mostra estoque por tamanho", async () => {
  const r = await api.get("/api/products");
  assert.equal(r.status, 200);
  assert.equal(r.body.length, 8);
  const mare = r.body.find((p) => p.name === "Maré Alta");
  assert.equal(mare.priceCents, 8900);
  assert.equal(mare.price, 89);
  assert.equal(mare.stock.M, 12);
  assert.equal((await api.get("/api/products/abc")).status, 404);
  assert.equal((await api.get("/api/products/9999")).status, 404);
});

test("só administrador cria, edita e remove produtos", async () => {
  const { auth } = await cadastrar();
  const novo = { name: "Teste", description: "Camisa de teste", price: 50, color: "#112233", design: "lisa", stock: { M: 2 } };
  assert.equal((await api.post("/api/products").set(auth).send(novo)).status, 403);

  const admin = { Authorization: `Bearer ${await login("admin@loja.local", "senha-do-admin")}` };
  const criado = await api.post("/api/products").set(admin).send(novo);
  assert.equal(criado.status, 201);
  assert.equal(criado.body.priceCents, 5000);
  assert.deepEqual(criado.body.stock, { M: 2 });

  const editado = await api.patch(`/api/products/${criado.body.id}`).set(admin).send({ price: 60, stock: { G: 7 } });
  assert.equal(editado.body.priceCents, 6000);
  assert.deepEqual(editado.body.stock, { M: 2, G: 7 });

  assert.equal((await api.post("/api/products").set(admin).send({ ...novo, design: "xyz" })).status, 400);
  assert.equal((await api.delete(`/api/products/${criado.body.id}`).set(admin)).status, 204);
  assert.equal((await api.get(`/api/products/${criado.body.id}`)).status, 404);
});

test("carrinho: soma itens, ajusta quantidade exata e respeita o estoque", async () => {
  const { auth } = await cadastrar();
  const p = produto("Maré Alta");
  await api.post("/api/cart/items").set(auth).send({ productId: p.id, size: "M", quantity: 2 });
  let r = await api.post("/api/cart/items").set(auth).send({ productId: p.id, size: "M", quantity: "1" }); // texto numérico também vale
  assert.equal(r.body.items[0].quantity, 3);
  assert.equal(r.body.totalCents, 3 * 8900);
  assert.equal(r.body.count, 3);

  r = await api.put("/api/cart/items").set(auth).send({ productId: p.id, size: "M", quantity: 1 });
  assert.equal(r.body.items[0].quantity, 1);

  // PP da Maré Alta tem 3 unidades
  assert.equal((await api.post("/api/cart/items").set(auth).send({ productId: p.id, size: "PP", quantity: 4 })).status, 409);
  // quantidades absurdas ou negativas
  assert.equal((await api.post("/api/cart/items").set(auth).send({ productId: p.id, size: "M", quantity: -1 })).status, 400);
  assert.equal((await api.post("/api/cart/items").set(auth).send({ productId: p.id, size: "XG", quantity: 1 })).status, 400);

  r = await api.put("/api/cart/items").set(auth).send({ productId: p.id, size: "M", quantity: 0 });
  assert.deepEqual(r.body.items, []);
});

test("tamanho esgotado não entra no carrinho", async () => {
  const { auth } = await cadastrar();
  const r = await api.post("/api/cart/items").set(auth).send({ productId: produto("Pontinhos").id, size: "PP" });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /esgotado/i);
});

test("pedido: usa preços do banco, baixa estoque e esvazia o carrinho", async () => {
  const { auth } = await cadastrar();
  const a = produto("Maré Alta"), b = produto("Lisa Grafite");
  await api.post("/api/cart/items").set(auth).send({ productId: a.id, size: "M", quantity: 2 });
  await api.post("/api/cart/items").set(auth).send({ productId: b.id, size: "G", quantity: 1 });

  const r = await api.post("/api/orders").set(auth).send({ totalCents: 1 }); // o cliente não manda o preço
  assert.equal(r.status, 201);
  assert.equal(r.body.totalCents, 2 * 8900 + 6900);
  assert.equal(r.body.items.length, 2);
  assert.equal(r.body.status, "pending");
  assert.equal(estoque(a.id, "M"), 10);
  assert.equal(estoque(b.id, "G"), 14);
  assert.deepEqual((await api.get("/api/cart").set(auth)).body.items, []);

  const lista = await api.get("/api/orders").set(auth);
  assert.equal(lista.body.length, 1);
  assert.equal(lista.body[0].items[0].name, "Maré Alta");
});

test("pedido é tudo ou nada: se um item acabou, nada é baixado", async () => {
  const { auth } = await cadastrar();
  const a = produto("Maré Alta"), b = produto("Bom Dia");
  await api.post("/api/cart/items").set(auth).send({ productId: a.id, size: "M", quantity: 2 });
  await api.post("/api/cart/items").set(auth).send({ productId: b.id, size: "PP", quantity: 1 });
  db.prepare("UPDATE stock SET quantity = 0 WHERE product_id = ? AND size = 'PP'").run(b.id); // alguém comprou antes

  const r = await api.post("/api/orders").set(auth).send({});
  assert.equal(r.status, 409);
  assert.equal(estoque(a.id, "M"), 12, "estoque do primeiro item deve ter voltado");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM orders").get().n, 0);
  assert.equal((await api.get("/api/cart").set(auth)).body.items.length, 2, "carrinho preservado");
});

test("pedido com carrinho vazio é recusado; pedidos são privados", async () => {
  const ana = await cadastrar("ana@exemplo.com");
  const bia = await cadastrar("bia@exemplo.com");
  assert.equal((await api.post("/api/orders").set(ana.auth).send({})).status, 400);

  await api.post("/api/cart/items").set(ana.auth).send({ productId: produto("Areia").id, size: "M" });
  const pedido = await api.post("/api/orders").set(ana.auth).send({});
  assert.equal((await api.get(`/api/orders/${pedido.body.id}`).set(ana.auth)).status, 200);
  assert.equal((await api.get(`/api/orders/${pedido.body.id}`).set(bia.auth)).status, 404);
  assert.deepEqual((await api.get("/api/orders").set(bia.auth)).body, []);
});

test("preço do pedido fica gravado mesmo se o produto mudar depois", async () => {
  const { auth } = await cadastrar();
  const p = produto("Areia");
  await api.post("/api/cart/items").set(auth).send({ productId: p.id, size: "M" });
  const { body: pedido } = await api.post("/api/orders").set(auth).send({});
  db.prepare("UPDATE products SET price_cents = 99900, name = 'Outro nome' WHERE id = ?").run(p.id);
  const lido = (await api.get(`/api/orders/${pedido.id}`).set(auth)).body;
  assert.equal(lido.items[0].unitPriceCents, 7400);
  assert.equal(lido.items[0].name, "Areia");
});

test("JSON malformado e rota inexistente respondem com erro limpo", async () => {
  const r = await api.post("/api/users/login").set("Content-Type", "application/json").send("{ruim");
  assert.equal(r.status, 400);
  assert.equal(r.body.error, "JSON inválido.");
  assert.equal((await api.get("/api/nada")).status, 404);
});
