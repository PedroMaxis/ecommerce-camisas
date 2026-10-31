import { useCallback, useEffect, useRef, useState } from "react";
import Carregando from "../components/Carregando";
import Protegida from "../components/Protegida";
import { api } from "../lib/api";
import { useAvisos, useCatalogo } from "../lib/contextos";
import { CATEGORIAS, CORTES, STATUS, TAMANHOS } from "../lib/dados";
import { dataHora, reais } from "../lib/dinheiro";
import { gsap, SEM_PREFERENCIA, useGSAP } from "../lib/gsap";

const DESENHOS = ["lisa", "ginga", "pelada", "copacabana", "caju", "sol", "bonfim", "carnaval", "azulejo", "arara", "cobogo", "saudade"];

function Resumo() {
  const [r, setR] = useState(null);
  useEffect(() => { api("/admin/summary").then(setR); }, []);
  if (!r) return <Carregando />;
  return (
    <>
      <div className="cards-resumo">
        <div className="card-resumo"><span className="mono">Faturado</span><b>{reais(r.revenueCents)}</b></div>
        {Object.entries(STATUS).map(([k, v]) => <div className="card-resumo" key={k}><span className="mono">{v.nome}</span><b>{r.ordersByStatus[k] ?? 0}</b></div>)}
        <div className="card-resumo"><span className="mono">Clientes</span><b>{r.customers}</b></div>
        <div className="card-resumo"><span className="mono">Newsletter</span><b>{r.subscribers}</b></div>
        <div className="card-resumo"><span className="mono">Mensagens</span><b>{r.messages}</b></div>
      </div>
      <h2 style={{ fontSize: "1.5rem", marginBottom: 12 }}>Estoque baixo (2 ou menos)</h2>
      {r.lowStock.length === 0 ? <p className="mono">Nada acabando.</p> : (
        <div className="tabela-rolar"><table className="tabela"><thead><tr><th>Blusa</th><th>Tamanho</th><th>Restam</th></tr></thead>
          <tbody>{r.lowStock.map((l, i) => <tr key={i}><td>{l.name}</td><td>{l.size}</td><td>{l.quantity}</td></tr>)}</tbody></table></div>
      )}
    </>
  );
}

