const { Router } = require("express");
const { assincrono, HttpError } = require("../errors");
const v = require("../validar");
const { gerarHash, conferirSenha, assinar, autenticar } = require("../auth");

module.exports = function rotasUsuarios({ db, config }) {
  const r = Router();
  const publico = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
  const resposta = (u) => ({ token: assinar(u, config), user: publico(u) });

  r.post("/register", assincrono(async (req, res) => {
    const name = v.texto(req.body?.name, { campo: "nome", min: 2, max: 80 });
    const email = v.email(req.body?.email);
    const senha = v.senha(req.body?.password);
    if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) throw new HttpError(409, "Este e-mail já está cadastrado.");
    const hash = await gerarHash(senha);
    const { lastInsertRowid } = db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)").run(name, email, hash);
    const usuario = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(Number(lastInsertRowid));
    res.status(201).json(resposta(usuario));
  }));

  r.post("/login", assincrono(async (req, res) => {
    const email = v.email(req.body?.email);
    const linha = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    // mesma mensagem para e-mail inexistente e senha errada: não revela quem tem conta
    if (!linha || !(await conferirSenha(String(req.body?.password ?? ""), linha.password_hash))) throw new HttpError(401, "E-mail ou senha incorretos.");
    res.json(resposta(linha));
  }));

  const auth = autenticar({ db, segredo: config.segredo });
  r.get("/me", auth, (req, res) => res.json({ user: publico(req.usuario) }));

  r.patch("/me", auth, (req, res) => {
    const name = v.texto(req.body?.name, { campo: "nome", min: 2, max: 80 });
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, req.usuario.id);
    res.json({ user: publico({ ...req.usuario, name }) });
  });

  r.post("/me/password", auth, assincrono(async (req, res) => {
    const nova = v.senha(req.body?.newPassword);
    const linha = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(req.usuario.id);
    if (!(await conferirSenha(String(req.body?.currentPassword ?? ""), linha.password_hash))) throw new HttpError(401, "A senha atual está incorreta.");
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await gerarHash(nova), req.usuario.id);
    res.status(204).end();
  }));
  return r;
};
