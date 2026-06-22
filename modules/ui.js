const {
  enviarCardPerfil,
  enviarImagem,
  enviarRankingComImagem,
  enviarLevelUp,
  enviarVitoriaBatalha
} = require('./imagens')
const { getUser, RANKS } = require('../db')

// ════════════════════════════════════════
//  PERFIL ATUALIZADO (com rank do sistema)
// ════════════════════════════════════════
async function mostrarPerfil(sock, jid, nome) {
  const user = getUser(nome)

  // Determina o rank atual e o próximo
  const rankAtual = user.rank || 'E'
  const rankIdx = RANKS.findIndex(r => r.rank === rankAtual)
  const proxRank = RANKS[rankIdx + 1] || null

  const xpAtual = user.xp_rank || 0
  const xpProx = proxRank ? proxRank.xp : xpAtual
  const progresso = proxRank ? Math.min(100, Math.round((xpAtual / xpProx) * 100)) : 100

  // Barra de progresso (10 blocos)
  const blocos = Math.floor(progresso / 10)
  const barra = '█'.repeat(blocos) + '░'.repeat(10 - blocos)

  // Legenda completa com rank
  const caption = 
`👤 *${nome}*
🏅 ${user.titulo || 'Novato'}
🌌 *Rank:* ${user.titulo_rank || 'Caçador Rank E'}
⭐ Nível do Rank: ${user.nivel_rank || 1}
📊 Progresso: [${barra}] ${progresso}% (${xpAtual}/${xpProx} XP)
━━━━━━━━━━━━━━━━━━━
💰 Pontos: ${user.pontos || 0}
⚔️ Ataque: ${user.ataque || 10}
❤️ Vida: ${user.vida || 100}
🏆 Vitórias: ${user.vitorias || 0}
⚡ Habilidade: ${user.habilidade_ativa || 'Nenhuma'}
🐾 Pet: ${user.pet_ativo || 'Nenhum'}`

  // Se já tem avatar, envia diretamente com a nova legenda
  if (user.avatar && Buffer.isBuffer(user.avatar) && user.avatar.length > 500) {
    await enviarImagem(sock, jid, user.avatar, caption)
    return
  }

  // Se não tem avatar, gera e passa a nova legenda
  await enviarCardPerfil(sock, jid, nome, user, caption)
}

// ════════════════════════════════════════
//  RANKING (mantém a chamada existente)
// ════════════════════════════════════════
async function mostrarRanking(sock, jid, sorted) {
  return enviarRankingComImagem(sock, jid, sorted)
}

// ════════════════════════════════════════
//  LEVEL UP (mantém)
// ════════════════════════════════════════
async function nivelSubiu(sock, jid, nome, novoNivel, novoTitulo) {
  return enviarLevelUp(sock, jid, nome, novoNivel, novoTitulo)
}

module.exports = {
  mostrarPerfil,
  mostrarRanking,
  nivelSubiu
}
