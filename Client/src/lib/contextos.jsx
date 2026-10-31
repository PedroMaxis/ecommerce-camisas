import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, guardarToken, lerToken } from "./api";

/* ---------- avisos (substituem os alert() antigos) ---------- */
const Avisos = createContext(null);
export const useAvisos = () => useContext(Avisos);

export function AvisosProvider({ children }) {
  const [lista, setLista] = useState([]);
  const n = useRef(0);
  const avisar = useCallback((texto, tipo = "ok") => {
    const id = ++n.current;
    setLista((l) => [...l.slice(-2), { id, texto, tipo }]);
    setTimeout(() => setLista((l) => l.filter((a) => a.id !== id)), 4200);
  }, []);
  return (
    <Avisos.Provider value={avisar}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {lista.map((a) => <div key={a.id} className={`aviso aviso-${a.tipo}`}>{a.texto}</div>)}
      </div>
    </Avisos.Provider>
  );
}

/* ---------- sessão ---------- */
const Sessao = createContext(null);
export const useSessao = () => useContext(Sessao);

export function SessaoProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [pronto, setPronto] = useState(!lerToken()); // sem token guardado não há o que verificar

  useEffect(() => {
    if (!lerToken()) return;
    api("/users/me").then((r) => setUsuario(r.user)).catch(() => guardarToken(null)).finally(() => setPronto(true));
  }, []);

  const entrar = useCallback(async (caminho, corpo) => {
    const r = await api(caminho, { method: "POST", corpo });
    guardarToken(r.token);
    setUsuario(r.user);
    return r.user;
  }, []);
  const sair = useCallback(() => { guardarToken(null); setUsuario(null); }, []);

  const valor = useMemo(() => ({
    usuario, pronto, sair, setUsuario,
    login: (email, password) => entrar("/users/login", { email, password }),
    cadastrar: (name, email, password) => entrar("/users/register", { name, email, password }),
  }), [usuario, pronto, sair, entrar]);
  return <Sessao.Provider value={valor}>{children}</Sessao.Provider>;
}

/* ---------- sacola ---------- */
const Carrinho = createContext(null);
export const useCarrinho = () => useContext(Carrinho);
const VAZIO = { items: [], totalCents: 0, count: 0 };

export function CarrinhoProvider({ children }) {
  const { usuario } = useSessao();
  const [carrinho, setCarrinho] = useState(VAZIO);

  useEffect(() => {
    if (!usuario) { setCarrinho(VAZIO); return; }
    let vivo = true;
    api("/cart").then((c) => vivo && setCarrinho(c)).catch(() => {});
    return () => { vivo = false; };
  }, [usuario]);

  const valor = useMemo(() => ({
    ...carrinho,
    adicionar: async (productId, size, quantity = 1) => setCarrinho(await api("/cart/items", { method: "POST", corpo: { productId, size, quantity } })),
    definir: async (productId, size, quantity) => setCarrinho(await api("/cart/items", { method: "PUT", corpo: { productId, size, quantity } })),
    limpar: () => setCarrinho(VAZIO),
  }), [carrinho]);
  return <Carrinho.Provider value={valor}>{children}</Carrinho.Provider>;
}

/* ---------- favoritos ---------- */
const Favoritos = createContext(null);
export const useFavoritos = () => useContext(Favoritos);

export function FavoritosProvider({ children }) {
  const { usuario } = useSessao();
  const [ids, setIds] = useState([]);

  useEffect(() => {
    if (!usuario) { setIds([]); return; }
    let vivo = true;
    api("/favorites").then((l) => vivo && setIds(l)).catch(() => {});
    return () => { vivo = false; };
  }, [usuario]);

  const alternar = useCallback(async (id) => {
    const tinha = ids.includes(id);
    setIds((l) => (tinha ? l.filter((x) => x !== id) : [id, ...l])); // otimista: o coração responde na hora
    try { await api(`/favorites/${id}`, { method: tinha ? "DELETE" : "PUT" }); }
    catch (e) { setIds((l) => (tinha ? [id, ...l] : l.filter((x) => x !== id))); throw e; }
    return !tinha;
  }, [ids]);

  const valor = useMemo(() => ({ ids, tem: (id) => ids.includes(id), alternar }), [ids, alternar]);
  return <Favoritos.Provider value={valor}>{children}</Favoritos.Provider>;
}

/* ---------- catálogo (carregado uma vez e compartilhado: busca, vitrine, faixa, relacionados) ---------- */
const Catalogo = createContext(null);
export const useCatalogo = () => useContext(Catalogo);

export function CatalogoProvider({ children }) {
  const [produtos, setProdutos] = useState(null);
  const [erro, setErro] = useState("");
  const carregar = useCallback(() => { setErro(""); api("/products").then(setProdutos).catch((e) => setErro(e.message)); }, []);
  useEffect(carregar, [carregar]);
  const valor = useMemo(() => ({ produtos, erro, recarregar: carregar, porId: (id) => produtos?.find((p) => p.id === Number(id)) }), [produtos, erro, carregar]);
  return <Catalogo.Provider value={valor}>{children}</Catalogo.Provider>;
}
