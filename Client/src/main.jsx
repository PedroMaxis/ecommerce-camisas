import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { useEffect } from "react";
import App from "./App";
import { AvisosProvider, CarrinhoProvider, SessaoProvider } from "./lib/contextos";
import "./styles.css";

function TopoAoMudar() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <TopoAoMudar />
      <AvisosProvider>
        <SessaoProvider>
          <CarrinhoProvider>
            <App />
          </CarrinhoProvider>
        </SessaoProvider>
      </AvisosProvider>
    </BrowserRouter>
  </StrictMode>,
);
