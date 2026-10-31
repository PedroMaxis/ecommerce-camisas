const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { montar } = require("./ajuda");

let t;
beforeEach(async () => { t = await montar(); });

test("sacola: soma itens, ajusta quantidade exata e respeita o estoque", async () => {
  const { auth } = await t.cadastrar();
  const p = t.produto("Ginga");
  await t.naSacola(auth, "Ginga", "M", 2);
  let r = await t.api.post("/api/cart/items").set(auth).send({ productId: p.id, size: "M", quantity: "1" }); // texto numérico também vale
  assert.equal(r.body.items[0].quantity, 3);
  assert.equal(r.body.totalCents, 3 * 11990);
  assert.equal(r.body.count, 3);

  r = await t.api.put("/api/cart/items").set(auth).send({ productId: p.id, size: "M", quantity: 1 });
  assert.equal(r.body.items[0].quantity, 1);

  // PP do Ginga tem 3 unidades
  assert.equal((await t.naSacola(auth, "Ginga", "PP", 4)).status, 409);
  assert.equal((await t.naSacola(auth, "Ginga", "M", -1)).status, 400);
  assert.equal((await t.naSacola(auth, "Ginga", "XG", 1)).status, 400);

  r = await t.api.put("/api/cart/items").set(auth).send({ productId: p.id, size: "M", quantity: 0 });
  assert.deepEqual(r.body.items, []);
});

test("tamanho esgotado não entra na sacola", async () => {
  const { auth } = await t.cadastrar();
  const r = await t.naSacola(auth, "Copacabana", "PP");
  assert.equal(r.status, 409);
  assert.match(r.body.error, /esgotado/i);
});

test("frete por CEP: região, prazo, expresso e frete grátis acima de R$ 299", async () => {
  const mg = await t.api.get("/api/shipping?cep=30130-010&subtotal=8990");
  assert.equal(mg.status, 200);
  assert.equal(mg.body.regiao, "Minas Gerais");
  assert.deepEqual(mg.body.opcoes.map((o) => [o.id, o.cents, o.dias]), [["economico", 1790, 4], ["expresso", 3290, 2]]);

  const sp = await t.api.get("/api/shipping?cep=01310100&subtotal=0");
  assert.equal(sp.body.opcoes[0].cents, 1490);
  const norte = await t.api.get("/api/shipping?cep=69000000&subtotal=0");
  assert.equal(norte.body.opcoes[0].cents, 3290);

  const gratis = await t.api.get("/api/shipping?cep=30130010&subtotal=29900");
  assert.equal(gratis.body.opcoes[0].cents, 0);
  assert.equal(gratis.body.opcoes[1].cents, 3290, "expresso nunca é grátis");

  assert.equal((await t.api.get("/api/shipping?cep=123")).status, 400);
  assert.equal((await t.api.get("/api/shipping")).status, 400);
});

test("cupons: valida, respeita o mínimo e oferece frete grátis", async () => {
  const ok = await t.api.get("/api/coupons/bemvindo10?subtotal=5000");
  assert.equal(ok.status, 200);
  assert.deepEqual([ok.body.code, ok.body.percent], ["BEMVINDO10", 10]);
  assert.equal((await t.api.get("/api/coupons/CORRE20?subtotal=10000")).status, 404, "abaixo do mínimo");
  assert.equal((await t.api.get("/api/coupons/CORRE20?subtotal=25000")).status, 200);
  assert.equal((await t.api.get("/api/coupons/NAOEXISTE?subtotal=99999")).status, 404);
  const frete = await t.api.get("/api/shipping?cep=30130010&subtotal=17980&coupon=FRETEBRASIL");
  assert.equal(frete.body.opcoes[0].cents, 0);
});

