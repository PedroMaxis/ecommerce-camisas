// O cupom escolhido na sacola acompanha a pessoa até o checkout (sessionStorage: some ao fechar a aba)
const CHAVE = "ginga.cupom";
export const lerCupom = () => { try { return sessionStorage.getItem(CHAVE) ?? ""; } catch { return ""; } };
export const guardarCupom = (c) => { try { c ? sessionStorage.setItem(CHAVE, c) : sessionStorage.removeItem(CHAVE); } catch { /* sem storage */ } };
