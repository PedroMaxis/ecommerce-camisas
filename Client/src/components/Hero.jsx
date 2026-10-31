import { useRef } from "react";
import Camisa from "./Camisa";
import { Draggable, gsap, movimentoReduzido, PONTEIRO_FINO, rolarPara, SEM_PREFERENCIA, SplitText, useGSAP } from "../lib/gsap";
import { totalEstoque } from "../lib/dinheiro";

const BASE = [-7, 6, -3]; // inclinação de cada blusa da colagem

export default function Hero({ produtos }) {
  const raiz = useRef(null);
  const total = produtos.reduce((s, p) => s + totalEstoque(p.stock), 0);
  const destaque = ["Ginga", "Arara", "Copacabana"].map((n) => produtos.find((p) => p.name === n)).filter(Boolean);
  const mes = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  useGSAP(() => {
    const mm = gsap.matchMedia();
    const figuras = gsap.utils.toArray(".colagem figure");
    gsap.set(figuras, { rotation: (i) => BASE[i] });

    // entrada: letras sobem, número conta de 0 até o estoque real, rabisco é desenhado (DrawSVG) e a colagem cai no lugar
    mm.add(SEM_PREFERENCIA, () => {
      const letras = SplitText.create(".h1-a, .h1-b", { type: "chars", mask: "chars" });
      const placar = { v: 0 };
      const alvo = raiz.current.querySelector(".numero-total");
      const contar = gsap.to(placar, { v: total, duration: 2.4, ease: "power3.out", onUpdate: () => { alvo.textContent = Math.round(placar.v); } });
      gsap.timeline({ defaults: { ease: "ginga" } })
        .from(".heroi .eyebrow", { y: 16, opacity: 0, duration: 0.6 }, 0)
        .from(".losango", { scale: 0, rotation: -24, duration: 1.3, ease: "back.out(1.3)" }, 0)
        .from(".esfera", { scale: 0, duration: 0.9, ease: "back.out(2.2)" }, 0.4)
        .from(letras.chars, { yPercent: 120, rotation: 7, duration: 0.9, stagger: 0.035 }, 0.2)
        .from(".h1-num", { scale: 0.3, opacity: 0, transformOrigin: "0% 100%", duration: 1, ease: "back.out(1.7)" }, 0.45)
        .add(contar, 0.5)
        .fromTo(".h1-num path", { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.9, ease: "power2.out" }, 1.2)
        .from(".heroi .lead, .agora, .heroi-acoes > *", { y: 26, opacity: 0, duration: 0.7, stagger: 0.09 }, 0.95)
        .from(figuras, { yPercent: 40, opacity: 0, scale: 0.55, rotation: (i) => BASE[i] * 5, duration: 1.2, stagger: 0.13, ease: "back.out(1.3)" }, 0.7)
        .from(".selo-giro", { scale: 0, rotation: -200, duration: 1, ease: "back.out(1.6)" }, 1.3);

      gsap.to(".selo-giro .texto-giro", { rotation: 360, transformOrigin: "50% 50%", duration: 20, ease: "none", repeat: -1 });

      // linha "agora na vitrine": o nome de cada estampa é digitado e apagado (TextPlugin)
      const dig = gsap.timeline({ repeat: -1, repeatDelay: 0.3 });
      produtos.forEach((p) => {
        const txt = `${p.name} · ${totalEstoque(p.stock)} restam`;
        dig.to(".agora b", { text: { value: txt }, duration: txt.length * 0.04, ease: "none" }).to(".agora b", { text: { value: "" }, duration: 0.5, ease: "none", delay: 1.8 });
      });
    });

    // sem animação de entrada, o número já aparece final
    mm.add("(prefers-reduced-motion: reduce)", () => { raiz.current.querySelector(".numero-total").textContent = total; });

    // peso da fonte variável reage ao mouse: as letras perto do cursor afinam; o fundo flutua em profundidade
    mm.add(`${PONTEIRO_FINO} and ${SEM_PREFERENCIA}`, () => {
      const letras = gsap.utils.toArray(".h1-a div, .h1-b div, .h1-a, .h1-b").filter((el) => el.children.length === 0 && el.textContent.trim().length === 1);
      const pesos = letras.map((el) => gsap.quickTo(el, "fontWeight", { duration: 0.45, ease: "power3" }));
      const lo = gsap.quickTo(".losango", "x", { duration: 1.2, ease: "power3" }), loy = gsap.quickTo(".losango", "y", { duration: 1.2, ease: "power3" });
      const mover = (e) => {
        letras.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
          pesos[i](300 + gsap.utils.clamp(0, 1, d / 280) * 600);
        });
        lo((e.clientX / window.innerWidth - 0.5) * -40); loy((e.clientY / window.innerHeight - 0.5) * -30);
      };
      const sair = () => pesos.forEach((w) => w(900));
      const el = raiz.current;
      el.addEventListener("pointermove", mover); el.addEventListener("pointerleave", sair);
      return () => { el.removeEventListener("pointermove", mover); el.removeEventListener("pointerleave", sair); };
    });

    // colagem arrastável, com inércia: dá para "atirar" as blusas pela hero (Draggable + InertiaPlugin)
    Draggable.create(figuras, {
      type: "x,y", inertia: !movimentoReduzido(), bounds: ".heroi-in", edgeResistance: 0.8, zIndexBoost: true,
      onPress() { gsap.to(this.target, { scale: 1.07, duration: 0.25, ease: "power2.out", overwrite: "auto" }); },
      onDrag() { gsap.to(this.target, { rotation: BASE[figuras.indexOf(this.target)] + gsap.utils.clamp(-16, 16, this.deltaX * 1.4), duration: 0.2, overwrite: "auto" }); },
      onRelease() { gsap.to(this.target, { scale: 1, rotation: BASE[figuras.indexOf(this.target)], duration: 0.7, ease: "elastic.out(1,.5)", overwrite: "auto" }); },
    });
  }, { scope: raiz, dependencies: [total] });

  return (
    <section className="heroi" ref={raiz}>
      <div className="heroi-fundo" aria-hidden="true"><i className="losango" /><i className="esfera" /></div>
      <div className="heroi-in">
        <div className="heroi-texto">
          <p className="eyebrow">Coleção verão · catálogo nº 01 · {mes}</p>
          <h1 aria-label={`Restam ${total} blusas`}>
            <span className="h1-a" aria-hidden="true">Restam</span>
            <span className="h1-num" aria-hidden="true">
              <span className="numero-total">{total}</span>
              <svg viewBox="0 0 240 24" preserveAspectRatio="none"><path d="M4 14C40 2 70 24 110 10S180 4 236 14" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" /></svg>
            </span>
            <span className="h1-b" aria-hidden="true">blusas.</span>
          </h1>
          <p className="lead">{produtos.length} estampas brasileiras, feitas em tiragem curta. A cada pedido esse número cai: aqui em cima, ao vivo.</p>
          <p className="agora" aria-hidden="true">na vitrine agora: <b>{produtos[0]?.name}</b><i>▍</i></p>
          <div className="heroi-acoes">
            <button className="btn amarelo" onClick={() => rolarPara("#vitrine")}>Ver as blusas ↓</button>
            <button className="btn vazado" onClick={() => rolarPara("#regioes", 0)}>Do Oiapoque ao Chuí</button>
          </div>
        </div>
        <div className="colagem">
          {destaque.map((p, i) => <figure key={p.id} className={`c${i}`}><Camisa cor={p.color} design={p.design} corte={p.cut} titulo={`Blusa ${p.name}`} /></figure>)}
          <span className="dica-arrasto" aria-hidden="true">arraste e jogue ↺</span>
        </div>
      </div>
      <svg className="selo-giro" viewBox="0 0 150 150" aria-hidden="true">
        <circle className="fundo" cx="75" cy="75" r="72" />
        <g className="texto-giro">
          <path id="arco-selo" d="M75 75m-52 0a52 52 0 1 1 104 0a52 52 0 1 1-104 0" fill="none" />
          <text><textPath href="#arco-selo">GINGA · BLUSAS BRASILEIRAS · TIRAGEM CURTA ·</textPath></text>
        </g>
        <path d="M75 52l22 23-22 23-22-23z" fill="#009739" /><circle cx="75" cy="75" r="9" fill="#012169" />
      </svg>
    </section>
  );
}
