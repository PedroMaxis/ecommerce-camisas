import { useMemo, useRef, useState } from "react";
import Carregando from "../components/Carregando";
import Faixa from "../components/Faixa";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import Regioes from "../components/Regioes";
import { useCatalogo } from "../lib/contextos";
import { CATEGORIAS } from "../lib/dados";
import { Flip, gsap, movimentoReduzido, PONTEIRO_FINO, ScrollTrigger, SEM_PREFERENCIA, useGSAP } from "../lib/gsap";

const ORDENS = { padrao: "Nº da coleção", menor: "Menor preço", maior: "Maior preço", nota: "Mais bem avaliadas" };

export default function Home() {
  const { produtos, erro, recarregar } = useCatalogo();
  const [filtro, setFiltro] = useState("todas");
  const [ordem, setOrdem] = useState("padrao");
  const raiz = useRef(null);
  const estado = useRef(null);
  const gatilhos = useRef([]);

  const lista = useMemo(() => {
    const l = [...(produtos ?? [])];
    if (ordem === "menor") l.sort((a, b) => a.priceCents - b.priceCents);
    if (ordem === "maior") l.sort((a, b) => b.priceCents - a.priceCents);
    if (ordem === "nota") l.sort((a, b) => (b.rating.avg ?? 0) - (a.rating.avg ?? 0) || a.id - b.id);
    return l;
  }, [produtos, ordem]);
  const contagem = (id) => (produtos ?? []).filter((p) => id === "todas" || p.category === id).length;

  // Flip: antes de mudar filtro/ordem, guarda onde cada cartão está; depois da mudança, anima de lá até o novo lugar
  const mudar = (aplicar) => {
    if (!movimentoReduzido()) {
      gatilhos.current.forEach((t) => t.kill());
      gsap.set(".cartao", { opacity: 1, y: 0 });
      estado.current = Flip.getState(".cartao");
    }
    aplicar();
  };

  useGSAP(() => {
    if (!estado.current) return;
    const antes = estado.current;
    estado.current = null;
    Flip.from(antes, {
      duration: 0.85, ease: "ginga", absolute: true, stagger: 0.04,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.4, rotation: -10 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.7, ease: "back.out(1.6)" }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.4, rotation: 10, duration: 0.4 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }, { dependencies: [filtro, ordem], scope: raiz });

  // vitrine: cartões entram conforme a rolagem; inclinação 3D e zoom seguem o mouse
  useGSAP(() => {
    if (!produtos) return;
    const mm = gsap.matchMedia();
    mm.add(SEM_PREFERENCIA, () => {
      gsap.set(".cartao", { opacity: 0, y: 90, rotation: 2 });
      gatilhos.current = ScrollTrigger.batch(".cartao", {
        start: "top 92%", once: true,
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, rotation: 0, duration: 1, ease: "ginga", stagger: 0.09 }),
      });
      gsap.fromTo(".vantagem", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "ginga", stagger: 0.1, scrollTrigger: { trigger: ".vantagens", start: "top 88%" } });
    });
    mm.add(`${PONTEIRO_FINO} and ${SEM_PREFERENCIA}`, () => {
      const limpar = [];
      gsap.utils.toArray(".cartao").forEach((cartao) => {
        const arte = cartao.querySelector(".cartao-arte"), peca = cartao.querySelector(".zoom");
        const rx = gsap.quickTo(arte, "rotationX", { duration: 0.5, ease: "power3" }), ry = gsap.quickTo(arte, "rotationY", { duration: 0.5, ease: "power3" });
        gsap.set(arte, { transformPerspective: 800 });
        const mexe = (e) => { const r = arte.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 14); rx(-((e.clientY - r.top) / r.height - 0.5) * 14); };
        const entra = () => gsap.to(peca, { scale: 1.1, rotation: -3, duration: 0.7, ease: "power3.out" });
        const sai = () => { rx(0); ry(0); gsap.to(peca, { scale: 1, rotation: 0, duration: 0.7, ease: "power3.out" }); };
        cartao.addEventListener("pointermove", mexe); cartao.addEventListener("pointerenter", entra); cartao.addEventListener("pointerleave", sai);
        limpar.push(() => { cartao.removeEventListener("pointermove", mexe); cartao.removeEventListener("pointerenter", entra); cartao.removeEventListener("pointerleave", sai); });
      });
      return () => limpar.forEach((f) => f());
    });
  }, { scope: raiz, dependencies: [produtos] });

  if (erro) return <div className="vazio"><h1>Eita!</h1><p>{erro}</p><button className="btn" onClick={recarregar}>Tentar de novo</button></div>;
  if (!produtos) return <Carregando texto="Montando a vitrine…" />;

  return (
    <div ref={raiz}>
      <Hero produtos={produtos} />
      <div className="fitas" aria-hidden="true" />
      <Faixa produtos={produtos} />
      <Regioes produtos={produtos} />
      <section className="miolo" id="vitrine" aria-labelledby="vitrine-titulo">
        <div className="vitrine-topo">
          <h2 id="vitrine-titulo">Todas as<br />blusas</h2>
          <p className="mono">{contagem(filtro)} {contagem(filtro) === 1 ? "estampa" : "estampas"} · preço já com cada centavo à vista</p>
        </div>
        <div className="filtros" role="toolbar" aria-label="Filtrar blusas">
          {CATEGORIAS.map((c) => (
            <button key={c.id} className="chip" aria-pressed={filtro === c.id} onClick={() => mudar(() => setFiltro(c.id))}>{c.nome}<sup>{contagem(c.id)}</sup></button>
          ))}
          <label className="ordem"><span className="sr">Ordenar por</span>
            <select value={ordem} onChange={(e) => mudar(() => setOrdem(e.target.value))} aria-label="Ordenar por">
              {Object.entries(ORDENS).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
            </select>
          </label>
        </div>
        <div className="grade">{lista.map((p) => <ProductCard key={p.id} produto={p} oculto={filtro !== "todas" && p.category !== filtro} />)}</div>
        <div className="vantagens">
          <div className="vantagem"><strong>PIX −5%</strong><span>Aprovação na hora e 5% de desconto automático.</span></div>
          <div className="vantagem"><strong>Frete grátis</strong><span>Acima de R$ 299 o envio econômico sai por nossa conta, para o Brasil todo.</span></div>
          <div className="vantagem"><strong>Troca em 30 dias</strong><span>Serviu mal? A gente troca o tamanho sem pergunta e sem custo.</span></div>
          <div className="vantagem"><strong>Tiragem curta</strong><span>Cada estampa sai em poucas dezenas de peças. Acabou, acabou.</span></div>
        </div>
      </section>
    </div>
  );
}
