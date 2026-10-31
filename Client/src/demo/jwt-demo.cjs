// Substitui o jsonwebtoken no demo. NÃO é seguro (o token não é assinado): serve só para a sessão da loja de demonstração.
const codificar = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const decodificar = (t) => JSON.parse(decodeURIComponent(escape(atob(t))));
const DIAS = 7 * 24 * 3600 * 1000;

module.exports = {
  sign: (payload) => codificar({ ...payload, exp: Date.now() + DIAS }),
  verify: (token) => {
    const d = decodificar(token);
    if (!d.exp || d.exp < Date.now()) throw new Error("expirado");
    return d;
  },
};
