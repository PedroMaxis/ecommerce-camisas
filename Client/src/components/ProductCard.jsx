import { Link, useNavigate } from "react-router-dom";
import Camisa from "./Camisa";
import Estrelas from "./Estrelas";
import { Coracao } from "./Icones";
import { useAvisos, useFavoritos, useSessao } from "../lib/contextos";
import { CORTES, fundoDe, precoPix } from "../lib/dados";
import { reais, totalEstoque, ultimas } from "../lib/dinheiro";

export default function ProductCard({ produto: p, oculto = false }) {
  const { usuario } = useSessao();
  const favoritos = useFavoritos();
  const avisar = useAvisos();
  const ir = useNavigate();
  const esgotado = totalEstoque(p.stock) === 0;
  const poucas = ultimas(p.stock);
  const favorito = favoritos.tem(p.id);

  const curtir = async () => {
    if (!usuario) { avisar("Entre para guardar seus favoritos.", "erro"); return ir("/entrar", { state: { de: "/favoritos" } }); }
    try { const agora = await favoritos.alternar(p.id); avisar(agora ? `${p.name} nos favoritos.` : `${p.name} saiu dos favoritos.`); }
    catch (e) { avisar(e.message, "erro"); }
  };

  return (
    <article className={`cartao ${oculto ? "oculto" : ""} ${esgotado ? "esgotado" : ""}`} data-id={p.id}>
      <Link to={`/blusa/${p.id}`} className="cartao-link" data-cursor="Ver" aria-label={`${p.name}, ${reais(p.priceCents)}`}>
        <div className="cartao-arte" style={{ "--fundo": fundoDe(p.color) }}>
          <div className="zoom"><Camisa cor={p.color} design={p.design} corte={p.cut} titulo={`Blusa ${p.name}, estampa ${p.design}`} /></div>
          {esgotado && <span className="selo selo-fim">Esgotada</span>}
          {poucas > 0 && <span className="selo">Últimas {poucas}</span>}
        </div>
      </Link>
      <button className="fav" aria-pressed={favorito} aria-label={favorito ? `Tirar ${p.name} dos favoritos` : `Favoritar ${p.name}`} onClick={curtir}><Coracao /></button>
      <div className="cartao-info">
        <span className="num">Nº {String(p.id).padStart(2, "0")} · {CORTES[p.cut]}</span>
        <h3>{p.name}</h3>
        <span className="preco">{reais(p.priceCents)}</span>
        <div className="cartao-extra"><Estrelas nota={p.rating} /><small>{reais(precoPix(p.priceCents))} no PIX</small></div>
      </div>
    </article>
  );
}
