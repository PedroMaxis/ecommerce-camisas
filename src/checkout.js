/** Regras de dinheiro do pedido, num só lugar e sem tocar no banco: dá para testar com números na mão. */
const FRETE_GRATIS_A_PARTIR_DE = 29900; // R$ 299,00
const DESCONTO_PIX_PERCENTUAL = 5;
const EXPRESSO_ACRESCIMO = 1500;

// Primeiro dígito do CEP = região postal do país: [frete em centavos, prazo em dias úteis, nome]
const REGIOES = {
  0: [1490, 3, "Grande São Paulo"], 1: [1490, 3, "São Paulo"], 2: [1790, 4, "Rio de Janeiro e Espírito Santo"],
  3: [1790, 4, "Minas Gerais"], 4: [2490, 6, "Bahia e Sergipe"], 5: [2790, 7, "Pernambuco, Alagoas, Paraíba e Rio Grande do Norte"],
  6: [3290, 9, "Ceará, Piauí, Maranhão e Norte"], 7: [2590, 6, "Centro-Oeste"], 8: [1990, 5, "Paraná e Santa Catarina"], 9: [2290, 6, "Rio Grande do Sul"],
};

function opcoesFrete(cep, subtotalCents, { freteGratisCupom = false } = {}) {
  const [base, dias, regiao] = REGIOES[Number(cep[0])];
  const gratis = subtotalCents >= FRETE_GRATIS_A_PARTIR_DE || freteGratisCupom;
  return {
    regiao,
    gratisAPartirDe: FRETE_GRATIS_A_PARTIR_DE,
    opcoes: [
      { id: "economico", nome: "Econômico", dias, cents: gratis ? 0 : base },
      { id: "expresso", nome: "Expresso", dias: Math.max(1, dias - 2), cents: base + EXPRESSO_ACRESCIMO },
    ],
  };
}

/** Confere o cupom contra o subtotal. Devolve { ok, motivo?, percent, freteGratis }. */
function avaliarCupom(cupom, subtotalCents) {
  if (!cupom || !cupom.active) return { ok: false, motivo: "Cupom inválido ou expirado." };
  if (subtotalCents < cupom.min_cents) return { ok: false, motivo: `Esse cupom vale para compras a partir de R$ ${(cupom.min_cents / 100).toFixed(2).replace(".", ",")}.` };
  return { ok: true, percent: cupom.percent, freteGratis: !!cupom.free_shipping };
}

/** Totais do pedido. Descontos arredondam para baixo (centavo nunca sobra para o cliente por arredondamento). */
function calcularTotais({ subtotalCents, cupom, pagamento, envio, cep }) {
  const c = cupom ? avaliarCupom(cupom, subtotalCents) : { ok: true, percent: 0, freteGratis: false };
  if (!c.ok) return { erro: c.motivo };
  const desconto = Math.floor((subtotalCents * c.percent) / 100);
  const aposCupom = subtotalCents - desconto;
  const pix = pagamento === "pix" ? Math.floor((aposCupom * DESCONTO_PIX_PERCENTUAL) / 100) : 0;
  const { opcoes } = opcoesFrete(cep, subtotalCents, { freteGratisCupom: c.freteGratis });
  const escolhida = opcoes.find((o) => o.id === envio);
  return {
    subtotalCents, discountCents: desconto, pixDiscountCents: pix, shippingCents: escolhida.cents,
    totalCents: aposCupom - pix + escolhida.cents,
  };
}

module.exports = { FRETE_GRATIS_A_PARTIR_DE, DESCONTO_PIX_PERCENTUAL, opcoesFrete, avaliarCupom, calcularTotais };