test("pedido: usa preços do banco, aplica PIX, baixa estoque e esvazia a sacola", async () => {
  const { auth } = await t.cadastrar();
  const a = t.produto("Ginga"), b = t.produto("Saudade");
  await t.naSacola(auth, "Ginga", "M", 2);
  await t.naSacola(auth, "Saudade", "G", 1);

  // o cliente tenta mandar o total: é ignorado
  const r = await t.fechar(auth, { totalCents: 1 });
  assert.equal(r.status, 201);
  assert.equal(r.body.subtotalCents, 2 * 11990 + 8990); // 32.970
  assert.equal(r.body.pixDiscountCents, 1648);           // 5% de 32.970, para baixo
  assert.equal(r.body.shippingCents, 0);                 // acima de R$ 299
  assert.equal(r.body.totalCents, 32970 - 1648);
  assert.equal(r.body.status, "pending");
  assert.equal(r.body.items.length, 2);
  assert.equal(r.body.address.city, "Belo Horizonte");
  assert.equal(r.body.address.cep, "30130010", "CEP gravado só com números");
  assert.equal(t.estoque(a.id, "M"), 10);
  assert.equal(t.estoque(b.id, "G"), 14);
  assert.deepEqual((await t.api.get("/api/cart").set(auth)).body.items, []);
});

test("pedido: cupom + PIX + frete somam do jeito certo; cartão não tem desconto PIX", async () => {
  const { auth } = await t.cadastrar();
  await t.naSacola(auth, "Ginga", "M", 2);
  await t.naSacola(auth, "Saudade", "G", 1);
  const r = await t.fechar(auth, { coupon: "bemvindo10" });
  assert.equal(r.body.discountCents, 3297);
  assert.equal(r.body.pixDiscountCents, 1483); // 5% de (32.970 − 3.297)
  assert.equal(r.body.totalCents, 32970 - 3297 - 1483);
  assert.equal(r.body.coupon, "BEMVINDO10");

  await t.naSacola(auth, "Saudade", "M", 1);
  const c = await t.fechar(auth, { payment: "cartao", shipping: "expresso" });
  assert.equal(c.body.pixDiscountCents, 0);
  assert.equal(c.body.shippingCents, 1790 + 1500);
  assert.equal(c.body.totalCents, 8990 + 3290);
});

test("pedido: cupom inválido ou abaixo do mínimo recusa sem tocar no estoque", async () => {
  const { auth } = await t.cadastrar();
  const p = t.produto("Saudade");
  await t.naSacola(auth, "Saudade", "M", 1);
  assert.equal((await t.fechar(auth, { coupon: "XXXX" })).status, 400);
  const abaixo = await t.fechar(auth, { coupon: "CORRE20" });
  assert.equal(abaixo.status, 400);
  assert.match(abaixo.body.error, /a partir de/);
  assert.equal(t.estoque(p.id, "M"), 20, "estoque intacto");
  assert.equal((await t.api.get("/api/cart").set(auth)).body.items.length, 1, "sacola preservada");
});

test("pedido exige endereço completo e dados válidos", async () => {
  const { auth } = await t.cadastrar();
  await t.naSacola(auth, "Saudade", "M");
  const semEnd = await t.api.post("/api/orders").set(auth).send({ payment: "pix" });
  assert.equal(semEnd.status, 400);
  assert.equal((await t.fechar(auth, { address: t.endereco({ cep: "123" }) })).status, 400);
  assert.equal((await t.fechar(auth, { address: t.endereco({ state: "XX" }) })).status, 400);
  assert.equal((await t.fechar(auth, { address: t.endereco({ street: "" }) })).status, 400);
  assert.equal((await t.fechar(auth, { payment: "fiado" })).status, 400);
  assert.equal((await t.fechar(auth, { shipping: "drone" })).status, 400);
  assert.equal((await t.fechar(auth)).status, 201);
});

test("pedido é tudo ou nada: se um item acabou, nada é baixado", async () => {
  const { auth } = await t.cadastrar();
  const a = t.produto("Ginga"), b = t.produto("Fita do Bonfim");
  await t.naSacola(auth, "Ginga", "M", 2);
  await t.naSacola(auth, "Fita do Bonfim", "PP", 1);
  t.db.prepare("UPDATE stock SET quantity = 0 WHERE product_id = ? AND size = 'PP'").run(b.id); // alguém comprou antes

  const r = await t.fechar(auth);
  assert.equal(r.status, 409);
  assert.equal(t.estoque(a.id, "M"), 12, "estoque do primeiro item deve ter voltado");
  assert.equal(t.db.prepare("SELECT COUNT(*) AS n FROM orders").get().n, 0);
  assert.equal((await t.api.get("/api/cart").set(auth)).body.items.length, 2, "sacola preservada");
});

