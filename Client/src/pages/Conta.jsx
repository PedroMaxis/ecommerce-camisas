import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Protegida from "../components/Protegida";
import { api } from "../lib/api";
import { useAvisos, useSessao } from "../lib/contextos";

function Perfil() {
  const { usuario, setUsuario, sair } = useSessao();
  const avisar = useAvisos();
  const ir = useNavigate();
  const [nome, setNome] = useState(usuario.name);
  const [senhas, setSenhas] = useState({ atual: "", nova: "" });
  const [erroNome, setErroNome] = useState("");
  const [erroSenha, setErroSenha] = useState("");

  const salvarNome = async (e) => {
    e.preventDefault(); setErroNome("");
    try { const r = await api("/users/me", { method: "PATCH", corpo: { name: nome } }); setUsuario(r.user); avisar("Nome atualizado."); }
    catch (err) { setErroNome(err.message); }
  };
  const trocarSenha = async (e) => {
    e.preventDefault(); setErroSenha("");
    try { await api("/users/me/password", { method: "POST", corpo: { currentPassword: senhas.atual, newPassword: senhas.nova } }); setSenhas({ atual: "", nova: "" }); avisar("Senha alterada."); }
    catch (err) { setErroSenha(err.message); }
  };

  return (
    <main className="pagina">
      <h1 className="titulo-pagina">Minha conta</h1>
      <p className="sub-pagina">{usuario.email}{usuario.role === "admin" && " · administrador"}</p>
      <div className="contato-grade">
        <div style={{ display: "grid", gap: 26 }}>
          <form className="formulario" onSubmit={salvarNome} style={{ boxShadow: "8px 8px 0 var(--amarelo)" }}>
            <h2 style={{ fontSize: "1.4rem" }}>Seu nome</h2>
            <label>Nome<input value={nome} onChange={(e) => setNome(e.target.value)} required minLength={2} /></label>
            {erroNome && <p className="erro" role="alert">{erroNome}</p>}
            <button className="btn">Salvar nome</button>
          </form>
          <form className="formulario" onSubmit={trocarSenha}>
            <h2 style={{ fontSize: "1.4rem" }}>Trocar senha</h2>
            <label>Senha atual<input type="password" value={senhas.atual} onChange={(e) => setSenhas((s) => ({ ...s, atual: e.target.value }))} autoComplete="current-password" required /></label>
            <label>Nova senha<input type="password" value={senhas.nova} onChange={(e) => setSenhas((s) => ({ ...s, nova: e.target.value }))} autoComplete="new-password" required minLength={8} /><small>Mínimo de 8 caracteres.</small></label>
            {erroSenha && <p className="erro" role="alert">{erroSenha}</p>}
            <button className="btn azul">Alterar senha</button>
          </form>
        </div>
        <div className="canais">
          <Link to="/pedidos" className="canal"><strong>Meus pedidos</strong>Acompanhe, pague ou cancele.</Link>
          <Link to="/favoritos" className="canal"><strong>Favoritos</strong>As blusas que você guardou.</Link>
          {usuario.role === "admin" && <Link to="/admin" className="canal"><strong>Painel admin</strong>Pedidos, estoque e mensagens.</Link>}
          <button className="btn vazado" onClick={() => { sair(); ir("/"); }}>Sair da conta</button>
        </div>
      </div>
    </main>
  );
}
export default function Conta() { return <Protegida><Perfil /></Protegida>; }
