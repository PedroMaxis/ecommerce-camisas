import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import Camisa from "./Camisa";
import { Coracao, Fechar, Lupa, Marca, Menu, Pessoa, Sacola } from "./Icones";
import { useCarrinho, useCatalogo, useFavoritos, useSessao } from "../lib/contextos";
import { reais } from "../lib/dinheiro";
import { gsap, ScrollTrigger, SEM_PREFERENCIA, useGSAP } from "../lib/gsap";

const AVISOS = [
  "Frete grátis acima de R$ 299",
  "PIX com 5% de desconto, na hora",
  "Cupom BEMVINDO10: 10% na primeira compra",
  "Troca grátis em até 30 dias",
];

export default function Navbar() {
  const { usuario } = useSessao();
  const { count } = useCarrinho();
  const { ids } = useFavoritos();
  const { produtos } = useCatalogo();
  const ir = useNavigate();
  const { pathname } = useLocation();
  const raiz = useRef(null);
  const primeiro = useRef(true);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");

  const resultados = busca.trim().length < 2 ? [] : (produtos ?? []).filter((p) => `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(busca.trim().toLowerCase())).slice(0, 5);

  useEffect(() => { setAberto(false); setBusca(""); }, [pathname]);

  // o aviso do topo "digita" cada frase (TextPlugin) e a barra some ao rolar para baixo
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(SEM_PREFERENCIA, () => {
      const t = gsap.timeline({ repeat: -1 });
      AVISOS.forEach((txt) => t.to(".aviso-topo span", { text: { value: txt }, duration: txt.length * 0.03, ease: "none" }).to(".aviso-topo span", { text: { value: "" }, duration: 0.35, ease: "none", delay: 2.4 }));
      const mostrar = gsap.from(".topo", { yPercent: -110, paused: true, duration: 0.35, ease: "power2.out" }).progress(1);
      ScrollTrigger.create({ start: 160, end: "max", onUpdate: (self) => (self.direction === -1 ? mostrar.play() : mostrar.reverse()) });
      gsap.from(".topo", { yPercent: -110, duration: 0.9, ease: "ginga", delay: 0.1 });
    });
  }, { scope: raiz });

  // o contador "salta" (CustomBounce) quando a sacola muda
  useEffect(() => {
    if (primeiro.current) { primeiro.current = false; return; }
    if (count > 0) gsap.fromTo(".acao-sacola .contador", { scale: 0 }, { scale: 1, duration: 1, ease: "salto" });
  }, [count]);

  return (
    <div ref={raiz}>
      <div className="aviso-topo" role="note"><span>{AVISOS[0]}</span></div>
      <header className={`topo ${aberto ? "aberto" : ""}`}>
        <Link to="/" className="marca" aria-label="Ginga, início"><Marca /><span>Ginga</span></Link>
        <nav aria-label="Principal">
          <NavLink to="/" end>Blusas</NavLink>
          <NavLink to="/sobre">Sobre</NavLink>
          <NavLink to="/faq">Dúvidas</NavLink>
          <NavLink to="/contato">Contato</NavLink>
          {usuario?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <form className="busca" role="search" onSubmit={(e) => { e.preventDefault(); if (resultados[0]) ir(`/blusa/${resultados[0].id}`); }}>
          <Lupa />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar blusa…" aria-label="Buscar blusa" autoComplete="off" />
          {busca.trim().length >= 2 && (
            <div className="resultados" role="listbox">
              {resultados.length ? resultados.map((p) => (
                <Link key={p.id} to={`/blusa/${p.id}`} role="option">
                  <Camisa cor={p.color} design={p.design} corte={p.cut} />
                  <strong>{p.name}</strong><span className="preco">{reais(p.priceCents)}</span>
                </Link>
              )) : <p>Nada com “{busca}”. Tente “praia” ou “azulejo”.</p>}
            </div>
          )}
        </form>
        <div className="acoes">
          <Link to="/favoritos" className="acao" aria-label={`Favoritos (${ids.length})`}><Coracao />{ids.length > 0 && <b className="contador">{ids.length}</b>}</Link>
          <Link to="/sacola" className="acao acao-sacola" aria-label={`Sacola (${count} itens)`}><Sacola />{count > 0 && <b className="contador">{count}</b>}</Link>
          <Link to={usuario ? "/conta" : "/entrar"} className="acao acao-conta"><Pessoa /><span>{usuario ? usuario.name.split(" ")[0] : "Entrar"}</span></Link>
          <button className="acao menu-btn" onClick={() => setAberto(!aberto)} aria-label="Menu" aria-expanded={aberto}>{aberto ? <Fechar /> : <Menu />}</button>
        </div>
      </header>
    </div>
  );
}
