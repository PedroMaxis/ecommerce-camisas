// Catálogo, cupons e semeadura (usado pelo script de seed, pelos testes e pelo demo no navegador)
const { gerarHash } = require("../src/auth");

// Estampas originais (desenhadas em SVG pelo front). Nenhum escudo de clube, da CBF ou marca registrada.
const CATALOGO = [
  { name: "Ginga", category: "futebol", cut: "futebol", design: "ginga", color: "#009739", price: 11990,
    description: "Gola em V e frisos nas mangas, como as camisas de jogo dos anos 90. Verde de bandeira, losango amarelo no peito.",
    story: "Nasceu da camisa que todo mundo teve e ninguém sabe onde foi parar. Ginga é o balanço do corpo antes do drible.",
    stock: { PP: 3, P: 8, M: 12, G: 9, GG: 4 } },
  { name: "Pelada de Domingo", category: "futebol", cut: "camiseta", design: "pelada", color: "#fedd00", price: 8990,
    description: "Amarelo-ouro, bola de gomos grandes e a palavra PELADA em letra de campeonato de rua. Algodão penteado.",
    story: "Camisa para o racha de domingo: dois times, uma bola meio murcha e traves de chinelo.",
    stock: { PP: 2, P: 6, M: 10, G: 7, GG: 3 } },
  { name: "Copacabana", category: "praia", cut: "camiseta", design: "copacabana", color: "#f6efe0", price: 9990,
    description: "As ondas pretas e brancas do calçadão mais famoso do mundo, em estampa corrida de ponta a ponta.",
    story: "O desenho do calçadão veio de Portugal e foi assentado pedra por pedra, com a mão. A gente só passou para o tecido.",
    stock: { PP: 0, P: 5, M: 9, G: 6, GG: 2 } },
  { name: "Cajú", category: "praia", cut: "babylook", design: "caju", color: "#f4b400", price: 8490,
    description: "Baby look amarelo-manga com cajus vermelhos e a castanha pendurada, do jeito que dá na árvore.",
    story: "O cajú é uma fruta de cabeça para baixo: a castanha, que é o fruto de verdade, cresce fora. Tem gente que aprende isso tarde.",
    stock: { PP: 6, P: 11, M: 8, G: 4, GG: 0 } },
  { name: "Sol a Pino", category: "praia", cut: "regata", design: "sol", color: "#1f5fbf", price: 7990,
    description: "Regata azul de mar fundo com sol amarelo de meio-dia e raios de verdade, daqueles que queimam o ombro.",
    story: "Meio-dia no litoral não tem sombra: tudo é luz branca, areia quente e picolé derretendo na mão.",
    stock: { PP: 4, P: 9, M: 14, G: 10, GG: 5 } },
  { name: "Fita do Bonfim", category: "festa", cut: "oversized", design: "bonfim", color: "#fffaf0", price: 10990,
    description: "Oversized em algodão cru com faixas diagonais nas cores das fitinhas de Salvador. Cada cor, um desejo.",
    story: "Amarra-se três nós, faz-se três pedidos, e só se tira a fita quando ela se desfaz sozinha.",
    stock: { PP: 1, P: 3, M: 5, G: 4, GG: 1 } },
  { name: "Carnaval", category: "festa", cut: "camiseta", design: "carnaval", color: "#012169", price: 9990,
    description: "Azul-marinho coberto de confete e serpentina em verde, amarelo, rosa e branco. Brilha mesmo sem purpurina.",
    story: "Quarta-feira de cinzas é só um nome: o confete fica no cabelo, no sapato e na bolsa até o ano seguinte.",
    stock: { PP: 5, P: 12, M: 15, G: 11, GG: 6 } },
  { name: "Azulejo", category: "raiz", cut: "oversized", design: "azulejo", color: "#f6efe0", price: 10990,
    description: "Oversized estampado com o padrão de azulejo português azul e branco que enfeita igrejas e casarões do país.",
    story: "Veio na bagagem dos portugueses, ficou nas fachadas de São Luís e virou nosso. Hoje está no banheiro da sua avó.",
    stock: { PP: 2, P: 6, M: 9, G: 7, GG: 3 } },
  { name: "Arara", category: "raiz", cut: "babylook", design: "arara", color: "#0f6b3a", price: 9490,
    description: "Baby look verde-mata com uma arara geométrica em vermelho, amarelo e azul, de asa aberta.",
    story: "A arara-vermelha faz ninho em buraco de árvore e escolhe um parceiro para a vida toda. A estampa tem a mesma teimosia.",
    stock: { PP: 4, P: 7, M: 11, G: 8, GG: 5 } },
  { name: "Cobogó", category: "raiz", cut: "camiseta", design: "cobogo", color: "#d9482b", price: 9490,
    description: "Terracota com o desenho vazado dos cobogós, aqueles tijolinhos que deixam o vento e a luz passarem.",
    story: "O nome junta as iniciais de três engenheiros do Recife que inventaram a peça nos anos 1920. É design brasileiro de nascença.",
    stock: { PP: 5, P: 9, M: 13, G: 10, GG: 6 } },
  { name: "Saudade", category: "raiz", cut: "camiseta", design: "saudade", color: "#012169", price: 8990,
    description: "Azul-marinho com a palavra SAUDADE gigante em amarelo. Nenhuma outra língua tem uma só palavra para isso.",
    story: "Dizem que só português e galego têm a palavra. A gente jura que o resto do mundo sente e só não sabe o nome.",
    stock: { PP: 6, P: 14, M: 20, G: 15, GG: 8 } },
];

const CUPONS = [
  { code: "BEMVINDO10", percent: 10, free_shipping: 0, min_cents: 0, description: "10% na primeira compra" },
  { code: "CORRE20", percent: 20, free_shipping: 0, min_cents: 25000, description: "20% em compras a partir de R$ 250" },
  { code: "FRETEBRASIL", percent: 0, free_shipping: 1, min_cents: 15000, description: "Frete econômico grátis a partir de R$ 150" },
];

/** Popula catálogo e cupons e, se `adminSenha` vier, cria o administrador (idempotente quanto ao admin). */
async function semear(db, { adminEmail = "admin@ginga.local", adminSenha } = {}) {
  const novo = db.prepare("INSERT INTO products (name, description, price_cents, color, design, cut, category, story) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const est = db.prepare("INSERT INTO stock (product_id, size, quantity) VALUES (?, ?, ?)");
  for (const p of CATALOGO) {
    const { lastInsertRowid } = novo.run(p.name, p.description, p.price, p.color, p.design, p.cut, p.category, p.story);
    for (const [tam, q] of Object.entries(p.stock)) est.run(Number(lastInsertRowid), tam, q);
  }
  const cup = db.prepare("INSERT OR IGNORE INTO coupons (code, percent, free_shipping, min_cents, description) VALUES (?, ?, ?, ?, ?)");
  for (const c of CUPONS) cup.run(c.code, c.percent, c.free_shipping, c.min_cents, c.description);
  if (adminSenha) {
    const hash = await gerarHash(adminSenha);
    db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES ('Administrador', ?, ?, 'admin') ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = excluded.password_hash").run(adminEmail, hash);
  }
}

module.exports = { semear, CATALOGO, CUPONS };
