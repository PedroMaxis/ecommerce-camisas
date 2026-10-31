import { lazy, Suspense } from "react";
import { Link, Route, Routes } from "react-router-dom";
import Carregando from "./components/Carregando";
import Cursor from "./components/Cursor";
import Navbar from "./components/Navbar";
import Rodape from "./components/Rodape";
const Admin = lazy(() => import("./pages/Admin"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Conta = lazy(() => import("./pages/Conta"));
const Contato = lazy(() => import("./pages/Contato"));
import Entrar from "./pages/Entrar";
const Faq = lazy(() => import("./pages/Faq"));
const Favoritos = lazy(() => import("./pages/Favoritos"));
import Home from "./pages/Home";
const Pedido = lazy(() => import("./pages/Pedido"));
const Pedidos = lazy(() => import("./pages/Pedidos"));
import Produto from "./pages/Produto";
const Sacola = lazy(() => import("./pages/Sacola"));
const Sobre = lazy(() => import("./pages/Sobre"));

export default function App() {
  return (
    <>
      <a href="#conteudo" className="sr">Pular para o conteúdo</a>
      <Navbar />
      <Cursor />
      <div id="conteudo">
        <Suspense fallback={<Carregando />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blusa/:id" element={<Produto />} />
          <Route path="/sacola" element={<Sacola />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/pedidos/:id" element={<Pedido />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/conta" element={<Conta />} />
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<div className="vazio"><h1>Página não encontrada</h1><p>Essa estampa a gente não fez.</p><Link to="/" className="btn">Voltar à loja</Link></div>} />
        </Routes>
        </Suspense>
      </div>
      <Rodape />
    </>
  );
}
