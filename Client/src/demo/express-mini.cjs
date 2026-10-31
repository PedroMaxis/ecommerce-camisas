// Mini-Express para o demo no navegador: só o que as rotas da loja usam (Router, get/post/put/patch/delete, use, next).
// As rotas de src/routes rodam sem mudança; o "servidor" está em servidor.js.
function compilar(caminho) {
  const chaves = [];
  const re = new RegExp("^" + caminho.replace(/\/+$/, "").replace(/:([A-Za-z_]+)/g, (_, k) => { chaves.push(k); return "([^/]+)"; }) + "/?$");
  return { re, chaves };
}

function rodar(handlers, req, res, fim) {
  let k = 0;
  const prox = (erro) => {
    if (erro) return fim(erro);
    const h = handlers[k++];
    if (!h) return fim();
    try { h(req, res, prox); } catch (e) { fim(e); }
  };
  prox();
}

function despachar(camadas, req, res, saida) {
  let i = 0;
  const proximo = (erro) => {
    if (erro) return saida(erro);
    if (res.enviado) return undefined;
    const c = camadas[i++];
    if (!c) return saida();
    if (c.metodo) {
      if (c.metodo !== req.method) return proximo();
      const m = c.re.exec(req.url);
      if (!m) return proximo();
      req.params = Object.fromEntries(c.chaves.map((k, j) => [k, decodeURIComponent(m[j + 1])]));
      return rodar(c.handlers, req, res, proximo);
    }
    const url = req.url;
    if (c.prefixo) {
      if (url !== c.prefixo && !url.startsWith(c.prefixo + "/")) return proximo();
      req.url = url.slice(c.prefixo.length) || "/";
      return rodar(c.handlers, req, res, (e) => { req.url = url; proximo(e); });
    }
    return rodar(c.handlers, req, res, proximo);
  };
  proximo();
}

function Router() {
  const camadas = [];
  const r = (req, res, next) => despachar(camadas, req, res, next);
  for (const m of ["get", "post", "put", "patch", "delete"]) {
    r[m] = (caminho, ...handlers) => { camadas.push({ metodo: m.toUpperCase(), ...compilar(caminho), handlers: handlers.flat() }); return r; };
  }
  r.use = (...args) => {
    const prefixo = typeof args[0] === "string" ? args.shift() : "";
    camadas.push({ prefixo, handlers: args.flat() });
    return r;
  };
  return r;
}

module.exports = { Router };
