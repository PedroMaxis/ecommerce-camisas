// Substitui o bcryptjs no demo (a senha fica só na memória desta aba). NÃO usar fora do demo.
const marca = (senha) => "demo$" + btoa(unescape(encodeURIComponent(senha)));
module.exports = { hash: async (senha) => marca(senha), compare: async (senha, hash) => marca(senha) === hash };
