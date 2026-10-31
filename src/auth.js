const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { HttpError, assincrono } = require("./errors");

const gerarHash = (senha) => bcrypt.hash(senha, 10);
const conferirSenha = (senha, hash) => bcrypt.compare(senha, hash);

const assinar = (usuario, { segredo, validade }) => jwt.sign({ sub: String(usuario.id), role: usuario.role }, segredo, { expiresIn: validade });

/** Exige "Authorization: Bearer <token>" válido e recarrega o usuário (papel e existência sempre atuais) */
const autenticar = ({ db, segredo }) =>
  assincrono(async (req, _res, next) => {
    const cabecalho = req.get("authorization") ?? "";
    const [tipo, token] = cabecalho.split(" ");
    if (tipo !== "Bearer" || !token) throw new HttpError(401, "Faça login para continuar.");
    let dados;
    try {
      dados = jwt.verify(token, segredo);
    } catch {
      throw new HttpError(401, "Sessão expirada ou inválida. Entre novamente.");
    }
    const usuario = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(Number(dados.sub));
    if (!usuario) throw new HttpError(401, "Usuário não encontrado.");
    req.usuario = usuario;
    next();
  });

const exigirAdmin = (req, _res, next) => {
  if (req.usuario?.role !== "admin") return next(new HttpError(403, "Apenas administradores podem fazer isso."));
  next();
};

module.exports = { gerarHash, conferirSenha, assinar, autenticar, exigirAdmin };
