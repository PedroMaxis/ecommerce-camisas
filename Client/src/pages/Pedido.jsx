import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Camisa from "../components/Camisa";
import Carregando from "../components/Carregando";
import Protegida from "../components/Protegida";
import { api } from "../lib/api";
import { useAvisos } from "../lib/contextos";
import { PAGAMENTOS, STATUS, fundoDe } from "../lib/dados";
import { dataHora, mascararCep, reais } from "../lib/dinheiro";
import { confete, gsap, SEM_PREFERENCIA, useGSAP } from "../lib/gsap";

const ETAPAS = ["pending", "paid", "shipped", "delivered"];
const ROTULO_ETAPA = { pending: "Pedido feito", paid: "Pago", shipped: "Enviado", delivered: "Entregue" };

function Detalhe() {
  const { id } = useParams();
  const { state } = useLocation();
  const [o, setO] = useState(null);
  const [erro, setErro] = useState("");
  const [agindo, setAgindo] = useState(false);
  const avisar = useAvisos();
  const raiz = useRef(null);
  const festejou = useRef(false);

  useEffect(() => { api(`/orders/${id}`).then(setO).catch((e) => setErro(e.message)); }, [id]);

  useGSAP(() => {
    if (!o) return;
    const mm = gsap.matchMedia();
    mm.add(SEM_PREFERENCIA, () => {
      const t = gsap.timeline({ defaults: { ease: "ginga" } });
      if (state?.novo) {
        // pedido recém-fechado: o selo de confirmação aparece e o visto é desenhado (DrawSVG)
        t.from(".confirma", { y: -40, opacity: 0, duration: 0.8 }).from(".confirma circle", { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)" }, 0.2)
          .fromTo(".confirma path", { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.6, ease: "power2.out" }, 0.45);
      }
      t.from(".pedido-det > *", { y: 30, opacity: 0, duration: 0.7, stagger: 0.08 }, 0.3);
    });
    // pedido recém-fechado: chuva de confete nas cores da bandeira (Physics2D)
    if (state?.novo && !festejou.current) { festejou.current = true; confete(window.innerWidth / 2, window.innerHeight * 0.35); }
  }, { scope: raiz, dependencies: [o?.id] });

  if (erro) return <div className="vazio"><h1>Eita!</h1><p>{erro}</p><Link to="/pedidos" className="btn">Meus pedidos</Link></div>;
  if (!o) return <Carregando />;

  const acao = async (caminho, msg) => {
    setAgindo(true);
    try { setO(await api(`/orders/${o.id}/${caminho}`, { method: "POST", corpo: {} })); avisar(msg); }
    catch (e) { avisar(e.message, "erro"); }
    finally { setAgindo(false); }
  };
  const copiar = async () => { try { await navigator.clipboard.writeText(`GINGA-PIX-SIMULADO-${o.id}`); avisar("Código copiado."); } catch { avisar("Não consegui copiar, selecione o texto.", "erro"); } };

  const etapa = ETAPAS.indexOf(o.status);
  const pagamento = PAGAMENTOS.find((p) => p.id === o.payment);
  const a = o.address;

  return (
    <main className="pagina" ref={raiz}>
      <Link to="/pedidos" className="voltar">← Meus pedidos</Link>
      {state?.novo && (
        <div className="confirma">
          <svg viewBox="0 0 54 54" aria-hidden="true"><circle cx="27" cy="27" r="24" /><path d="M16 28l8 8 15-17" /></svg>
          <div><strong>Pedido feito!</strong><span>Obrigado pela compra, é nosso nº {o.id}. Falta só o pagamento.</span></div>
        </div>
      )}
      <div className="pedido-det">
        <h1 className="titulo-pagina" style={{ marginTop: 10 }}>Pedido nº {o.id}</h1>
        <p><span className={`status status-${o.status}`}>{STATUS[o.status].nome}</span> <span className="mono">feito em {dataHora(o.createdAt)}</span></p>

        {o.status !== "cancelled" && (
          <ol className="linha-tempo" aria-label="Andamento do pedido">
            {ETAPAS.map((s, i) => <li key={s} className={i <= etapa ? "feito" : ""} aria-current={i === etapa ? "step" : undefined}>{ROTULO_ETAPA[s]}</li>)}
          </ol>
        )}

        {o.status === "pending" && (
          <div className="pix-caixa">
            <strong>Pagamento por {pagamento?.nome} · {reais(o.totalCents)}</strong>
            {o.payment === "pix" && <><code>GINGA-PIX-SIMULADO-{o.id}</code><button className="btn pequeno amarelo" onClick={copiar} style={{ justifySelf: "start" }}>Copiar código</button></>}
            {o.payment === "boleto" && <code>34191.79001 01043.510047 91020.150008 1 00000000{String(o.totalCents).padStart(6, "0")}</code>}
            {o.payment === "cartao" && <span>Cartão em até 3x sem juros no gateway (simulado).</span>}
            <span className="mono">Projeto de estudo: o botão abaixo faz de conta que o pagamento caiu.</span>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" disabled={agindo} onClick={() => acao("pay", "Pagamento confirmado!")}>Simular pagamento</button>
              <button className="btn vazado" disabled={agindo} onClick={() => confirm("Cancelar este pedido?") && acao("cancel", "Pedido cancelado.")}>Cancelar pedido</button>
            </div>
          </div>
        )}

        <div className="duas-colunas" style={{ marginTop: 26 }}>
          <div className="pedido" style={{ margin: 0 }}>
            <ul>
              {o.items.map((i, k) => (
                <li key={k}>
                  <span><span className="miniatura" style={{ "--fundo": fundoDe(i.color) }}><Camisa cor={i.color} design={i.design} corte={i.cut} /></span>
                    <span><Link to={`/blusa/${i.productId}`}><strong>{i.name}</strong></Link><br /><small>{i.quantity}× · tamanho {i.size}</small></span></span>
                  <span className="mono">{reais(i.unitPriceCents * i.quantity)}</span>
                </li>
              ))}
            </ul>
            {(o.status === "paid" || o.status === "shipped" || o.status === "delivered") && <footer><span className="mono">Comprou? Conte como ficou na página de cada blusa.</span></footer>}
          </div>
          <div style={{ display: "grid", gap: 16 }}>
            <section className="painel resumo" style={{ position: "static" }}>
              <h2 style={{ fontSize: "1.3rem" }}>Valores</h2>
              <dl>
                <div><dt>Subtotal</dt><dd>{reais(o.subtotalCents)}</dd></div>
                {o.discountCents > 0 && <div className="desc-linha"><dt>Cupom {o.coupon}</dt><dd>− {reais(o.discountCents)}</dd></div>}
                {o.pixDiscountCents > 0 && <div className="desc-linha"><dt>PIX</dt><dd>− {reais(o.pixDiscountCents)}</dd></div>}
                <div><dt>Frete ({o.shippingMethod})</dt><dd>{o.shippingCents ? reais(o.shippingCents) : "Grátis"}</dd></div>
                <div className="total"><dt>Total</dt><dd>{reais(o.totalCents)}</dd></div>
              </dl>
            </section>
            <section className="painel">
              <h2 style={{ fontSize: "1.3rem", marginBottom: 8 }}>Entrega</h2>
              <p style={{ margin: 0 }}>{a.name}<br />{a.street}, {a.number}{a.complement ? ` · ${a.complement}` : ""}<br />{a.district} · {a.city}/{a.state}<br />CEP {mascararCep(a.cep)}</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
export default function Pedido() { return <Protegida><Detalhe /></Protegida>; }
