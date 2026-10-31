const { HttpError } = require("./errors");

const TAMANHOS = ["PP", "P", "M", "G", "GG"];
const DESENHOS = ["lisa", "listras", "bolinhas", "sol", "tipografica", "degrade"];

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

const idDaRota = (valor) => {
  if (!/^\d{1,12}$/.test(String(valor))) throw new HttpError(404, "Não encontrado.");
  return Number(valor);
};

module.exports = { TAMANHOS, DESENHOS, texto, email, senha, inteiro, tamanho, cor, desenho, idDaRota };
