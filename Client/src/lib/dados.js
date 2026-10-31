export const TAMANHOS = ["PP", "P", "M", "G", "GG"];

export const CATEGORIAS = [
  { id: "todas", nome: "Todas" },
  { id: "futebol", nome: "Futebol" },
  { id: "praia", nome: "Praia" },
  { id: "festa", nome: "Festa" },
  { id: "raiz", nome: "Raiz" },
];

export const CORTES = { camiseta: "Camiseta", babylook: "Baby look", regata: "Regata", futebol: "Gola em V", oversized: "Oversized" };

export const STATUS = {
  pending: { nome: "Aguardando pagamento", ordem: 0 },
  paid: { nome: "Pago", ordem: 1 },
  shipped: { nome: "Enviado", ordem: 2 },
  delivered: { nome: "Entregue", ordem: 3 },
  cancelled: { nome: "Cancelado", ordem: -1 },
};

export const PAGAMENTOS = [
  { id: "pix", nome: "PIX", dica: "5% de desconto, aprovação na hora" },
  { id: "cartao", nome: "Cartão de crédito", dica: "Em até 3x sem juros" },
  { id: "boleto", nome: "Boleto", dica: "Vence em 3 dias úteis" },
];

export const ESTADOS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

// medidas da peça (largura × comprimento, em cm) por tamanho e corte
export const MEDIDAS = {
  camiseta: { PP: [48, 66], P: [50, 69], M: [53, 72], G: [56, 75], GG: [59, 78] },
  oversized: { PP: [56, 68], P: [58, 71], M: [61, 74], G: [64, 77], GG: [67, 80] },
  babylook: { PP: [38, 52], P: [40, 54], M: [42, 56], G: [45, 58], GG: [48, 60] },
  regata: { PP: [44, 64], P: [46, 67], M: [49, 70], G: [52, 73], GG: [55, 76] },
  futebol: { PP: [50, 68], P: [52, 71], M: [55, 74], G: [58, 77], GG: [61, 80] },
};

export const FRETE_GRATIS = 29900;

/** Fundo suave da peça, derivado da cor do tecido */
export const fundoDe = (cor) => `color-mix(in srgb, ${cor} 26%, #fbf5e1)`;
export const precoPix = (cents) => cents - Math.floor((cents * 5) / 100);
