import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Protegida from "../components/Protegida";
import Valor from "../components/Valor";
import { api } from "../lib/api";
import { guardarCupom, lerCupom } from "../lib/compra";
import { useAvisos, useCarrinho, useSessao } from "../lib/contextos";
import { ESTADOS, PAGAMENTOS } from "../lib/dados";
import { mascararCep, reais } from "../lib/dinheiro";
import { gsap, SEM_PREFERENCIA, useGSAP } from "../lib/gsap";

function ConteudoCheckout() {
  const { usuario } = useSessao();
  const { items, limpar } = useCarrinho();
  const avisar = useAvisos();
  const ir = useNavigate();
  const raiz = useRef(null);
  const [end, setEnd] = useState({ name: usuario?.name ?? "", cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" });
  const [envio, setEnvio] = useState("economico");
  const [pagamento, setPagamento] = useState("pix");
  const [cupom, setCupom] = useState(lerCupom());
  const [opcoes, setOpcoes] = useState(null);
  const [totais, setTotais] = useState(null);
  const [erro, setErro] = useState("");
  const [erroCupom, setErroCupom] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const cepLimpo = end.cep.replace(/\D/g, "");

  useGSAP(() => {
    if (!items.length) return;
    const mm = gsap.matchMedia();
    mm.add(SEM_PREFERENCIA, () => { gsap.from(".titulo-pagina, .bloco, .resumo", { y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: "ginga" }); });
  }, { scope: raiz, dependencies: [items.length > 0] });

  const muda = (k) => (e) => setEnd((a) => ({ ...a, [k]: e.target.value }));

  // CEP completo → preenche rua, bairro, cidade e estado pelo ViaCEP (se falhar, a pessoa digita) e calcula o frete
  useEffect(() => {
    if (cepLimpo.length !== 8) { setOpcoes(null); return; }
    let vivo = true;
    setBuscando(true);
    fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`).then((r) => r.json()).then((d) => {
      if (vivo && !d.erro) setEnd((a) => ({ ...a, street: a.street || d.logradouro || "", district: a.district || d.bairro || "", city: d.localidade || a.city, state: d.uf || a.state }));
    }).catch(() => {}).finally(() => vivo && setBuscando(false));
    return () => { vivo = false; };
  }, [cepLimpo]);

  const subtotal = items.reduce((s, i) => s + i.lineTotalCents, 0);
  useEffect(() => {
    if (cepLimpo.length !== 8) return;
    let vivo = true;
    const q = new URLSearchParams({ cep: cepLimpo, subtotal: String(subtotal), ...(cupom ? { coupon: cupom } : {}) });
    api(`/shipping?${q}`).then((r) => vivo && setOpcoes(r)).catch(() => vivo && setOpcoes(null));
    return () => { vivo = false; };
  }, [cepLimpo, subtotal, cupom]);

  // totais vêm sempre do servidor (mesma conta do pedido real)
  useEffect(() => {
    if (cepLimpo.length !== 8 || !items.length) { setTotais(null); return; }
    let vivo = true;
    api("/orders/preview", { method: "POST", corpo: { cep: cepLimpo, payment: pagamento, shipping: envio, coupon: cupom || undefined } })
      .then((t) => { if (vivo) { setTotais(t); setErroCupom(""); } })
      .catch((e) => { if (vivo) { setTotais(null); if (cupom) { setErroCupom(e.message); } } });
    return () => { vivo = false; };
  }, [cepLimpo, pagamento, envio, cupom, items.length, subtotal]);

  if (!items.length) return <div className="vazio"><h1>Nada para fechar</h1><p>Sua sacola está vazia.</p><Link to="/" className="btn">Ver as blusas</Link></div>;

  const fechar = async (e) => {
    e.preventDefault();
    setErro(""); setEnviando(true);
    try {
      const pedido = await api("/orders", { method: "POST", corpo: { address: end, payment: pagamento, shipping: envio, coupon: cupom || undefined } });
      limpar(); guardarCupom("");
      ir(`/pedidos/${pedido.id}`, { state: { novo: true } });
    } catch (err) {
      setErro(err.message); avisar(err.message, "erro");
      gsap.fromTo(".resumo", { x: 0 }, { x: 12, duration: 0.7, ease: "tremor" });
    } finally { setEnviando(false); }
  };

  return (
    <main className="pagina" ref={raiz}>
      <h1 className="titulo-pagina">Checkout</h1>
      <form className="duas-colunas" onSubmit={fechar}>
        <div>
          <section className="bloco">
            <h2><span>1</span> Entrega</h2>
            <div className="grade-form">
              <label className="c4">Nome de quem recebe<input value={end.name} onChange={muda("name")} required autoComplete="name" /></label>
              <label className="c2">CEP<input value={end.cep} onChange={(e) => setEnd((a) => ({ ...a, cep: mascararCep(e.target.value) }))} inputMode="numeric" placeholder="00000-000" required autoComplete="postal-code" /><small>{buscando ? "Buscando endereço…" : "Preenchemos o resto para você"}</small></label>
              <label className="c4">Rua<input value={end.street} onChange={muda("street")} required autoComplete="address-line1" /></label>
              <label className="c2">Número<input value={end.number} onChange={muda("number")} required /></label>
              <label className="c3">Complemento<input value={end.complement} onChange={muda("complement")} autoComplete="address-line2" placeholder="Apto, bloco… (opcional)" /></label>
              <label className="c3">Bairro<input value={end.district} onChange={muda("district")} required /></label>
              <label className="c4">Cidade<input value={end.city} onChange={muda("city")} required autoComplete="address-level2" /></label>
              <label className="c2">Estado<select value={end.state} onChange={muda("state")} required><option value="">UF</option>{ESTADOS.map((u) => <option key={u}>{u}</option>)}</select></label>
            </div>
          </section>

          <section className="bloco">
            <h2><span>2</span> Envio</h2>
            {!opcoes && <p className="mono">Informe o CEP para ver prazos e valores.</p>}
            {opcoes?.opcoes.map((o) => (
              <label key={o.id} className="opcao">
                <input type="radio" name="envio" checked={envio === o.id} onChange={() => setEnvio(o.id)} />
                <span>{o.nome}</span><span className="valor">{o.cents === 0 ? "Grátis" : reais(o.cents)}</span>
                <small>{o.dias} {o.dias === 1 ? "dia útil" : "dias úteis"} · {opcoes.regiao}</small>
              </label>
            ))}
          </section>

          <section className="bloco">
            <h2><span>3</span> Pagamento</h2>
            {PAGAMENTOS.map((m) => (
              <label key={m.id} className="opcao">
                <input type="radio" name="pag" checked={pagamento === m.id} onChange={() => setPagamento(m.id)} />
                <span>{m.nome}</span><span className="valor">{m.id === "pix" ? "−5%" : ""}</span>
                <small>{m.dica}</small>
              </label>
            ))}
            <p className="mono" style={{ marginTop: 10 }}>Projeto de estudo: o pagamento é simulado na próxima tela.</p>
          </section>
        </div>

        <aside className="painel resumo">
          <h2 style={{ fontSize: "1.5rem" }}>Seu pedido</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {items.map((i) => <li key={`${i.productId}-${i.size}`} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span>{i.quantity}× {i.name} <small>({i.size})</small></span><span className="mono">{reais(i.lineTotalCents)}</span></li>)}
          </ul>
          <label>Cupom<input value={cupom} onChange={(e) => setCupom(e.target.value.toUpperCase().trim())} placeholder="Opcional" /></label>
          {erroCupom && <p className="erro" role="alert">{erroCupom}</p>}
          <dl>
            <div><dt>Subtotal</dt><dd>{reais(subtotal)}</dd></div>
            {totais?.discountCents > 0 && <div className="desc-linha"><dt>Cupom</dt><dd>− {reais(totais.discountCents)}</dd></div>}
            {totais?.pixDiscountCents > 0 && <div className="desc-linha"><dt>PIX (5%)</dt><dd>− {reais(totais.pixDiscountCents)}</dd></div>}
            <div><dt>Frete</dt><dd>{totais ? (totais.shippingCents === 0 ? "Grátis" : reais(totais.shippingCents)) : "—"}</dd></div>
            <div className="total"><dt>Total</dt><dd>{totais ? <Valor centavos={totais.totalCents} /> : "—"}</dd></div>
          </dl>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <button className="btn grande" disabled={enviando || !totais}>{enviando ? "Fechando…" : "Fechar pedido"}</button>
        </aside>
      </form>
    </main>
  );
}

export default function Checkout() { return <Protegida><ConteudoCheckout /></Protegida>; }
