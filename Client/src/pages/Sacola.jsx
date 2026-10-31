import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Camisa from "../components/Camisa";
import Frete from "../components/Frete";
import Protegida from "../components/Protegida";
import Valor from "../components/Valor";
import { api } from "../lib/api";
import { guardarCupom, lerCupom } from "../lib/compra";
import { useAvisos, useCarrinho } from "../lib/contextos";
import { FRETE_GRATIS, fundoDe } from "../lib/dados";
import { reais } from "../lib/dinheiro";
import { gsap, SEM_PREFERENCIA, useGSAP } from "../lib/gsap";

function ConteudoSacola() {
  const { items, totalCents, definir } = useCarrinho();
  const avisar = useAvisos();
  const raiz = useRef(null);
  const [codigo, setCodigo] = useState(lerCupom());
  const [cupom, setCupom] = useState(null);
  const [erroCupom, setErroCupom] = useState("");

  useGSAP(() => {
    if (!items.length) return; // sacola vazia não tem linhas para animar
    const mm = gsap.matchMedia();
    mm.add(SEM_PREFERENCIA, () => { gsap.from(".titulo-pagina, .linha, .resumo", { y: 40, opacity: 0, duration: 0.8, stagger: 0.09, ease: "ginga" }); });
  }, { scope: raiz, dependencies: [items.length > 0] });

  const mudar = (i, q) => definir(i.productId, i.size, q).catch((e) => avisar(e.message, "erro"));
  const aplicar = async (e) => {
    e.preventDefault();
    setErroCupom("");
    if (!codigo.trim()) { setCupom(null); guardarCupom(""); return; }
    try {
      const c = await api(`/coupons/${encodeURIComponent(codigo.trim())}?subtotal=${totalCents}`);
      setCupom(c); guardarCupom(c.code); setCodigo(c.code); avisar(`Cupom ${c.code} aplicado.`);
    } catch (err) { setCupom(null); guardarCupom(""); setErroCupom(err.message); }
  };

  if (!items.length) return <div className="vazio"><h1>Sua sacola está vazia</h1><p>Que tal começar pela estampa de que você mais gostou?</p><Link to="/" className="btn">Ver as blusas</Link></div>;

  const falta = Math.max(0, FRETE_GRATIS - totalCents);
  const desconto = cupom ? Math.floor((totalCents * cupom.percent) / 100) : 0;
  const temProblema = items.some((i) => i.quantity > i.available);

  return (
    <main className="pagina" ref={raiz}>
      <h1 className="titulo-pagina">Sacola</h1>
      <div className="duas-colunas">
        <div>
          <ul className="linhas">
            {items.map((i) => (
              <li key={`${i.productId}-${i.size}`} className="linha">
                <div className="mini" style={{ "--fundo": fundoDe(i.color) }}><Camisa cor={i.color} design={i.design} corte={i.cut} /></div>
                <div className="linha-info">
                  <Link to={`/blusa/${i.productId}`}><strong>{i.name}</strong></Link>
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
          <Frete subtotalCents={totalCents} cupom={cupom?.code ?? ""} />
        </div>
        <aside className="painel resumo">
          <h2 style={{ fontSize: "1.5rem" }}>Resumo</h2>
          {falta > 0 ? <p className="mono">Faltam {reais(falta)} para o frete econômico grátis.</p> : <p className="ok-msg">Frete econômico grátis!</p>}
          <form className="cupom" onSubmit={aplicar}>
            <label className="sr" htmlFor="cupom">Cupom</label>
            <input id="cupom" placeholder="Cupom de desconto" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} />
            <button className="btn pequeno amarelo">Aplicar</button>
          </form>
          {erroCupom && <p className="erro" role="alert">{erroCupom}</p>}
          {cupom && <p className="ok-msg">{cupom.description || `${cupom.percent}% de desconto`}</p>}
          <p className="cupons-dica">Experimente BEMVINDO10, CORRE20 ou FRETEBRASIL.</p>
          <dl>
            <div><dt>Subtotal</dt><dd>{reais(totalCents)}</dd></div>
            {desconto > 0 && <div className="desc-linha"><dt>Cupom {cupom.code}</dt><dd>− {reais(desconto)}</dd></div>}
            <div><dt>Frete</dt><dd>no checkout</dd></div>
            <div className="total"><dt>Total parcial</dt><dd><Valor centavos={totalCents - desconto} /></dd></div>
          </dl>
          <Link to="/checkout" className={`btn grande ${temProblema ? "desativado" : ""}`} aria-disabled={temProblema} onClick={(e) => temProblema && e.preventDefault()}>Ir para o checkout</Link>
        </aside>
      </div>
    </main>
  );
}

export default function Sacola() { return <Protegida><ConteudoSacola /></Protegida>; }
