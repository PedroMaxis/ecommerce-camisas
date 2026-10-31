import { useRef } from "react";
import { Link } from "react-router-dom";
import Camisa from "./Camisa";
import { fundoDe } from "../lib/dados";
import { gsap, SEM_PREFERENCIA, useGSAP } from "../lib/gsap";

const REGIOES = [
  { reg: "Norte", produto: "Arara", tag: "Amazônia", fundo: "#d9f1df", frase: "Na floresta, a arara escolhe um parceiro para a vida inteira e faz ninho no buraco de uma árvore velha. A estampa herdou a teimosia." },
  { reg: "Nordeste", produto: "Fita do Bonfim", tag: "Salvador", fundo: "#ffe9a8", frase: "Amarram-se três nós e fazem-se três pedidos. A fita só sai quando se desfaz sozinha, e aí o desejo, dizem, se cumpre." },
  { reg: "Centro-Oeste", produto: "Sol a Pino", tag: "Cerrado", fundo: "#cfe3ff", frase: "Meio-dia no cerrado não tem sombra: tudo é luz branca, poeira vermelha e picolé derretendo na mão." },
  { reg: "Sudeste", produto: "Copacabana", tag: "Rio de Janeiro", fundo: "#fff4d1", frase: "O calçadão veio de Portugal e foi assentado pedra por pedra, com a mão. A gente só passou a onda para o tecido." },
  { reg: "Sul", produto: "Pelada de Domingo", tag: "Várzea", fundo: "#e4f7ea", frase: "Domingo de manhã: dois times, uma bola meio murcha e traves de chinelo. Quem chega por último é goleiro." },
];

/** Seção que prende na tela e anda para o lado conforme se rola (ScrollTrigger com pin e scrub) */
export default function Regioes({ produtos }) {
  const raiz = useRef(null);
  const itens = REGIOES.map((r) => ({ ...r, p: produtos.find((p) => p.name === r.produto) })).filter((r) => r.p);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(`(min-width: 1001px) and ${SEM_PREFERENCIA}`, () => {
      const trilho = raiz.current.querySelector(".trilho-reg");
      raiz.current.classList.add("fixa");
      const distancia = () => trilho.scrollWidth - window.innerWidth;
      const anda = gsap.to(trilho, {
        x: () => -distancia(), ease: "none",
        scrollTrigger: { trigger: raiz.current, pin: true, scrub: 0.7, start: "top top", end: () => `+=${distancia()}`, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      gsap.to(".progresso-reg i", { scaleX: 1, ease: "none", scrollTrigger: { trigger: raiz.current, scrub: true, start: "top top", end: () => `+=${distancia()}` } });
      gsap.utils.toArray(".painel-reg").forEach((painel) => {
        gsap.fromTo(painel.querySelector(".reg-nome"), { x: 140 }, { x: -140, ease: "none", scrollTrigger: { trigger: painel, containerAnimation: anda, scrub: true, start: "left right", end: "right left" } });
        gsap.fromTo(painel.querySelector(".reg-arte svg"), { rotation: -9, y: 30 }, { rotation: 9, y: -30, ease: "none", scrollTrigger: { trigger: painel, containerAnimation: anda, scrub: true, start: "left right", end: "right left" } });
      });
      return () => raiz.current?.classList.remove("fixa");
    });
  }, { scope: raiz, dependencies: [itens.length] });

  if (!itens.length) return null;
  return (
    <section className="regioes" id="regioes" ref={raiz} aria-labelledby="regioes-titulo">
      <div className="regioes-topo">
        <h2 id="regioes-titulo">Do Oiapoque<br />ao Chuí</h2>
        <p>Cada estampa nasceu de um canto do país. Role para atravessar o mapa.</p>
      </div>
      <div className="trilho-reg">
        {itens.map(({ reg, p, tag, fundo, frase }) => (
          <article key={reg} className="painel-reg" style={{ "--fundo-reg": fundo }}>
            <span className="reg-nome" aria-hidden="true">{reg}</span>
            <div className="reg-arte" style={{ "--fundo": fundoDe(p.color) }}><Camisa cor={p.color} design={p.design} corte={p.cut} titulo={`Blusa ${p.name}`} /></div>
            <div className="reg-texto">
              <span className="mono">{reg} · {tag}</span>
              <h3>{p.name}</h3>
              <p>{frase}</p>
              <Link className="btn pequeno" to={`/blusa/${p.id}`}>Ver a blusa →</Link>
            </div>
          </article>
        ))}
      </div>
      <div className="progresso-reg" aria-hidden="true"><i /></div>
    </section>
  );
}
