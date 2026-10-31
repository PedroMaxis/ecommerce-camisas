import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Camisa from "../components/Camisa";
import { api } from "../lib/api";
import { useAvisos, useCarrinho, useSessao } from "../lib/contextos";
import { TAMANHOS, reais } from "../lib/dinheiro";

export default function Produto() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [erro, setErro] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { usuario } = useSessao();
  const { adicionar } = useCarrinho();
  const avisar = useAvisos();
  const ir = useNavigate();

  useEffect(() => { api(`/products/${id}`).then(setP).catch((e) => setErro(e.status === 404 ? "Essa camisa não existe (ou já saiu de linha)." : e.message)); }, [id]);

  if (erro) return <main className="vazio"><p>{erro}</p><Link to="/" className="btn">Ver todas as camisas</Link></main>;
  if (!p) return <main className="vazio" aria-busy="true"><p>Carregando…</p></main>;

  const comprar = async () => {
    if (!usuario) return ir("/entrar", { state: { de: `/camisa/${p.id}` } });
    if (!tamanho) return avisar("Escolha um tamanho primeiro.", "erro");
    setEnviando(true);
    try { await adicionar(p.id, tamanho); avisar(`${p.name} (${tamanho}) na sacola.`); }
    catch (e) { avisar(e.message, "erro"); }
    finally { setEnviando(false); }
  };

  return (
    <main className="produto">
      <Link to="/" className="voltar">← Todas as camisas</Link>
      <div className="produto-grade">
        <div className="produto-arte" style={{ "--fundo": p.color }}><Camisa cor={p.color} design={p.design} titulo={`Camisa ${p.name}`} /></div>
        <div className="produto-info">
          <span className="num">Nº {String(p.id).padStart(2, "0")}</span>
          <h1>{p.name}</h1>
          <p className="preco grande">{reais(p.priceCents)}</p>
          <p className="desc">{p.description}</p>

          <fieldset className="tamanhos">
            <legend>Tamanho</legend>
            {TAMANHOS.map((t) => {
              const q = p.stock[t] ?? 0;
              return (
                <label key={t} className={`tam ${q === 0 ? "sem" : ""} ${tamanho === t ? "on" : ""}`}>
                  <input type="radio" name="tam" value={t} disabled={q === 0} checked={tamanho === t} onChange={() => setTamanho(t)} />
                  {t}
                  {q > 0 && q <= 3 && <small>{q === 1 ? "última" : `${q} restam`}</small>}
                </label>
              );
            })}
          </fieldset>

          <button className="btn grande" onClick={comprar} disabled={enviando}>
            {usuario ? (enviando ? "Adicionando…" : "Pôr na sacola") : "Entrar para comprar"}
          </button>
        </div>
      </div>
    </main>
  );
}
