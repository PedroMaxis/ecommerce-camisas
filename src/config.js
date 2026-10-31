const crypto = require("node:crypto");

/** Lê o ambiente. Em produção o segredo do JWT é obrigatório: sem ele qualquer um poderia forjar logins. */
function lerConfig(env = process.env) {
  const producao = env.NODE_ENV === "production";
  if (producao && (!env.JWT_SECRET || env.JWT_SECRET.length < 16)) throw new Error("Defina JWT_SECRET (16+ caracteres) em produção.");
  return {
    porta: Number(env.PORT) || 3000,
    banco: env.DATABASE_FILE || "data/loja.sqlite",
    // em desenvolvimento, um segredo aleatório por execução (sessões caem ao reiniciar, o que é aceitável)
    segredo: env.JWT_SECRET || crypto.randomBytes(32).toString("hex"),
    validade: env.JWT_EXPIRES_IN || "7d",
    origens: (env.CORS_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean),
    limitarAutenticacao: env.NODE_ENV !== "test",
  };
}
module.exports = { lerConfig };
