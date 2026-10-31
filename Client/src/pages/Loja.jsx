import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { api } from "../lib/api";

export default function Loja() {
  const [produtos, setProdutos] = useState(null);
  const [erro, setErro] = useState("");
  const carregar = () => { setErro(""); api("/products").then(setProdutos).catch((e) => setErro(e.message)); };
  useEffect(carregar, []);

  return (
    <main>
      <section className="abertura">
        <p className="mono">Edições pequenas · algodão · estampa à mão</p>
        <h1>Camisas que <em>não se repetem</em> em toda esquina.</h1>
        <p className="lead">Cada modelo sai em poucas dezenas de peças. Quando acaba, acabou.</p>
      </section>
      {erro && <div className="vazio"><p>{erro}</p><button className="btn" onClick={carregar}>Tentar de novo</button></div>}
      {!produtos && !erro && <div className="grade" aria-busy="true">{Array.from({ length: 8 }, (_, i) => <div key={i} className="cartao esqueleto" />)}</div>}
      {produtos && <div className="grade">{produtos.map((p, i) => <ProductCard key={p.id} produto={p} indice={i} />)}</div>}
    </main>
  );
}
