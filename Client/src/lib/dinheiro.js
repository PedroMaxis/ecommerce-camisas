const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
/** Valores trafegam em centavos inteiros (nada de 0.1 + 0.2) e só viram texto na hora de exibir */
export const reais = (centavos) => brl.format(centavos / 100);

export const totalEstoque = (stock) => Object.values(stock ?? {}).reduce((s, q) => s + q, 0);

/** Poucas unidades restantes numa tiragem curta vale destaque */
export const ultimas = (stock) => {
  const t = totalEstoque(stock);
  return t > 0 && t <= 8 ? t : 0;
};

export const mascararCep = (v) => { const n = v.replace(/\D/g, "").slice(0, 8); return n.length > 5 ? `${n.slice(0, 5)}-${n.slice(5)}` : n; };
export const dataLonga = (iso) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
export const dataHora = (iso) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
