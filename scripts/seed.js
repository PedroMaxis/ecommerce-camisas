const { abrirBanco } = require("../src/db");
const { gerarHash } = require("../src/auth");

// Camisas autorais: o "desenho" é renderizado pelo front em SVG, então não há imagens para hospedar
const CATALOGO = [
  { name: "Maré Alta", description: "Algodão penteado 180 g/m², listras largas inspiradas em toldos de praia. Caimento reto.", price: 8900, color: "#1d4e89", design: "listras", stock: { PP: 3, P: 8, M: 12, G: 9, GG: 4 } },
  { name: "Sol de Meio-Dia", description: "Estampa de sol em serigrafia de duas cores, sobre malha 100% algodão.", price: 9900, color: "#f2b632", design: "sol", stock: { PP: 2, P: 6, M: 10, G: 7, GG: 3 } },
  { name: "Pontinhos", description: "Bolinhas em meio-tom, como nas gráficas antigas. Malha leve para o calor.", price: 8400, color: "#e8e1d0", design: "bolinhas", stock: { PP: 0, P: 5, M: 9, G: 6, GG: 2 } },
  { name: "Lisa Grafite", description: "A básica que combina com tudo. Algodão egípcio, costura reforçada no ombro.", price: 6900, color: "#2b2d31", design: "lisa", stock: { PP: 6, P: 14, M: 20, G: 15, GG: 8 } },
  { name: "Bom Dia", description: "Tipografia grande, tinta à base d'água. Edição limitada de 40 peças.", price: 10900, color: "#e4572e", design: "tipografica", stock: { PP: 1, P: 3, M: 5, G: 4, GG: 1 } },
  { name: "Entardecer", description: "Degradê pintado à mão no tecido: nenhuma peça sai igual à outra.", price: 11900, color: "#7b5ea7", design: "degrade", stock: { PP: 0, P: 2, M: 4, G: 3, GG: 0 } },
  { name: "Verde Mata", description: "Listras finas em verde-musgo, gola ribana dupla. Modelagem levemente ampla.", price: 8900, color: "#3b7a57", design: "listras", stock: { PP: 4, P: 7, M: 11, G: 8, GG: 5 } },
  { name: "Areia", description: "Cor natural, sem tingimento químico. Fica mais macia a cada lavagem.", price: 7400, color: "#d9c7a3", design: "lisa", stock: { PP: 5, P: 9, M: 13, G: 10, GG: 6 } },
];

/** Popula catálogo e, se `adminSenha` vier, cria o administrador. Idempotente quanto ao admin. */
async function semear(db, { adminEmail = "admin@loja.local", adminSenha } = {}) {
  const novo = db.prepare("INSERT INTO products (name, description, price_cents, color, design) VALUES (?, ?, ?, ?, ?)");
  const est = db.prepare("INSERT INTO stock (product_id, size, quantity) VALUES (?, ?, ?)");
  for (const p of CATALOGO) {
    const { lastInsertRowid } = novo.run(p.name, p.description, p.price, p.color, p.design);
    for (const [tam, q] of Object.entries(p.stock)) est.run(Number(lastInsertRowid), tam, q);
  }
  if (adminSenha) {
    const hash = await gerarHash(adminSenha);
    db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES ('Administrador', ?, ?, 'admin') ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = excluded.password_hash").run(adminEmail, hash);
  }
}

module.exports = { semear, CATALOGO };

if (require.main === module) {
  const { lerConfig } = require("../src/config");
  const fs = require("node:fs");
  const path = require("node:path");
  const config = lerConfig();
  fs.mkdirSync(path.dirname(config.banco), { recursive: true });
  const db = abrirBanco(config.banco);
  const jaTem = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
  (async () => {
    if (!jaTem) await semear(db, { adminEmail: process.env.ADMIN_EMAIL, adminSenha: process.env.ADMIN_PASSWORD });
    console.log(jaTem ? "Catálogo já existe; nada a fazer." : `Catálogo criado (${CATALOGO.length} camisas).`);
  })();
}
