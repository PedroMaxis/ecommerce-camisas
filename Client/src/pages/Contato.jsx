import { useRef, useState } from "react";
import { api } from "../lib/api";
import { useAvisos, useSessao } from "../lib/contextos";
import { gsap, SEM_PREFERENCIA, useGSAP } from "../lib/gsap";

export default function Contato() {
  const { usuario } = useSessao();
  const avisar = useAvisos();
  const raiz = useRef(null);
  const [campos, setCampos] = useState({ name: usuario?.name ?? "", email: usuario?.email ?? "", subject: "", body: "" });
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const muda = (k) => (e) => setCampos((c) => ({ ...c, [k]: e.target.value }));

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(SEM_PREFERENCIA, () => { gsap.from(".titulo-pagina, .sub-pagina, .formulario, .canal", { y: 40, opacity: 0, duration: 0.7, stagger: 0.08, ease: "ginga" }); });
  }, { scope: raiz });

  const enviar = async (e) => {
    e.preventDefault();
    setErro(""); setEnviando(true);
    try { await api("/contact", { method: "POST", corpo: campos }); setEnviado(true); avisar("Mensagem enviada. A gente responde por e-mail!"); }
    catch (err) { setErro(err.message); gsap.fromTo(".formulario", { x: 0 }, { x: 12, duration: 0.7, ease: "tremor" }); }
    finally { setEnviando(false); }
  };

  return (
    <main className="pagina" ref={raiz}>
      <h1 className="titulo-pagina">Fale com<br />a gente</h1>
      <p className="sub-pagina">Troca, dúvida de tamanho, elogio, reclamação. Lemos tudo e respondemos por e-mail em até 2 dias úteis.</p>
      <div className="contato-grade">
        {enviado ? (
          <div className="painel verde"><h2 style={{ fontSize: "1.8rem", marginBottom: 8 }}>Recebemos!</h2><p>Valeu por escrever, {campos.name.split(" ")[0]}. Respondemos em {campos.email}.</p></div>
        ) : (
          <form className="formulario" onSubmit={enviar} noValidate>
            <label>Nome<input value={campos.name} onChange={muda("name")} autoComplete="name" required /></label>
            <label>E-mail<input type="email" value={campos.email} onChange={muda("email")} autoComplete="email" required /></label>
            <label>Assunto<input value={campos.subject} onChange={muda("subject")} required /></label>
            <label>Mensagem<textarea value={campos.body} onChange={muda("body")} required minLength={10} /></label>
            {erro && <p className="erro" role="alert">{erro}</p>}
            <button className="btn grande" disabled={enviando}>{enviando ? "Enviando…" : "Enviar mensagem"}</button>
          </form>
        )}
        <div className="canais">
          <div className="canal"><strong>Trocas</strong>30 dias, sem custo. Informe o número do pedido.</div>
          <div className="canal"><strong>Atacado</strong>Quer revender? Escreva com o assunto “Atacado”.</div>
          <div className="canal"><strong>Imprensa</strong>Pauta, entrevista, parceria: é por aqui também.</div>
        </div>
      </div>
    </main>
  );
}
