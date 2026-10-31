import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { TextPlugin } from "gsap/TextPlugin";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { CustomEase } from "gsap/CustomEase";
import { CustomBounce } from "gsap/CustomBounce";
import { CustomWiggle } from "gsap/CustomWiggle";
import { useGSAP } from "@gsap/react";

// Tudo registrado uma única vez, aqui; o resto do app importa só deste arquivo.
gsap.registerPlugin(
  ScrollTrigger, ScrollToPlugin, SplitText, Flip, Draggable, InertiaPlugin, MotionPathPlugin, DrawSVGPlugin,
  MorphSVGPlugin, ScrambleTextPlugin, TextPlugin, Physics2DPlugin, CustomEase, CustomBounce, CustomWiggle, useGSAP,
);

// eases próprias da marca
CustomEase.create("ginga", "M0,0 C0.76,0 0.24,1 1,1");          // arranque e freada fortes, como um drible
CustomBounce.create("salto", { strength: 0.65, squash: 2.2, squashID: "salto-squash" });
CustomWiggle.create("tremor", { wiggles: 9, type: "easeOut" });  // sacudida de "não pode"

/** Só anima quando o sistema não pede redução de movimento; sem isso a página fica estática e completa */
export const SEM_PREFERENCIA = "(prefers-reduced-motion: no-preference)";
export const PONTEIRO_FINO = "(hover: hover) and (pointer: fine)";
export const movimentoReduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A cópia da blusa descreve uma curva (MotionPath) até o ícone da sacola e encolhe pelo caminho */
export function voarParaSacola(origem) {
  const destino = document.querySelector(".acao-sacola");
  if (!origem || !destino || movimentoReduzido()) return;
  const a = origem.getBoundingClientRect(), b = destino.getBoundingClientRect();
  const copia = origem.cloneNode(true);
  copia.removeAttribute("id");
  Object.assign(copia.style, { position: "fixed", left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`, margin: 0, zIndex: 80, pointerEvents: "none" });
  document.body.appendChild(copia);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  gsap.timeline({ onComplete: () => copia.remove() })
    .to(copia, { duration: 1.05, ease: "power1.inOut", motionPath: { path: [{ x: 0, y: 0 }, { x: dx * 0.25, y: -Math.min(220, a.height) }, { x: dx * 0.8, y: dy * 0.3 }, { x: dx, y: dy }], curviness: 1.5 } }, 0)
    .to(copia, { scale: 0.05, rotation: 380, opacity: 0.7, duration: 1.05, ease: "power2.in" }, 0);
}

/** Chuva de confete nas cores da bandeira: cada pedaço lançado com física (Physics2D) */
export function confete(x, y, quantidade = 90) {
  if (movimentoReduzido()) return;
  const cores = ["#009739", "#fedd00", "#012169", "#ff5d8f", "#ffffff", "#ff8a00"];
  for (let i = 0; i < quantidade; i++) {
    const p = document.createElement("i");
    const fita = Math.random() < 0.4;
    Object.assign(p.style, { position: "fixed", left: `${x}px`, top: `${y}px`, width: fita ? "5px" : "9px", height: fita ? "16px" : "9px", borderRadius: fita ? "2px" : "50%", background: cores[i % cores.length], zIndex: 90, pointerEvents: "none" });
    document.body.appendChild(p);
    gsap.to(p, {
      physics2D: { velocity: gsap.utils.random(380, 1000), angle: gsap.utils.random(-135, -45), gravity: 1500 },
      rotation: gsap.utils.random(-720, 720), duration: gsap.utils.random(1.6, 2.6), ease: "none",
      opacity: 0, delay: gsap.utils.random(0, 0.12), onComplete: () => p.remove(),
    });
  }
}

/** Rola suavemente até um elemento (ScrollToPlugin) com a ease da marca */
export function rolarPara(alvo, desvio = 90) {
  if (movimentoReduzido()) { document.querySelector(alvo)?.scrollIntoView(); return; }
  gsap.to(window, { scrollTo: { y: alvo, offsetY: desvio, autoKill: true }, duration: 1.3, ease: "ginga" });
}

/** Letras embaralham até formar o texto (ScrambleText) */
export function embaralhar(el, texto, duracao = 0.7) {
  if (!el || movimentoReduzido()) return;
  gsap.to(el, { duration: duracao, scrambleText: { text: texto, chars: "0123456789ABCDEF", speed: 0.7, revealDelay: 0.1 }, overwrite: true });
}

export { gsap, ScrollTrigger, SplitText, Flip, Draggable, useGSAP };