test("pedido com sacola vazia é recusado; pedidos são privados", async () => {
  const ana = await t.cadastrar("ana@exemplo.com");
  const bia = await t.cadastrar("bia@exemplo.com");
  assert.equal((await t.fechar(ana.auth)).status, 400);

  await t.naSacola(ana.auth, "Cajú", "M");
  const pedido = await t.fechar(ana.auth);
  assert.equal((await t.api.get(`/api/orders/${pedido.body.id}`).set(ana.auth)).status, 200);
  assert.equal((await t.api.get(`/api/orders/${pedido.body.id}`).set(bia.auth)).status, 404);
  assert.equal((await t.api.post(`/api/orders/${pedido.body.id}/pay`).set(bia.auth)).status, 404);
  assert.deepEqual((await t.api.get("/api/orders").set(bia.auth)).body, []);
});

test("preço do pedido fica gravado mesmo se o produto mudar depois", async () => {
  const { auth } = await t.cadastrar();
  const p = t.produto("Azulejo");
  await t.naSacola(auth, "Azulejo", "M");
  const { body: pedido } = await t.fechar(auth);
  t.db.prepare("UPDATE products SET price_cents = 99900, name = 'Outro nome' WHERE id = ?").run(p.id);
  const lido = (await t.api.get(`/api/orders/${pedido.id}`).set(auth)).body;
  assert.equal(lido.items[0].unitPriceCents, 10990);
  assert.equal(lido.items[0].name, "Azulejo");
});

test("ciclo do pedido: pagar, cancelar só antes de pagar, e devolver o estoque", async () => {
  const { auth } = await t.cadastrar();
  const p = t.produto("Arara");
  await t.naSacola(auth, "Arara", "M", 2);
  const a = await t.fechar(auth);
  assert.equal(t.estoque(p.id, "M"), 9);

  const cancelado = await t.api.post(`/api/orders/${a.body.id}/cancel`).set(auth);
  assert.equal(cancelado.body.status, "cancelled");
  assert.equal(t.estoque(p.id, "M"), 11, "peças voltaram para a prateleira");
  assert.equal((await t.api.post(`/api/orders/${a.body.id}/cancel`).set(auth)).status, 409, "não cancela duas vezes");
  assert.equal((await t.api.post(`/api/orders/${a.body.id}/pay`).set(auth)).status, 409, "não paga pedido cancelado");

  await t.naSacola(auth, "Arara", "M", 1);
  const b = await t.fechar(auth);
  const pago = await t.api.post(`/api/orders/${b.body.id}/pay`).set(auth);
  assert.equal(pago.body.status, "paid");
  assert.ok(pago.body.paidAt);
  assert.equal((await t.api.post(`/api/orders/${b.body.id}/cancel`).set(auth)).status, 409, "depois de pago, só o admin cancela");
});

test("favoritos: marcar, listar, desmarcar (idempotente) e exigem login", async () => {
  assert.equal((await t.api.get("/api/favorites")).status, 401);
  const { auth } = await t.cadastrar();
  const id = t.produto("Cobogó").id;
  assert.equal((await t.api.put(`/api/favorites/${id}`).set(auth)).status, 204);
  assert.equal((await t.api.put(`/api/favorites/${id}`).set(auth)).status, 204);
  assert.deepEqual((await t.api.get("/api/favorites").set(auth)).body, [id]);
  assert.equal((await t.api.put("/api/favorites/9999").set(auth)).status, 404);
  assert.equal((await t.api.delete(`/api/favorites/${id}`).set(auth)).status, 204);
  assert.deepEqual((await t.api.get("/api/favorites").set(auth)).body, []);
});

