import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Camisa from "../components/Camisa";
import Carregando from "../components/Carregando";
import Protegida from "../components/Protegida";
import { api } from "../lib/api";
import { STATUS, fundoDe } from "../lib/dados";
import { dataLonga, reais } from "../lib/dinheiro";
import { gsap, SEM_PREFERENCIA, useGSAP } from "../lib/gsap";

function Lista() {
  const [pedidos, setPedidos] = useState(null);
  const [erro, setErro] = useState("");
  const raiz = useRef(null);
  useEffect(() => { api("/orders").then(setPedidos).catch((e) => setErro(e.message)); }, []);

  useGSAP(() => {
    if (!pedidos?.length) return;
    const mm = gsap.matchMedia();
    mm.add(SEM_PREFERENCIA, () => { gsap.from(".titulo-pagina, .pedido", { y: 40, opacity: 0, duration: 0.7, stagger: 0.1, ease: "ginga" }); });
  }, { scope: raiz, dependencies: [pedidos?.length] });

  if (erro) return <div className="vazio"><p>{erro}</p></div>;
  if (!pedidos) return <Carregando />;
  if (!pedidos.length) return <div className="vazio"><h1>Nenhum pedido ainda</h1><p>Quando você comprar, ele aparece aqui.</p><Link to="/" className="btn">Ver as blusas</Link></div>;

  return (
    <main className="pagina" ref={raiz}>
      <h1 className="titulo-pagina">Meus pedidos</h1>
      {pedidos.map((o) => (
        <article key={o.id} className="pedido">
          <header>
            <div><Link to={`/pedidos/${o.id}`}><strong>Pedido nº {o.id}</strong></Link><span className="mono">{dataLonga(o.createdAt)}</span></div>
            <span className={`status status-${o.status}`}>{STATUS[o.status].nome}</span>
          </header>
          <ul>
            {o.items.map((i, k) => (
              <li key={k}><span><span className="miniatura" style={{ "--fundo": fundoDe(i.color) }}><Camisa cor={i.color} design={i.design} corte={i.cut} /></span>{i.quantity}× {i.name} <small>({i.size})</small></span><span className="mono">{reais(i.unitPriceCents * i.quantity)}</span></li>
            ))}
          </ul>
          <footer><Link className="btn pequeno azul" to={`/pedidos/${o.id}`}>Ver detalhes</Link><span><small>Total </small><strong>{reais(o.totalCents)}</strong></span></footer>
        </article>
      ))}
    </main>
  );
}
export default function Pedidos() { return <Protegida><Lista /></Protegida>; }
