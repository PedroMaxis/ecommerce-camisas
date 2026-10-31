import { useState } from "react";
import { Link } from "react-router-dom";
import { Marca } from "./Icones";
import { api } from "../lib/api";
import { useAvisos } from "../lib/contextos";

export default function Rodape() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const avisar = useAvisos();

  const assinar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const r = await api("/newsletter", { method: "POST", corpo: { email } });
      avisar(r.novo ? "Pronto! Você entra na lista de novidades." : "Esse e-mail já estava na lista. Valeu!");
      setEmail("");
    } catch (err) { avisar(err.message, "erro"); }
    finally { setEnviando(false); }
  };

  return (
    <footer className="rodape">
      <div className="rodape-in">
        <div>
          <div className="marca"><Marca width="34" height="34" /><span>Ginga</span></div>
          <p>Blusas com estampa brasileira, feitas em tiragem curta. Cada modelo sai em poucas dezenas de peças.</p>
          <form className="newsletter" onSubmit={assinar}>
            <label className="sr" htmlFor="news">Seu e-mail</label>
            <input id="news" type="email" required placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn amarelo pequeno" disabled={enviando}>Assinar</button>
          </form>
        </div>
        <div><h3>Loja</h3><ul><li><Link to="/">Todas as blusas</Link></li><li><Link to="/favoritos">Favoritos</Link></li><li><Link to="/sacola">Sacola</Link></li><li><Link to="/pedidos">Meus pedidos</Link></li></ul></div>
        <div><h3>Ajuda</h3><ul><li><Link to="/faq">Perguntas frequentes</Link></li><li><Link to="/faq#trocas">Trocas e devoluções</Link></li><li><Link to="/faq#frete">Prazos e frete</Link></li><li><Link to="/contato">Fale com a gente</Link></li></ul></div>
        <div><h3>Ginga</h3><ul><li><Link to="/sobre">Nossa história</Link></li><li><Link to="/conta">Minha conta</Link></li></ul></div>
        <div className="rodape-fim"><span>Ginga · projeto de estudo: nenhuma compra é cobrada de verdade.</span><span>Feito no Brasil, com saudade.</span></div>
      </div>
    </footer>
  );
}
