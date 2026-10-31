import { useEffect, useRef } from "react";
import { Fechar } from "./Icones";
import { gsap, movimentoReduzido } from "../lib/gsap";

/** Janela por cima da página: fecha com Esc ou clique fora, prende o foco e abre com animação */
export default function Modal({ titulo, onFechar, children }) {
  const caixa = useRef(null);
  useEffect(() => {
    const anterior = document.activeElement;
    caixa.current?.focus();
    const tecla = (e) => { if (e.key === "Escape") onFechar(); };
    document.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";
    if (!movimentoReduzido()) gsap.from(caixa.current, { y: 50, scale: 0.92, opacity: 0, duration: 0.5, ease: "back.out(1.6)" });
    return () => { document.removeEventListener("keydown", tecla); document.body.style.overflow = ""; anterior?.focus?.(); };
  }, [onFechar]);
  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} ref={caixa} tabIndex={-1}>
        <button className="acao fechar" onClick={onFechar} aria-label="Fechar"><Fechar /></button>
        <h2>{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
