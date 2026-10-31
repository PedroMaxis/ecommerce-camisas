import { useRef } from "react";
import { gsap, SEM_PREFERENCIA, useGSAP } from "../lib/gsap";

// A gota vira blusa e volta: o carregamento da loja (MorphSVG)
const GOTA = "M50 8C50 8 20 44 20 64a30 30 0 0060 0C80 44 50 8 50 8Z";
const BLUSA = "M34 14L44 11Q50 20 56 11L66 14L88 28L80 44L70 38V86H30V38L20 44L12 28Z";

export default function Carregando({ texto = "Carregando…" }) {
  const raiz = useRef(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(SEM_PREFERENCIA, () => {
      gsap.to(".forma", { morphSVG: BLUSA, duration: 0.9, ease: "ginga", repeat: -1, yoyo: true, repeatDelay: 0.25 });
      gsap.to(".forma", { fill: "#fedd00", duration: 0.9, ease: "none", repeat: -1, yoyo: true, repeatDelay: 0.25 });
    });
  }, { scope: raiz });
  return (
    <div className="carregando" ref={raiz} aria-busy="true" role="status">
      <svg viewBox="0 0 100 100"><path className="forma" d={GOTA} /></svg>
      <span className="mono">{texto}</span>
    </div>
  );
}
