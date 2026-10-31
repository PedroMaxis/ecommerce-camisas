import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { reais } from "../lib/dinheiro";

/** Preço que "conta" até o novo valor quando muda (o texto final já está no DOM para leitores de tela e testes) */
export default function Valor({ centavos, className }) {
  const ref = useRef(null);
  const anterior = useRef(centavos);
  useGSAP(() => {
    const el = ref.current;
    const de = anterior.current;
    anterior.current = centavos;
    el.textContent = reais(centavos);
    if (de === centavos || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const o = { v: de };
    gsap.to(o, { v: centavos, duration: 0.7, ease: "power2.out", onUpdate: () => { el.textContent = reais(Math.round(o.v)); }, onComplete: () => { el.textContent = reais(centavos); } });
  }, { dependencies: [centavos] });
  return <span ref={ref} className={className} aria-live="polite">{reais(centavos)}</span>;
}
