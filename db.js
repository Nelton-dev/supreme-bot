const fs = require('fs')

const PATH = './data/users.json'

if (!fs.existsSync(PATH)) {
  fs.writeFileSync(PATH, '{}')
}

let cache = JSON.parse(fs.readFileSync(PATH, 'utf8'))
let dirty = false

function salvar() {
  fs.writeFileSync(PATH, JSON.stringify(cache, null, 2))
  dirty = false
}

function getUser(nome, criar = true) {
  if (!cache[nome] && criar) {
    cache[nome] = {
      xp: 0,
      nivel: 1,
      pontos: 0,
      titulo: 'Novato',
      vida: 100,
      ataque: 10,
      inventario: [],
      ultimoDiario: null,
      ultimaMasmorra: null,
      vitorias: 0,
      despertou: false,
      rank: null,
      nivel_rank: 1,
      xp_rank: 0,
      titulo_rank: null,
      ultima_atividade: Date.now(),
      elemento: null,
      afinidade: {},
      habilidades_combate: [],
      buffs_ativos: []
    }
    dirty = true
  }
  return cache[nome]
}

function saveUser(nome, user) {
  cache[nome] = user
  dirty = true
}

function todosUsuarios() {
  return cache
}

function resetarCache() {
  cache = {}
  dirty = true
  salvar()
}

function removerUsuario(nome) {
  delete cache[nome]
  dirty = true
  salvar()
}

// ════════════════════════════════════════
//  SISTEMA DE RANKS
// ════════════════════════════════════════

const RANKS = [
  { rank: 'E', nome: 'Caçador Rank E', xp: 0 },
  { rank: 'D', nome: 'Caçador Rank D', xp: 200 },
  { rank: 'C', nome: 'Caçador Rank C', xp: 500 },
  { rank: 'B', nome: 'Caçador Rank B', xp: 1000 },
  { rank: 'A', nome: 'Caçador Rank A', xp: 2000 },
  { rank: 'S', nome: 'Caçador Rank S', xp: 5000 },
  { rank: 'SS', nome: 'Caçador Rank SS', xp: 10000 },
  { rank: 'Nacional', nome: 'Caçador Nacional', xp: 20000 },
  { rank: 'Monarca', nome: 'Monarca', xp: 50000 },
  { rank: 'Divino', nome: 'Ser Divino', xp: 100000 }
]

const COMANDOS_POR_RANK = {
  'E': ['perfil', 'quiz', 'adivinhar', 'diario', 'waifu', 'ranking', 'ajuda', 'missoes'],
  'D': ['batalha', 'criar-cla', 'entrar-cla', 'loja', 'comprar', 'sair-cla', 'clans', 'cla', 'propor', 'aceitar-casamento', 'recusar-casamento', 'divorcio', 'casal'],
  'C': ['torneio', 'inscrever', 'apostar', 'atacar', 'vertorneio'],
  'B': ['voz', 'frase', 'ia', 'resumo', 'recomendar', 'analisar', 'comparar', 'curiosidade', 'traduzir'],
  'A': ['torneio clans', 'img', 'musica', 'debate', 'argumento', 'encerrar'],
  'S': ['modo_seis', 'admin']
}

function obterRankAtual(user) {
  if (!user.rank) return RANKS[0]
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (user.rank === RANKS[i].rank) return RANKS[i]
  }
  return RANKS[0]
}

function obterProximoRank(user) {
  const atual = obterRankAtual(user)
  const idx = RANKS.findIndex(r => r.rank === atual.rank)
  return RANKS[idx + 1] || null
}

function adicionarXpRank(nome, quantidade) {
  const user = getUser(nome)
  if (!user.despertou) return false
  user.xp_rank = (user.xp_rank || 0) + quantidade
  user.ultima_atividade = Date.now()
  saveUser(nome, user)
  return verificarSubidaRank(nome)
}

function verificarSubidaRank(nome) {
  const user = getUser(nome)
  const prox = obterProximoRank(user)
  if (!prox) return false
  if (user.xp_rank >= prox.xp) {
    user.rank = prox.rank
    user.titulo_rank = prox.nome
    user.nivel_rank = 1
    saveUser(nome, user)
    return true
  }
  return false
}

function penalizarDerrota(nome, quantidade = 5) {
  const user = getUser(nome)
  if (!user.despertou) return
  user.xp_rank = Math.max(0, (user.xp_rank || 0) - quantidade)
  saveUser(nome, user)
}

function aplicarTaxaDiaria() {
  const usuarios = cache
  const agora = Date.now()
  const doisDias = 2 * 24 * 60 * 60 * 1000
  for (const nome in usuarios) {
    const user = usuarios[nome]
    if (!user.despertou) continue
    const ultimaAtividade = user.ultima_atividade || agora
    const tempoInativo = agora - ultimaAtividade
    if (tempoInativo > doisDias) {
      const diasInativo = Math.floor(tempoInativo / (1000 * 60 * 60 * 24))
      const penalidade = Math.min(50, diasInativo * 5)
      if (penalidade > 0) {
        user.xp_rank = Math.max(0, (user.xp_rank || 0) - penalidade)
        saveUser(nome, user)
      }
    }
    const rankIdx = RANKS.findIndex(r => r.rank === user.rank)
    if (rankIdx >= 5) {
      const taxa = Math.max(5, Math.min(50, Math.floor((user.xp_rank || 0) * 0.01)))
      if (taxa > 0 && tempoInativo <= doisDias) {
        user.xp_rank = Math.max(0, (user.xp_rank || 0) - taxa)
        saveUser(nome, user)
      }
    }
  }
}

function comandoPermitido(nome, comando) {
  const user = getUser(nome)
  if (!user.despertou) return false
  const rankAtual = user.rank || 'E'
  for (let i = 0; i < RANKS.length; i++) {
    const r = RANKS[i]
    if (r.rank === rankAtual) {
      for (let j = i; j >= 0; j--) {
        if (COMANDOS_POR_RANK[RANKS[j].rank]?.includes(comando)) return true
      }
      break
    }
  }
  return false
}

setInterval(() => { if (dirty) salvar() }, 30000)

process.on('SIGINT', () => { salvar(); process.exit() })
process.on('SIGTERM', () => { salvar(); process.exit() })

let ultimaExecucaoTaxa = null
setInterval(() => {
  const agora = new Date()
  const hoje = agora.toDateString()
  if (hoje !== ultimaExecucaoTaxa && agora.getHours() === 0) {
    ultimaExecucaoTaxa = hoje
    aplicarTaxaDiaria()
  }
}, 60000)

module.exports = {
  getUser, saveUser, todosUsuarios, resetarCache, removerUsuario,
  adicionarXpRank, verificarSubidaRank, penalizarDerrota,
  comandoPermitido, RANKS, aplicarTaxaDiaria
}
