import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Camisa from "../components/Camisa";
import Carregando from "../components/Carregando";
import Estrelas from "../components/Estrelas";
import Frete from "../components/Frete";
import { Coracao, Estrela } from "../components/Icones";
import Modal from "../components/Modal";
import ProductCard from "../components/ProductCard";
import { api } from "../lib/api";
import { useAvisos, useCarrinho, useCatalogo, useFavoritos, useSessao } from "../lib/contextos";
import { CATEGORIAS, CORTES, MEDIDAS, TAMANHOS, fundoDe, precoPix } from "../lib/dados";
import { dataLonga, reais } from "../lib/dinheiro";
import { gsap, PONTEIRO_FINO, ScrollTrigger, SEM_PREFERENCIA, SplitText, useGSAP, voarParaSacola } from "../lib/gsap";

function FormAvaliar({ produtoId, aoEnviar }) {
  const [nota, setNota] = useState(0);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const enviar = async (e) => {
    e.preventDefault();
    if (!nota) { setErro("Escolha de 1 a 5 estrelas."); return; }
    setErro(""); setEnviando(true);
    try { await api(`/products/${produtoId}/reviews`, { method: "POST", corpo: { rating: nota, body: texto } }); setTexto(""); setNota(0); aoEnviar(); }
    catch (err) { setErro(err.message); }
    finally { setEnviando(false); }
  };
  return (
    <form className="painel form-avaliar" onSubmit={enviar}>
      <strong>Já usou? Conte como ficou.</strong>
      <fieldset className="estrelas-input" aria-label="Sua nota">
        {[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} className={n <= nota ? "on" : ""} onClick={() => setNota(n)} aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`} aria-pressed={n === nota}><Estrela /></button>)}
      </fieldset>
      <label>Comentário<textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Caimento, tecido, cor…" required minLength={3} /></label>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <button className="btn" disabled={enviando}>{enviando ? "Enviando…" : "Publicar avaliação"}</button>
    </form>
  );
}

export default function Produto() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [erro, setErro] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [medidas, setMedidas] = useState(false);
  const [resenhas, setResenhas] = useState([]);
  const { usuario } = useSessao();
  const { adicionar } = useCarrinho();
  const favoritos = useFavoritos();
  const { produtos } = useCatalogo();
  const avisar = useAvisos();
  const ir = useNavigate();
  const raiz = useRef(null);
  const arte = useRef(null);

  const carregar = useCallback(() => api(`/products/${id}`).then(setP).catch((e) => setErro(e.status === 404 ? "Essa blusa não existe (ou já saiu de linha)." : e.message)), [id]);
  useEffect(() => { setP(null); setErro(""); setTamanho(""); carregar(); api(`/products/${id}/reviews`).then(setResenhas).catch(() => {}); }, [id, carregar]);

  // entrada: a arte se revela, o nome sobe letra por letra, o resto escalona; no desktop a blusa flutua com o mouse
  useGSAP(() => {
    if (!p) return;
    const mm = gsap.matchMedia();
    mm.add(SEM_PREFERENCIA, () => {
      const nome = SplitText.create(".produto-info h1", { type: "words,chars", mask: "chars" });
      gsap.timeline({ defaults: { ease: "ginga" } })
        .from(".produto-arte", { clipPath: "inset(100% 0% 0% 0%)", duration: 1.1 })
        .from(".produto-arte svg", { scale: 1.4, rotation: -8, duration: 1.4 }, "<")
        .from(nome.chars, { yPercent: 115, duration: 0.8, stagger: 0.025 }, "-=0.8")
        .from(".produto-info > :not(h1)", { y: 30, opacity: 0, duration: 0.7, stagger: 0.07 }, "-=0.6")
        .from(".tam", { scale: 0.5, opacity: 0, duration: 0.5, stagger: 0.05, ease: "back.out(2.2)" }, "-=0.6");
      gsap.from(".secao", { y: 60, opacity: 0, duration: 0.9, ease: "ginga", stagger: 0.15, scrollTrigger: { trigger: ".secao", start: "top 90%" } });
    });
    mm.add(`${PONTEIRO_FINO} and ${SEM_PREFERENCIA}`, () => {
      const caixa = arte.current;
      const rx = gsap.quickTo(caixa.querySelector("svg"), "rotationY", { duration: 0.6, ease: "power3" }), ry = gsap.quickTo(caixa.querySelector("svg"), "rotationX", { duration: 0.6, ease: "power3" });
      gsap.set(caixa.querySelector("svg"), { transformPerspective: 900 });
      const mexe = (e) => { const r = caixa.getBoundingClientRect(); rx(((e.clientX - r.left) / r.width - 0.5) * 24); ry(-((e.clientY - r.top) / r.height - 0.5) * 18); };
      const sai = () => { rx(0); ry(0); };
      caixa.addEventListener("pointermove", mexe); caixa.addEventListener("pointerleave", sai);
      return () => { caixa.removeEventListener("pointermove", mexe); caixa.removeEventListener("pointerleave", sai); };
    });
    return () => ScrollTrigger.refresh();
  }, { scope: raiz, dependencies: [p?.id] });

  if (erro) return <div className="vazio"><h1>Eita!</h1><p>{erro}</p><Link to="/" className="btn">Ver todas as blusas</Link></div>;
  if (!p) return <Carregando />;

  const comprar = async () => {
    if (!usuario) return ir("/entrar", { state: { de: `/blusa/${p.id}` } });
    if (!tamanho) {
      avisar("Escolha um tamanho primeiro.", "erro");
      gsap.fromTo(".tamanhos", { x: 0 }, { x: 14, duration: 0.7, ease: "tremor" }); // sacudida (CustomWiggle)
      return;
    }
    setEnviando(true);
    try {
      await adicionar(p.id, tamanho);
      voarParaSacola(arte.current?.querySelector("svg"));
      avisar(`${p.name} (${tamanho}) na sacola.`);
    } catch (e) { avisar(e.message, "erro"); }
    finally { setEnviando(false); }
  };

  const curtir = async () => {
    if (!usuario) return ir("/entrar", { state: { de: `/blusa/${p.id}` } });
    try { const agora = await favoritos.alternar(p.id); avisar(agora ? "Nos favoritos." : "Saiu dos favoritos."); } catch (e) { avisar(e.message, "erro"); }
  };

  const relacionados = (produtos ?? []).filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  const categoria = CATEGORIAS.find((c) => c.id === p.category)?.nome;

  return (
    <main className="pagina produto" ref={raiz}>
      <Link to="/" className="voltar">← Todas as blusas</Link>
      <div className="produto-grade">
        <div className="produto-arte" ref={arte} style={{ "--fundo": fundoDe(p.color) }}>
          <Camisa cor={p.color} design={p.design} corte={p.cut} titulo={`Blusa ${p.name}`} />
        </div>
        <div className="produto-info">
          <span className="num">Nº {String(p.id).padStart(2, "0")}</span>
          <h1>{p.name}</h1>
          <div className="produto-meta"><span className="tag">{categoria}</span><span className="tag">{CORTES[p.cut]}</span><Estrelas nota={p.rating} /></div>
          <p className="preco grande">{reais(p.priceCents)}</p>
          <p className="pix-nota">{reais(precoPix(p.priceCents))} no PIX (5% off)</p>
          <p className="desc">{p.description}</p>
          {p.story && <blockquote className="historia">{p.story}</blockquote>}

          <fieldset className="tamanhos">
            <legend>Tamanho</legend>
            {TAMANHOS.map((t) => {
              const q = p.stock[t] ?? 0;
              return (
                <label key={t} className={`tam ${q === 0 ? "sem" : ""} ${tamanho === t ? "on" : ""}`}>
                  <input type="radio" name="tam" value={t} disabled={q === 0} checked={tamanho === t} onChange={() => setTamanho(t)} />
                  {t}
                  {q > 0 && q <= 3 && <small>{q === 1 ? "última" : `${q} restam`}</small>}
                </label>
              );
            })}
          </fieldset>
          <button className="link guia" onClick={() => setMedidas(true)}>📏 Guia de medidas</button>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn grande" onClick={comprar} disabled={enviando}>{usuario ? (enviando ? "Adicionando…" : "Pôr na sacola") : "Entrar para comprar"}</button>
            <button className="acao fav-produto" style={{ border: "2.5px solid var(--tinta)", width: 58, height: 58, flex: "none", background: favoritos.tem(p.id) ? "var(--coral)" : "#fffdf3", color: favoritos.tem(p.id) ? "#fff" : "inherit" }} aria-pressed={favoritos.tem(p.id)} aria-label="Favoritar" onClick={curtir}><Coracao style={{ fill: favoritos.tem(p.id) ? "currentColor" : "none" }} /></button>
          </div>
          <Frete subtotalCents={p.priceCents} />
        </div>
      </div>

      <section className="secao" aria-labelledby="aval">
        <h2 id="aval">O que dizem</h2>
        <div className="avaliacoes">
          <div className="resenhas">
            {resenhas.length === 0 && <p className="mono">Ninguém avaliou ainda. Quem comprar pode ser o primeiro.</p>}
            {resenhas.map((r) => (
              <article className="resenha" key={r.id}>
                <header><strong>{r.author}</strong><span className="mono">{dataLonga(r.createdAt)}</span></header>
                <Estrelas nota={{ avg: r.rating, count: 1 }} />
                <p>{r.body}</p>
              </article>
            ))}
          </div>
          {usuario ? <FormAvaliar produtoId={p.id} aoEnviar={() => { avisar("Avaliação publicada. Valeu!"); carregar(); api(`/products/${p.id}/reviews`).then(setResenhas); }} />
            : <div className="painel"><strong>Quer avaliar?</strong><p>Entre na sua conta. Só quem comprou a blusa pode opinar.</p><Link to="/entrar" state={{ de: `/blusa/${p.id}` }} className="btn pequeno">Entrar</Link></div>}
        </div>
      </section>

      {relacionados.length > 0 && (
        <section className="secao" aria-labelledby="rel">
          <h2 id="rel">Combina com</h2>
          <div className="grade">{relacionados.map((r) => <ProductCard key={r.id} produto={r} />)}</div>
        </section>
      )}

      {medidas && (
        <Modal titulo="Guia de medidas" onFechar={() => setMedidas(false)}>
          <p>Medidas da peça deitada, em centímetros (corte {CORTES[p.cut].toLowerCase()}). Na dúvida entre dois tamanhos, vá no maior.</p>
          <div className="tabela-rolar">
            <table className="tabela">
              <thead><tr><th>Tamanho</th><th>Largura</th><th>Comprimento</th></tr></thead>
              <tbody>{TAMANHOS.map((t) => <tr key={t}><td><strong>{t}</strong></td><td>{MEDIDAS[p.cut][t][0]} cm</td><td>{MEDIDAS[p.cut][t][1]} cm</td></tr>)}</tbody>
            </table>
          </div>
        </Modal>
      )}
    </main>
  );
}
