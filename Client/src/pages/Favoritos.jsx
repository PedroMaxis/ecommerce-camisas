import { useRef } from "react";
import { Link } from "react-router-dom";
import Carregando from "../components/Carregando";
import ProductCard from "../components/ProductCard";
import Protegida from "../components/Protegida";
import { useCatalogo, useFavoritos } from "../lib/contextos";
import { gsap, SEM_PREFERENCIA, useGSAP } from "../lib/gsap";

function Lista() {
  const { ids } = useFavoritos();
  const { produtos } = useCatalogo();
  const raiz = useRef(null);
  const favoritos = (produtos ?? []).filter((p) => ids.includes(p.id));

  useGSAP(() => {
    if (!favoritos.length) return;
    const mm = gsap.matchMedia();
    mm.add(SEM_PREFERENCIA, () => { gsap.from(".titulo-pagina, .cartao", { y: 50, opacity: 0, rotation: 2, duration: 0.8, stagger: 0.08, ease: "ginga" }); });
  }, { scope: raiz, dependencies: [favoritos.length > 0] });

  if (!produtos) return <Carregando />;
  if (!favoritos.length) return <div className="vazio"><h1>Nenhum favorito ainda</h1><p>Toque no coração de uma blusa para guardá-la aqui.</p><Link to="/" className="btn">Ver as blusas</Link></div>;
  return (
    <main className="pagina" ref={raiz}>
      <h1 className="titulo-pagina">Favoritos</h1>
      <p className="sub-pagina">{favoritos.length} {favoritos.length === 1 ? "blusa guardada" : "blusas guardadas"}.</p>
      <div className="grade">{favoritos.map((p) => <ProductCard key={p.id} produto={p} />)}</div>
    </main>
  );
}
export default function Favoritos() { return <Protegida><Lista /></Protegida>; }
