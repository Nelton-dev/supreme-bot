const {
  enviarCardPerfil,
  enviarRankingComImagem,
  enviarWaifuComImagem,
  enviarLevelUp,
  enviarVitoriaBatalha
} = require('./imagens')

const { getUser } = require('../db')

// 🧠 PERFIL
async function mostrarPerfil(sock, jid, nome) {
  const user = getUser(nome)
  return enviarCardPerfil(sock, jid, nome, user)
}

// 🏆 RANKING
async function mostrarRanking(sock, jid, sorted) {
  return enviarRankingComImagem(sock, jid, sorted)
}

// 🎉 LEVEL UP AUTOMÁTICO
async function nivelSubiu(sock, jid, nome, novoNivel, novoTitulo) {
  return enviarLevelUp(sock, jid, nome, novoNivel, novoTitulo)
}

module.exports = {
  mostrarPerfil,
  mostrarRanking,
  nivelSubiu
}
