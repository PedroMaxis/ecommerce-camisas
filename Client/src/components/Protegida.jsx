import { Link, Navigate, useLocation } from "react-router-dom";
import Carregando from "./Carregando";
import { useSessao } from "../lib/contextos";

/** Só deixa passar quem está logado (e, se `admin`, quem é administrador) */
export default function Protegida({ admin = false, children }) {
  const { usuario, pronto } = useSessao();
  const { pathname } = useLocation();
  if (!pronto) return <Carregando />;
  if (!usuario) return <Navigate to="/entrar" state={{ de: pathname }} replace />;
  if (admin && usuario.role !== "admin") return <div className="vazio"><h1>Acesso restrito</h1><p>Esta área é só para quem administra a loja.</p><Link to="/" className="btn">Voltar à loja</Link></div>;
  return children;
}