function Pedidos() {
  const [lista, setLista] = useState(null);
  const avisar = useAvisos();
  const carregar = useCallback(() => api("/admin/orders").then(setLista), []);
  useEffect(() => { carregar(); }, [carregar]);
  if (!lista) return <Carregando />;
  const mudar = async (id, status) => {
    try { await api(`/admin/orders/${id}`, { method: "PATCH", corpo: { status } }); avisar(`Pedido ${id}: ${STATUS[status].nome}.`); carregar(); }
    catch (e) { avisar(e.message, "erro"); }
  };
  if (!lista.length) return <p className="mono">Nenhum pedido ainda.</p>;
  return (
    <div className="tabela-rolar"><table className="tabela">
      <thead><tr><th>Nº</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Pagamento</th><th>Status</th><th>Ação</th></tr></thead>
      <tbody>{lista.map((o) => (
        <tr key={o.id}>
          <td>{o.id}<br /><small>{dataHora(o.createdAt)}</small></td>
          <td>{o.customer.name}<br /><small>{o.customer.email}</small></td>
          <td>{o.items.map((i) => `${i.quantity}× ${i.name} (${i.size})`).join(", ")}</td>
          <td>{reais(o.totalCents)}</td>
          <td>{o.payment}</td>
          <td><span className={`status status-${o.status}`}>{STATUS[o.status].nome}</span></td>
          <td>{o.next.map((s) => <button key={s} className={`btn pequeno ${s === "cancelled" ? "vazado" : ""}`} style={{ marginRight: 6 }} onClick={() => mudar(o.id, s)}>{STATUS[s].nome}</button>)}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

function LinhaProduto({ p, aoSalvar }) {
  const avisar = useAvisos();
  const [preco, setPreco] = useState((p.priceCents / 100).toFixed(2));
  const [estoque, setEstoque] = useState(p.stock);
  const salvar = async () => {
    try { await api(`/products/${p.id}`, { method: "PATCH", corpo: { price: Number(preco), stock: estoque } }); avisar(`${p.name} atualizada.`); aoSalvar(); }
    catch (e) { avisar(e.message, "erro"); }
  };
  const alternar = async () => {
    try { await api(`/products/${p.id}`, { method: "PATCH", corpo: { active: !p.active } }); avisar(p.active ? `${p.name} escondida da loja.` : `${p.name} voltou à loja.`); aoSalvar(); }
    catch (e) { avisar(e.message, "erro"); }
  };
  return (
    <tr style={{ opacity: p.active ? 1 : 0.5 }}>
      <td><strong>{p.name}</strong><br /><small>{CORTES[p.cut]} · {p.category}</small></td>
      <td><input style={{ width: 96 }} inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} aria-label={`Preço de ${p.name}`} /></td>
      <td><div className="admin-linha-estoque">{TAMANHOS.map((t) => <label key={t}><small>{t}</small><input inputMode="numeric" value={estoque[t] ?? 0} onChange={(e) => setEstoque((s) => ({ ...s, [t]: Number(e.target.value.replace(/\D/g, "")) }))} aria-label={`Estoque ${t} de ${p.name}`} /></label>)}</div></td>
      <td style={{ whiteSpace: "nowrap" }}><button className="btn pequeno" onClick={salvar}>Salvar</button> <button className="btn pequeno vazado" onClick={alternar}>{p.active ? "Esconder" : "Mostrar"}</button></td>
    </tr>
  );
}

function Produtos() {
  const [lista, setLista] = useState(null);
  const [novo, setNovo] = useState({ name: "", description: "", price: "", color: "#009739", design: "lisa", cut: "camiseta", category: "raiz" });
  const [erro, setErro] = useState("");
  const avisar = useAvisos();
  const { recarregar } = useCatalogo();
  const carregar = useCallback(() => api("/admin/products").then(setLista), []);
  useEffect(() => { carregar(); }, [carregar]);
  const salvou = () => { carregar(); recarregar(); };
  if (!lista) return <Carregando />;

  const criar = async (e) => {
    e.preventDefault(); setErro("");
    try { await api("/products", { method: "POST", corpo: { ...novo, price: Number(novo.price), stock: Object.fromEntries(TAMANHOS.map((t) => [t, 5])) } }); avisar("Blusa criada com 5 em cada tamanho."); setNovo({ ...novo, name: "", description: "", price: "" }); salvou(); }
    catch (err) { setErro(err.message); }
  };
  const muda = (k) => (e) => setNovo((n) => ({ ...n, [k]: e.target.value }));
  return (
    <>
      <div className="tabela-rolar"><table className="tabela"><thead><tr><th>Blusa</th><th>Preço (R$)</th><th>Estoque por tamanho</th><th /></tr></thead>
        <tbody>{lista.map((p) => <LinhaProduto key={`${p.id}-${p.priceCents}-${p.active}`} p={p} aoSalvar={salvou} />)}</tbody></table></div>
      <form className="painel" onSubmit={criar} style={{ marginTop: 30, display: "grid", gap: 12 }}>
        <h2 style={{ fontSize: "1.4rem" }}>Nova blusa</h2>
        <div className="grade-form">
          <label className="c3">Nome<input value={novo.name} onChange={muda("name")} required /></label>
          <label className="c3">Preço (R$)<input value={novo.price} onChange={muda("price")} inputMode="decimal" required /></label>
          <label className="c6">Descrição<input value={novo.description} onChange={muda("description")} required /></label>
          <label className="c2">Cor do tecido<input type="color" value={novo.color} onChange={muda("color")} style={{ padding: 4, height: 46 }} /></label>
          <label className="c2">Estampa<select value={novo.design} onChange={muda("design")}>{DESENHOS.map((d) => <option key={d}>{d}</option>)}</select></label>
          <label className="c2">Corte<select value={novo.cut} onChange={muda("cut")}>{Object.entries(CORTES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="c3">Categoria<select value={novo.category} onChange={muda("category")}>{CATEGORIAS.filter((c) => c.id !== "todas").map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
        </div>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="btn" style={{ justifySelf: "start" }}>Criar blusa</button>
      </form>
    </>
  );
}

function Mensagens() {
  const [lista, setLista] = useState(null);
  useEffect(() => { api("/admin/messages").then(setLista); }, []);
  if (!lista) return <Carregando />;
  if (!lista.length) return <p className="mono">Nenhuma mensagem.</p>;
  return <div style={{ display: "grid", gap: 14 }}>{lista.map((m) => <article className="resenha" key={m.id}><header><strong>{m.subject}</strong><span className="mono">{dataHora(m.createdAt)}</span></header><p className="mono">{m.name} · {m.email}</p><p>{m.body}</p></article>)}</div>;
}

function Painel() {
  const [aba, setAba] = useState("resumo");
  const raiz = useRef(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(SEM_PREFERENCIA, () => { gsap.from(".titulo-pagina, .abas .chip", { y: 30, opacity: 0, duration: 0.6, stagger: 0.06, ease: "ginga" }); });
  }, { scope: raiz });
  const abas = { resumo: ["Resumo", Resumo], pedidos: ["Pedidos", Pedidos], produtos: ["Produtos", Produtos], mensagens: ["Mensagens", Mensagens] };
  const Atual = abas[aba][1];
  return (
    <main className="pagina" ref={raiz}>
      <h1 className="titulo-pagina">Painel</h1>
      <div className="abas">{Object.entries(abas).map(([id, [nome]]) => <button key={id} className="chip" aria-pressed={aba === id} onClick={() => setAba(id)}>{nome}</button>)}</div>
      <Atual />
    </main>
  );
}
export default function Admin() { return <Protegida admin><Painel /></Protegida>; }
