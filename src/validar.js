const { HttpError } = require("./errors");

const TAMANHOS = ["PP", "P", "M", "G", "GG"];
const CATEGORIAS = ["futebol", "praia", "festa", "raiz"];
const CORTES = ["camiseta", "babylook", "regata", "futebol", "oversized"];
const PAGAMENTOS = ["pix", "cartao", "boleto"];
const ENVIOS = ["economico", "expresso"];
const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const DESENHOS = ["lisa", "ginga", "pelada", "copacabana", "caju", "sol", "bonfim", "carnaval", "azulejo", "arara", "cobogo", "saudade"];

const invalido = (mensagem) => new HttpError(400, mensagem);

const texto = (valor, { campo, min = 1, max = 200 }) => {
  if (typeof valor !== "string") throw invalido(`O campo "${campo}" é obrigatório.`);
  const limpo = valor.trim().replace(/\s+/g, " ");
  if (limpo.length < min || limpo.length > max) throw invalido(`O campo "${campo}" deve ter de ${min} a ${max} caracteres.`);
  return limpo;
};

const email = (valor) => {
  const limpo = texto(valor, { campo: "e-mail", max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo)) throw invalido("Informe um e-mail válido.");
  return limpo;
};

const senha = (valor) => {
  if (typeof valor !== "string" || valor.length < 8) throw invalido("A senha deve ter pelo menos 8 caracteres.");
  if (valor.length > 72) throw invalido("A senha deve ter no máximo 72 caracteres."); // limite do bcrypt
  return valor;
};

/** Inteiro (aceita número ou texto numérico: "2" não vira concatenação como acontecia no carrinho antigo) */
const inteiro = (valor, { campo, min = 0, max = 1_000_000 }) => {
  const n = typeof valor === "string" && /^-?\d+$/.test(valor.trim()) ? Number(valor) : valor;
  if (!Number.isInteger(n) || n < min || n > max) throw invalido(`O campo "${campo}" deve ser um número inteiro entre ${min} e ${max}.`);
  return n;
};

const tamanho = (valor) => {
  if (!TAMANHOS.includes(valor)) throw invalido(`Tamanho inválido. Use: ${TAMANHOS.join(", ")}.`);
  return valor;
};

const cor = (valor) => {
  if (typeof valor !== "string" || !/^#[0-9a-fA-F]{6}$/.test(valor)) throw invalido('A cor deve estar no formato "#rrggbb".');
  return valor.toLowerCase();
};

const desenho = (valor) => {
  if (!DESENHOS.includes(valor)) throw invalido(`Desenho inválido. Use: ${DESENHOS.join(", ")}.`);
  return valor;
};

const categoria = (valor) => {
  if (!CATEGORIAS.includes(valor)) throw invalido(`Categoria inválida. Use: ${CATEGORIAS.join(", ")}.`);
  return valor;
};

const corte = (valor) => {
  if (!CORTES.includes(valor)) throw invalido(`Corte inválido. Use: ${CORTES.join(", ")}.`);
  return valor;
};
const pagamento = (valor) => {
  if (!PAGAMENTOS.includes(valor)) throw invalido(`Forma de pagamento inválida. Use: ${PAGAMENTOS.join(", ")}.`);
  return valor;
};
const envio = (valor) => {
  if (!ENVIOS.includes(valor)) throw invalido(`Forma de envio inválida. Use: ${ENVIOS.join(", ")}.`);
  return valor;
};
/** CEP com ou sem hífen → 8 dígitos */
const cep = (valor) => {
  const limpo = String(valor ?? "").replace(/\D/g, "");
  if (limpo.length !== 8) throw invalido("CEP inválido: informe 8 números.");
  return limpo;
};
const uf = (valor) => {
  const u = String(valor ?? "").trim().toUpperCase();
  if (!ESTADOS.includes(u)) throw invalido("Estado inválido: use a sigla, como SP ou MG.");
  return u;
};

const idDaRota = (valor) => {
  if (!/^\d{1,12}$/.test(String(valor))) throw new HttpError(404, "Não encontrado.");
  return Number(valor);
};

module.exports = { TAMANHOS, DESENHOS, CATEGORIAS, CORTES, categoria, corte, pagamento, envio, cep, uf, texto, email, senha, inteiro, tamanho, cor, desenho, idDaRota };
