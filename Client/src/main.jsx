import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import App from "./App";
import { AvisosProvider, CarrinhoProvider, CatalogoProvider, FavoritosProvider, SessaoProvider } from "./lib/contextos";
import "./lib/gsap";
import "./styles.css";

function TopoAoMudar() {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (!hash) window.scrollTo(0, 0); }, [pathname, hash]);
  return null;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TopoAoMudar />
      <AvisosProvider>
        <SessaoProvider>
          <CatalogoProvider>
            <CarrinhoProvider>
              <FavoritosProvider>
                <App />
              </FavoritosProvider>
            </CarrinhoProvider>
          </CatalogoProvider>
        </SessaoProvider>
      </AvisosProvider>
    </BrowserRouter>
  </StrictMode>,
);
