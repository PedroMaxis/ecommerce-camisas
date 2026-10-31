import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCarrinho, useSessao } from "../lib/contextos";

export default function Navbar() {
  const { usuario, sair } = useSessao();
  const { count } = useCarrinho();
  const ir = useNavigate();
  return (
    <header className="topo">
      <Link to="/" className="marca" aria-label="Tinta Fresca, início">
        <span className="marca-gota" aria-hidden="true" />Tinta Fresca
      </Link>
      <nav aria-label="Principal">
        <NavLink to="/" end>Camisas</NavLink>
        {usuario && <NavLink to="/pedidos">Pedidos</NavLink>}
        <NavLink to="/carrinho" className="carrinho-link">
          Sacola{count > 0 && <b className="contador" aria-label={`${count} itens`}>{count}</b>}
        </NavLink>
        {usuario ? (
          <button className="link" onClick={() => { sair(); ir("/"); }} title={usuario.email}>Sair ({usuario.name.split(" ")[0]})</button>
        ) : (
          <NavLink to="/entrar">Entrar</NavLink>
        )}
      </nav>
    </header>
  );
}
