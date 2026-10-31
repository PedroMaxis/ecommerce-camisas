const request = require("supertest");
const { abrirBanco } = require("../src/db");
const { criarApp } = require("../src/app");
const { semear } = require("../scripts/seed");

const config = { segredo: "segredo-de-teste-123456", validade: "1h", origens: [], limitarAutenticacao: false };

async function montar() {
  const db = abrirBanco(":memory:");
  await semear(db, { adminEmail: "admin@ginga.local", adminSenha: "senha-do-admin" });
  const api = request(criarApp({ db, config }));

  const cadastrar = async (email = "ana@exemplo.com", name = "Ana Souza") => {
    const res = await api.post("/api/users/register").send({ name, email, password: "12345678" });
    return { res, token: res.body.token, auth: { Authorization: `Bearer ${res.body.token}` } };
  };
  const loginAdmin = async () => {
    const r = await api.post("/api/users/login").send({ email: "admin@ginga.local", password: "senha-do-admin" });
    return { Authorization: `Bearer ${r.body.token}` };
  };
  const produto = (nome) => db.prepare("SELECT * FROM products WHERE name = ?").get(nome);
  const estoque = (id, tam) => db.prepare("SELECT quantity FROM stock WHERE product_id = ? AND size = ?").get(id, tam).quantity;
  const naSacola = (auth, nome, size, quantity = 1) => api.post("/api/cart/items").set(auth).send({ productId: produto(nome).id, size, quantity });
  const endereco = (extra = {}) => ({ name: "Ana Souza", cep: "30130-010", street: "Av. Afonso Pena", number: "1500", district: "Centro", city: "Belo Horizonte", state: "MG", ...extra });
  const fechar = (auth, extra = {}) => api.post("/api/orders").set(auth).send({ address: endereco(), payment: "pix", shipping: "economico", ...extra });
  return { db, api, cadastrar, loginAdmin, produto, estoque, naSacola, endereco, fechar };
}

module.exports = { montar };
