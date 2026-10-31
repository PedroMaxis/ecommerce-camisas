import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Camisa from "../components/Camisa";
import { api } from "../lib/api";
import { useAvisos, useCarrinho, useSessao } from "../lib/contextos";
import { reais } from "../lib/dinheiro";

export default function Carrinho() {
  const { usuario, pronto } = useSessao();
  const { items, totalCents, definir, limpar } = useCarrinho();
  const [fechando, setFechando] = useState(false);
  const avisar = useAvisos();
  const ir = useNavigate();

  if (!pronto) return <main className="vazio"><p>Carregando…</p></main>;
  if (!usuario) return <Navigate to="/entrar" state={{ de: "/carrinho" }} replace />;

  const mudar = (i, q) => definir(i.productId, i.size, q).catch((e) => avisar(e.message, "erro"));
  const fechar = async () => {
    setFechando(true);
    try {
      const pedido = await api("/orders", { method: "POST", corpo: {} });
      limpar();
      avisar(`Pedido nº ${pedido.id} feito. Obrigado!`);
      ir("/pedidos");
    } catch (e) { avisar(e.message, "erro"); }
    finally { setFechando(false); }
  };

  if (!items.length) return <main className="vazio"><h1>Sua sacola está vazia</h1><p>Nada por aqui ainda.</p><Link to="/" className="btn">Ver as camisas</Link></main>;

  return (
    <main className="sacola">
      <h1>Sacola</h1>
      <ul className="linhas">
        {items.map((i) => (
          <li key={`${i.productId}-${i.size}`} className="linha">
            <div className="mini" style={{ "--fundo": i.color }}><Camisa cor={i.color} design={i.design} titulo="" /></div>
            <div className="linha-info">
              <Link to={`/camisa/${i.productId}`}><strong>{i.name}</strong></Link>
              <span className="mono">Tamanho {i.size} · {reais(i.unitPriceCents)}</span>
              {i.quantity > i.available && <span className="alerta">Só restam {i.available} no estoque. Ajuste a quantidade.</span>}
            </div>
            <div className="qtd" role="group" aria-label={`Quantidade de ${i.name}`}>
              <button onClick={() => mudar(i, i.quantity - 1)} aria-label="Diminuir">−</button>
              <output>{i.quantity}</output>
              <button onClick={() => mudar(i, i.quantity + 1)} disabled={i.quantity >= i.available} aria-label="Aumentar">+</button>
            </div>
            <span className="linha-total">{reais(i.lineTotalCents)}</span>
            <button className="link" onClick={() => mudar(i, 0)}>Remover</button>
          </li>
        ))}
      </ul>
      <div className="resumo">
        <div><span>Total</span><strong>{reais(totalCents)}</strong></div>
        <p className="mono">Frete e pagamento combinados depois do pedido.</p>
        <button className="btn grande" onClick={fechar} disabled={fechando || items.some((i) => i.quantity > i.available)}>{fechando ? "Fechando…" : "Fechar pedido"}</button>
      </div>
    </main>
  );
}
