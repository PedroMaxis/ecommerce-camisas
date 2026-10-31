const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { montar } = require("./ajuda");

let t;
beforeEach(async () => { t = await montar(); });

test("cadastro devolve token e nunca o hash da senha", async () => {
  const { res } = await t.cadastrar();
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.deepEqual(Object.keys(res.body.user).sort(), ["email", "id", "name", "role"]);
  assert.ok(!JSON.stringify(res.body).includes("password"));
});

test("cadastro valida campos e recusa e-mail repetido (sem diferenciar maiúsculas)", async () => {
  assert.equal((await t.api.post("/api/users/register").send({ name: "A", email: "x", password: "1" })).status, 400);
  assert.equal((await t.api.post("/api/users/register").send({ name: "Ana Souza", email: "ana@exemplo.com", password: "curta" })).status, 400);
  await t.cadastrar("ana@exemplo.com");
  assert.equal((await t.api.post("/api/users/register").send({ name: "Outra Ana", email: "ANA@exemplo.com", password: "12345678" })).status, 409);
});

test("login: senha errada e e-mail inexistente dão a mesma resposta", async () => {
  await t.cadastrar();
  const errada = await t.api.post("/api/users/login").send({ email: "ana@exemplo.com", password: "errada123" });
  const inexistente = await t.api.post("/api/users/login").send({ email: "ninguem@exemplo.com", password: "12345678" });
  assert.equal(errada.status, 401);
  assert.deepEqual(errada.body, inexistente.body);
  assert.equal((await t.api.post("/api/users/login").send({ email: "ana@exemplo.com", password: "12345678" })).status, 200);
});

test("rotas protegidas: sem header não derrubam o servidor, token inválido é 401", async () => {
  assert.equal((await t.api.get("/api/cart")).status, 401);
  assert.equal((await t.api.get("/api/cart").set("Authorization", "Bearer lixo")).status, 401);
  assert.equal((await t.api.get("/api/orders").set("Authorization", "qualquer coisa")).status, 401);
});

test("conta: troca de nome e de senha (exige a senha atual)", async () => {
  const { auth } = await t.cadastrar();
  const r = await t.api.patch("/api/users/me").set(auth).send({ name: "Ana Paula Souza" });
  assert.equal(r.body.user.name, "Ana Paula Souza");
  assert.equal((await t.api.get("/api/users/me").set(auth)).body.user.name, "Ana Paula Souza");

  assert.equal((await t.api.post("/api/users/me/password").set(auth).send({ currentPassword: "errada", newPassword: "nova-senha-123" })).status, 401);
  assert.equal((await t.api.post("/api/users/me/password").set(auth).send({ currentPassword: "12345678", newPassword: "curta" })).status, 400);
  assert.equal((await t.api.post("/api/users/me/password").set(auth).send({ currentPassword: "12345678", newPassword: "nova-senha-123" })).status, 204);
  assert.equal((await t.api.post("/api/users/login").send({ email: "ana@exemplo.com", password: "12345678" })).status, 401);
  assert.equal((await t.api.post("/api/users/login").send({ email: "ana@exemplo.com", password: "nova-senha-123" })).status, 200);
});

test("JSON malformado e rota inexistente respondem com erro limpo", async () => {
  const r = await t.api.post("/api/users/login").set("Content-Type", "application/json").send("{ruim");
  assert.equal(r.status, 400);
  assert.equal(r.body.error, "JSON inválido.");
  assert.equal((await t.api.get("/api/nada")).status, 404);
});