test("contato e newsletter validam e não duplicam", async () => {
  assert.equal((await t.api.post("/api/contact").send({ name: "Ana", email: "ana@x.com", subject: "Oi", body: "curta" })).status, 400);
  const ok = await t.api.post("/api/contact").send({ name: "Ana Souza", email: "ana@exemplo.com", subject: "Troca de tamanho", body: "Comprei P e queria M, como faço?" });
  assert.equal(ok.status, 201);
  assert.equal(t.db.prepare("SELECT COUNT(*) AS n FROM messages").get().n, 1);

  assert.equal((await t.api.post("/api/newsletter").send({ email: "invalido" })).status, 400);
  assert.equal((await t.api.post("/api/newsletter").send({ email: "fa@exemplo.com" })).status, 201);
  const repetido = await t.api.post("/api/newsletter").send({ email: "FA@exemplo.com" });
  assert.equal(repetido.status, 200);
  assert.equal(repetido.body.novo, false);
});

test("painel admin: resumo, pedidos, mudança de status e permissões", async () => {
  const ana = await t.cadastrar();
  assert.equal((await t.api.get("/api/admin/summary").set(ana.auth)).status, 403);
  assert.equal((await t.api.get("/api/admin/orders")).status, 401);

  await t.naSacola(ana.auth, "Saudade", "M", 1);
  const pedido = await t.fechar(ana.auth);
  const admin = await t.loginAdmin();

  const lista = await t.api.get("/api/admin/orders").set(admin);
  assert.equal(lista.body.length, 1);
  assert.equal(lista.body[0].customer.email, "ana@exemplo.com");
  assert.deepEqual(lista.body[0].next, ["paid", "cancelled"]);

  assert.equal((await t.api.patch(`/api/admin/orders/${pedido.body.id}`).set(admin).send({ status: "shipped" })).status, 409, "não pula etapa");
  assert.equal((await t.api.patch(`/api/admin/orders/${pedido.body.id}`).set(admin).send({ status: "voando" })).status, 400);
  for (const status of ["paid", "shipped", "delivered"]) {
    assert.equal((await t.api.patch(`/api/admin/orders/${pedido.body.id}`).set(admin).send({ status })).body.status, status);
  }
  const resumo = (await t.api.get("/api/admin/summary").set(admin)).body;
  assert.equal(resumo.revenueCents, pedido.body.totalCents);
  assert.equal(resumo.ordersByStatus.delivered, 1);
  assert.equal(resumo.customers, 1);
  assert.ok(resumo.lowStock.length > 0, "peças com 2 ou menos aparecem no alerta");
});

test("admin cancela pedido já pago e as peças voltam ao estoque", async () => {
  const ana = await t.cadastrar();
  const p = t.produto("Saudade");
  await t.naSacola(ana.auth, "Saudade", "M", 2);
  const pedido = await t.fechar(ana.auth);
  await t.api.post(`/api/orders/${pedido.body.id}/pay`).set(ana.auth);
  assert.equal(t.estoque(p.id, "M"), 18);
  const admin = await t.loginAdmin();
  assert.equal((await t.api.patch(`/api/admin/orders/${pedido.body.id}`).set(admin).send({ status: "cancelled" })).body.status, "cancelled");
  assert.equal(t.estoque(p.id, "M"), 20);
});

test("preview do checkout devolve os mesmos totais do pedido, sem criar nada", async () => {
  const { auth } = await t.cadastrar();
  await t.naSacola(auth, "Saudade", "M", 1);
  const prev = await t.api.post("/api/orders/preview").set(auth).send({ cep: "30130-010", payment: "pix", shipping: "economico", coupon: "BEMVINDO10" });
  assert.equal(prev.status, 200);
  assert.equal(t.db.prepare("SELECT COUNT(*) AS n FROM orders").get().n, 0);
  const real = await t.fechar(auth, { coupon: "BEMVINDO10" });
  for (const k of ["subtotalCents", "discountCents", "pixDiscountCents", "shippingCents", "totalCents"]) assert.equal(prev.body[k], real.body[k], k);
  assert.equal((await t.api.post("/api/orders/preview").set(auth).send({ cep: "30130010", coupon: "XXXX" })).status, 400);
});
