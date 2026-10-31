import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Loja from "./pages/Loja";
import Produto from "./pages/Produto";
import Carrinho from "./pages/Carrinho";
import Pedidos from "./pages/Pedidos";
import Entrar from "./pages/Entrar";
import { Link } from "react-router-dom";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Loja />} />
        <Route path="/camisa/:id" element={<Produto />} />
        <Route path="/carrinho" element={<Carrinho />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/entrar" element={<Entrar />} />
        <Route path="*" element={<main className="vazio"><h1>Página não encontrada</h1><Link to="/" className="btn">Voltar à loja</Link></main>} />
      </Routes>
      <footer className="rodape">Tinta Fresca · projeto de estudo, nenhuma compra é cobrada de verdade.</footer>
    </>
  );
}
