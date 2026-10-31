import { useRef } from "react";
import { gsap, ScrollTrigger, SEM_PREFERENCIA, useGSAP } from "../lib/gsap";
import { totalEstoque } from "../lib/dinheiro";

/** Faixa que corre sozinha com o estoque de cada estampa, ao vivo, e acelera (ou inverte) com a rolagem */
export default function Faixa({ produtos }) {
  const raiz = useRef(null);
  useGSAP(() => {
    if (!produtos) return;
    const mm = gsap.matchMedia();
    mm.add(SEM_PREFERENCIA, () => {
      const corre = gsap.to(".faixa-trilho", { xPercent: -50, duration: 40, ease: "none", repeat: -1 });
      ScrollTrigger.create({
        start: 0, end: "max",
        onUpdate: (self) => {
          const turbo = Math.min(6, 1 + Math.abs(self.getVelocity()) / 260);
          gsap.timeline({ overwrite: true }).to(corre, { timeScale: self.direction * turbo, duration: 0.15 }).to(corre, { timeScale: 1, duration: 1.4, ease: "power2.out" });
        },
      });
    });
  }, { scope: raiz, dependencies: [produtos?.length] });

  const itens = (produtos ?? []).flatMap((p) => {
    const q = totalEstoque(p.stock);
    return [<span key={p.id} className={q === 0 ? "fim" : ""}>{p.name}<em>{q === 0 ? "esgotada" : `${q} restam`}</em></span>, <i key={`s${p.id}`} aria-hidden="true">◆</i>];
  });
  return (
    <div className="faixa" ref={raiz} role="marquee" aria-label="Estoque de cada estampa">
      <div className="faixa-trilho" aria-hidden="true"><div>{itens}</div><div>{itens}</div></div>
    </div>
  );
}
