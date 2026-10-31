import { useRef } from "react";
import Camisa from "../components/Camisa";
import { useCatalogo } from "../lib/contextos";
import { totalEstoque } from "../lib/dinheiro";
import { gsap, ScrollTrigger, SEM_PREFERENCIA, SplitText, useGSAP } from "../lib/gsap";

export default function Sobre() {
  const { produtos } = useCatalogo();
  const raiz = useRef(null);
  const pecas = (produtos ?? []).reduce((s, p) => s + totalEstoque(p.stock), 0);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(SEM_PREFERENCIA, () => {
      // o texto do manifesto "acende" palavra por palavra conforme se rola (SplitText + ScrollTrigger scrub)
      const palavras = SplitText.create(".manifesto", { type: "words" });
      gsap.fromTo(palavras.words, { opacity: 0.18 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: ".manifesto", start: "top 82%", end: "bottom 45%", scrub: true } });
      gsap.from(".titulo-pagina", { y: 60, opacity: 0, duration: 1, ease: "ginga" });
      gsap.from(".sobre-arte svg", { rotation: -14, scale: 0.7, opacity: 0, duration: 1.3, ease: "back.out(1.5)" });
      // contadores que sobem até o número quando entram na tela
      gsap.utils.toArray(".numero b").forEach((el) => {
        const alvo = Number(el.dataset.alvo);
        const o = { v: 0 };
        gsap.to(o, { v: alvo, duration: 1.8, ease: "power3.out", snap: { v: 1 }, onUpdate: () => { el.textContent = Math.round(o.v); }, scrollTrigger: { trigger: el, start: "top 90%", once: true } });
      });
      return () => ScrollTrigger.refresh();
    });
  }, { scope: raiz, dependencies: [produtos?.length] });

  const arara = produtos?.find((p) => p.name === "Arara");
  return (
    <main className="pagina" ref={raiz}>
      <h1 className="titulo-pagina">Ginga é o<br />jeito do corpo</h1>
      <div className="sobre-bloco">
        <p className="manifesto">Ginga é o balanço que o brasileiro faz antes do drible, da roda de capoeira, do samba e da conversa fiada. Começamos estampando uma blusa para o racha de domingo e não paramos mais. Cada estampa vem de um pedaço do país: a onda do calçadão, o azulejo do casarão, a fita amarrada no pulso, a arara que não troca de parceiro. A gente faz poucas peças de cada, porque coisa boa não precisa estar em toda esquina.</p>
        <div className="sobre-arte">{arara && <Camisa cor={arara.color} design={arara.design} corte={arara.cut} titulo="Blusa Arara" />}</div>
      </div>
      <div className="numeros">
        <div className="numero"><b data-alvo={produtos?.length ?? 0}>0</b>estampas no catálogo</div>
        <div className="numero"><b data-alvo={pecas}>0</b>peças restantes, contadas ao vivo</div>
        <div className="numero"><b data-alvo={27}>0</b>estados atendidos</div>
        <div className="numero"><b data-alvo={30}>0</b>dias para trocar sem custo</div>
      </div>
      <p className="mono">Ginga é um projeto de estudo. As estampas são desenhos originais em SVG e nenhuma compra é cobrada de verdade.</p>
    </main>
  );
}
