import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../lib/api";
import { useSessao } from "../lib/contextos";
import { reais } from "../lib/dinheiro";

const STATUS = { pending: "Aguardando pagamento", paid: "Pago", shipped: "Enviado", cancelled: "Cancelado" };
const data = (iso) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

export default function Pedidos() {
  const { usuario, pronto } = useSessao();
  const [pedidos, setPedidos] = useState(null);
  const [erro, setErro] = useState("");
  useEffect(() => { if (usuario) api("/orders").then(setPedidos).catch((e) => setErro(e.message)); }, [usuario]);

  if (!pronto) return <main className="vazio"><p>Carregando…</p></main>;
  if (!usuario) return <Navigate to="/entrar" state={{ de: "/pedidos" }} replace />;
  if (erro) return <main className="vazio"><p>{erro}</p></main>;
  if (!pedidos) return <main className="vazio" aria-busy="true"><p>Carregando…</p></main>;
  if (!pedidos.length) return <main className="vazio"><h1>Nenhum pedido ainda</h1><Link to="/" className="btn">Ver as camisas</Link></main>;

  return (
    <main className="pedidos">
      <h1>Meus pedidos</h1>
      {pedidos.map((o) => (
        <article key={o.id} className="pedido">
          <header>
            <div><span className="num">Pedido nº {o.id}</span><span className="mono">{data(o.createdAt)}</span></div>
            <span className={`status status-${o.status}`}>{STATUS[o.status]}</span>
          </header>
          <ul>
            {o.items.map((i, k) => (
              <li key={k}><span><i className="bolinha" style={{ background: i.color }} />{i.quantity}× {i.name} <small className="mono">({i.size})</small></span><span>{reais(i.unitPriceCents * i.quantity)}</span></li>
            ))}
          </ul>
          <footer><span>Total</span><strong>{reais(o.totalCents)}</strong></footer>
        </article>
      ))}
    </main>
  );
}
