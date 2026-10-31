import { Link } from "react-router-dom";
import Camisa from "./Camisa";
import { reais, totalEstoque, ultimas } from "../lib/dinheiro";

export default function ProductCard({ produto: p, indice }) {
  const esgotado = totalEstoque(p.stock) === 0;
  const poucas = ultimas(p.stock);
  return (
    <Link to={`/camisa/${p.id}`} className={`cartao ${esgotado ? "esgotado" : ""}`} style={{ "--i": indice }}>
      <div className="cartao-arte" style={{ "--fundo": p.color }}>
        <Camisa cor={p.color} design={p.design} titulo={`Camisa ${p.name}`} />
        {esgotado && <span className="selo selo-fim">Esgotada</span>}
        {poucas > 0 && <span className="selo">Últimas {poucas}</span>}
      </div>
      <div className="cartao-info">
        <span className="num">Nº {String(p.id).padStart(2, "0")}</span>
        <h3>{p.name}</h3>
        <span className="preco">{reais(p.priceCents)}</span>
      </div>
    </Link>
  );
}
