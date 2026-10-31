import { useState } from "react";
import { api } from "../lib/api";
import { mascararCep, reais } from "../lib/dinheiro";

/** Calculadora de frete por CEP (usada na página da blusa e na sacola) */
export default function Frete({ subtotalCents = 0, cupom = "" }) {
  const [cep, setCep] = useState("");
  const [res, setRes] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const calcular = async (e) => {
    e.preventDefault();
    setErro(""); setRes(null); setCarregando(true);
    try {
      const q = new URLSearchParams({ cep, subtotal: String(subtotalCents), ...(cupom ? { coupon: cupom } : {}) });
      setRes(await api(`/shipping?${q}`));
    } catch (err) { setErro(err.message); }
    finally { setCarregando(false); }
  };

  return (
    <div className="cep-calc">
      <strong>Calcular frete e prazo</strong>
      <form onSubmit={calcular}>
        <label className="sr" htmlFor="cep-calc">CEP</label>
        <input id="cep-calc" inputMode="numeric" placeholder="00000-000" value={cep} onChange={(e) => setCep(mascararCep(e.target.value))} autoComplete="postal-code" />
        <button className="btn pequeno amarelo" disabled={carregando}>{carregando ? "…" : "Calcular"}</button>
      </form>
      {erro && <p className="erro" role="alert">{erro}</p>}
      {res && (
        <>
          <ul className="opcoes-frete" aria-live="polite">
            {res.opcoes.map((o) => <li key={o.id}><span>{o.nome} · {o.dias} {o.dias === 1 ? "dia útil" : "dias úteis"}</span><strong>{o.cents === 0 ? "Grátis" : reais(o.cents)}</strong></li>)}
          </ul>
          <small>Entrega para {res.regiao}. Frete econômico grátis a partir de {reais(res.gratisAPartirDe)}.</small>
        </>
      )}
    </div>
  );
}
