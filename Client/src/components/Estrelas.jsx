import { Estrela } from "./Icones";

/** Nota em estrelas (somente leitura). Sem avaliações, mostra "novo". */
export default function Estrelas({ nota }) {
  if (!nota || !nota.count) return <span className="estrelas">novo</span>;
  return (
    <span className="estrelas" title={`${nota.avg} de 5 · ${nota.count} avaliações`}>
      {Array.from({ length: 5 }, (_, i) => <Estrela key={i} className={i < Math.round(nota.avg) ? "" : "vazia"} />)}
      <span>{nota.avg.toFixed(1).replace(".", ",")} ({nota.count})</span>
    </span>
  );
}
