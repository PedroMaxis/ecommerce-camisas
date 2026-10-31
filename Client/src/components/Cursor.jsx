import { useRef } from "react";
import { gsap, PONTEIRO_FINO, SEM_PREFERENCIA, useGSAP } from "../lib/gsap";

/** Círculo que segue o mouse e vira um rótulo ("Ver") sobre qualquer elemento com data-cursor. Só em mouse/trackpad. */
export default function Cursor() {
  const bola = useRef(null);
  const rotulo = useRef(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(`${PONTEIRO_FINO} and ${SEM_PREFERENCIA}`, () => {
      const el = bola.current;
      gsap.set(el, { xPercent: -50, yPercent: -50, scale: 0.3, opacity: 0 });
      const x = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3" });
      const y = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3" });
      const mover = (e) => { x(e.clientX); y(e.clientY); };
      // o círculo só existe sobre elementos com data-cursor; fora deles some, para não cobrir botões e textos
      const sobre = (e) => {
        const alvo = e.target.closest?.("[data-cursor]");
        if (alvo) rotulo.current.textContent = alvo.dataset.cursor;
        gsap.to(el, { scale: alvo ? 1 : 0.3, opacity: alvo ? 1 : 0, duration: alvo ? 0.4 : 0.25, ease: alvo ? "back.out(1.6)" : "power2.out", overwrite: "auto" });
      };
      window.addEventListener("pointermove", mover);
      window.addEventListener("pointerover", sobre);
      return () => { window.removeEventListener("pointermove", mover); window.removeEventListener("pointerover", sobre); };
    });
  });
  return <div ref={bola} className="cursor" aria-hidden="true"><span ref={rotulo} /></div>;
}
