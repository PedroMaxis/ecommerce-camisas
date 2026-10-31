const CHAVE = "loja.token";

export const lerToken = () => {
  try { return localStorage.getItem(CHAVE); } catch { return null; }
};
export const guardarToken = (t) => {
  try { t ? localStorage.setItem(CHAVE, t) : localStorage.removeItem(CHAVE); } catch { /* modo privado */ }
};

export class ErroApi extends Error {
  constructor(status, mensagem) { super(mensagem); this.status = status; }
}

/** fetch com JSON e token; erros viram ErroApi com a mensagem em português vinda do servidor */
export async function api(caminho, { method = "GET", corpo } = {}) {
  const token = lerToken();
  let resp;
  try {
    resp = await fetch(`/api${caminho}`, {
      method,
      headers: { ...(corpo ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroApi(0, "Sem conexão com o servidor. Tente de novo.");
  }
  if (resp.status === 204) return null;
  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new ErroApi(resp.status, dados.error || "Algo deu errado.");
  return dados;
}
