const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
/** Valores trafegam em centavos inteiros (nada de 0.1 + 0.2) e só viram texto na hora de exibir */
export const reais = (centavos) => brl.format(centavos / 100);

export const TAMANHOS = ["PP", "P", "M", "G", "GG"];

/** Soma de unidades de um objeto de estoque por tamanho */
export const totalEstoque = (stock) => Object.values(stock ?? {}).reduce((s, q) => s + q, 0);

/** Poucas unidades restantes numa edição pequena vale destaque */
export const ultimas = (stock) => {
  const t = totalEstoque(stock);
  return t > 0 && t <= 6 ? t : 0;
};
