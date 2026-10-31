/** Erro com status HTTP e (opcionalmente) detalhes para o cliente */
class HttpError extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.name = "HttpError";
    this.status = status;
    this.detalhes = detalhes;
  }
}

/** O Express 4 não captura erros de funções assíncronas: sem isto, uma rejeição derruba o processo */
const assincrono = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { HttpError, assincrono };
