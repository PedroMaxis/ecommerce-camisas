import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { gsap, rolarPara, SEM_PREFERENCIA, useGSAP } from "../lib/gsap";

const PERGUNTAS = [
  { id: "frete", q: "Quanto custa e quanto demora o frete?", r: ["O valor depende do seu CEP: de R$ 14,90 (São Paulo) a R$ 32,90 (Norte). O prazo vai de 3 a 9 dias úteis no envio econômico, e o expresso corta 2 dias por mais R$ 15,00.", "Compras a partir de R$ 299,00 têm o frete econômico grátis para o Brasil todo. Você calcula na página da blusa e na sacola, sem precisar de conta."] },
  { id: "pagamento", q: "Quais formas de pagamento vocês aceitam?", r: ["PIX (com 5% de desconto automático), cartão de crédito em até 3x sem juros e boleto com vencimento em 3 dias úteis.", "Neste projeto de estudo o pagamento é simulado: nenhuma cobrança é feita de verdade."] },
  { id: "trocas", q: "Como funcionam trocas e devoluções?", r: ["Você tem 30 dias, contados do recebimento, para trocar o tamanho ou devolver a blusa sem custo, desde que ela esteja sem uso e com a etiqueta.", "É só falar com a gente pela página de contato com o número do pedido."] },
  { id: "tamanho", q: "Como escolho o tamanho?", r: ["Cada blusa tem um guia de medidas na própria página, com largura e comprimento em centímetros para cada corte. Na dúvida entre dois tamanhos, vá no maior; o baby look é mais justo e o oversized, mais largo."] },
  { id: "tiragem", q: "O que é tiragem curta?", r: ["Cada estampa é produzida em poucas dezenas de peças. Quando o estoque de um tamanho acaba, acabou, e o número de blusas restantes no topo do site cai a cada pedido."] },
  { id: "cupom", q: "Como uso um cupom?", r: ["Digite o código na sacola ou no checkout. Experimente BEMVINDO10 (10% na primeira compra), CORRE20 (20% acima de R$ 250) ou FRETEBRASIL (frete grátis acima de R$ 150)."] },
  { id: "pedido", q: "Posso cancelar um pedido?", r: ["Pedidos ainda não pagos você cancela sozinho na página do pedido, e as peças voltam ao estoque. Depois do pagamento, fale com a gente que resolvemos."] },
];

export default function Faq() {
  const raiz = useRef(null);
  const { hash } = useLocation();

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(SEM_PREFERENCIA, () => { gsap.from(".titulo-pagina, .sub-pagina, .acordeao details", { y: 40, opacity: 0, duration: 0.7, stagger: 0.07, ease: "ginga" }); });
  }, { scope: raiz });

  // /faq#trocas abre e leva até a pergunta certa
  useEffect(() => {
    if (!hash) return;
    const el = raiz.current?.querySelector(hash);
    if (el) { el.open = true; setTimeout(() => rolarPara(hash, 110), 80); }
  }, [hash]);

  return (
    <main className="pagina" ref={raiz}>
      <h1 className="titulo-pagina">Dúvidas<br />frequentes</h1>
      <p className="sub-pagina">Não achou o que procurava? <Link to="/contato"><u>Fale com a gente</u></Link>.</p>
      <div className="acordeao">
        {PERGUNTAS.map((p) => (
          <details key={p.id} id={p.id}>
            <summary>{p.q}</summary>
            <div className="resp">{p.r.map((t, i) => <p key={i}>{t}</p>)}</div>
          </details>
        ))}
      </div>
    </main>
  );
}
