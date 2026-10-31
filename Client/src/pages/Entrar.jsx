import { useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useSessao } from "../lib/contextos";
import { gsap, SEM_PREFERENCIA, useGSAP } from "../lib/gsap";

export default function Entrar() {
  const { usuario, login, cadastrar } = useSessao();
  const [criando, setCriando] = useState(false);
  const [campos, setCampos] = useState({ name: "", email: "", password: "" });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { state } = useLocation();
  const ir = useNavigate();
  const raiz = useRef(null);
  const destino = state?.de ?? "/";

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(SEM_PREFERENCIA, () => { gsap.from("form > *", { y: 24, opacity: 0, duration: 0.6, stagger: 0.06, ease: "ginga" }); });
  }, { scope: raiz, dependencies: [criando] });

  if (usuario) return <Navigate to={destino} replace />;
  const muda = (k) => (e) => setCampos((c) => ({ ...c, [k]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setErro(""); setEnviando(true);
    try {
      if (criando) await cadastrar(campos.name, campos.email, campos.password);
      else await login(campos.email, campos.password);
      ir(destino, { replace: true });
    } catch (err) {
      setErro(err.message);
      gsap.fromTo("form", { x: 0 }, { x: 16, duration: 0.7, ease: "tremor" }); // sacudida (CustomWiggle)
    } finally { setEnviando(false); }
  };

  return (
    <main className="pagina centro entrar" ref={raiz}>
      <form onSubmit={enviar} noValidate>
        <h1>{criando ? "Criar conta" : "Entrar"}</h1>
        {state?.de && <p className="mono">Entre para continuar.</p>}
        {criando && <label>Nome<input value={campos.name} onChange={muda("name")} autoComplete="name" required /></label>}
        <label>E-mail<input type="email" value={campos.email} onChange={muda("email")} autoComplete="email" required /></label>
        <label>Senha<input type="password" value={campos.password} onChange={muda("password")} autoComplete={criando ? "new-password" : "current-password"} required minLength={8} />
          {criando && <small>Mínimo de 8 caracteres.</small>}</label>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="btn grande" disabled={enviando}>{enviando ? "Aguarde…" : criando ? "Criar conta" : "Entrar"}</button>
        <button type="button" className="link" onClick={() => { setCriando(!criando); setErro(""); }}>{criando ? "Já tenho conta" : "Ainda não tenho conta"}</button>
      </form>
    </main>
  );
}
