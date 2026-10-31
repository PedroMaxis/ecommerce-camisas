import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useSessao } from "../lib/contextos";

export default function Entrar() {
  const { usuario, login, cadastrar } = useSessao();
  const [criando, setCriando] = useState(false);
  const [campos, setCampos] = useState({ name: "", email: "", password: "" });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { state } = useLocation();
  const ir = useNavigate();
  const destino = state?.de ?? "/";

  if (usuario) return <Navigate to={destino} replace />;
  const muda = (k) => (e) => setCampos((c) => ({ ...c, [k]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setErro(""); setEnviando(true);
    try {
      if (criando) await cadastrar(campos.name, campos.email, campos.password);
      else await login(campos.email, campos.password);
      ir(destino, { replace: true });
    } catch (err) { setErro(err.message); }
    finally { setEnviando(false); }
  };

  return (
    <main className="entrar">
      <form onSubmit={enviar} noValidate>
        <h1>{criando ? "Criar conta" : "Entrar"}</h1>
        {criando && <label>Nome<input value={campos.name} onChange={muda("name")} autoComplete="name" required /></label>}
        <label>E-mail<input type="email" value={campos.email} onChange={muda("email")} autoComplete="email" required /></label>
        <label>Senha<input type="password" value={campos.password} onChange={muda("password")} autoComplete={criando ? "new-password" : "current-password"} required minLength={8} />
          {criando && <small className="mono">Mínimo de 8 caracteres.</small>}</label>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="btn grande" disabled={enviando}>{enviando ? "Aguarde…" : criando ? "Criar conta" : "Entrar"}</button>
        <button type="button" className="link" onClick={() => { setCriando(!criando); setErro(""); }}>
          {criando ? "Já tenho conta" : "Ainda não tenho conta"}
        </button>
      </form>
    </main>
  );
}
