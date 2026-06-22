const fs = require('fs')
const { getUser, saveUser } = require('../db')

const CONQUISTAS_PATH = './data/conquistas.json'

function carregarConquistas() {
  if (!fs.existsSync(CONQUISTAS_PATH)) {
    fs.writeFileSync(CONQUISTAS_PATH, JSON.stringify({}, null, 2))
    return {}
  }
  return JSON.parse(fs.readFileSync(CONQUISTAS_PATH, 'utf8'))
}

function salvarConquistas(data) {
  fs.writeFileSync(CONQUISTAS_PATH, JSON.stringify(data, null, 2))
}

// ════════════════════════════════════════
//  DEFINIÇÃO DAS CONQUISTAS
// ════════════════════════════════════════

const CONQUISTAS = [
  {
    id: 'despertar',
    nome: '🔥 Primeiro Passo',
    titulo: 'Iniciado',
    desc: 'Complete o Ritual de Despertar',
    categoria: 'Progresso',
    emoji: '🌌',
    verificar: function(progresso, user) {
      return user.despertou ? 1 : 0
    },
    meta: 1,
    recompensa: { xp: 0, pontos: 50, item: null }
  },
  {
    id: 'quiz_mestre',
    nome: '🧠 Mestre do Quiz',
    titulo: 'Sábio do Nexus',
    desc: 'Acerte 50 quizzes',
    categoria: 'Jogos',
    emoji: '📝',
    verificar: function(progresso, user) {
      return (progresso || 0) + 1
    },
    meta: 50,
    recompensa: { xp: 200, pontos: 150, item: 'fragmento_sabedoria' }
  },
  {
    id: 'batalhas',
    nome: '⚔️ Guerreiro Nato',
    titulo: 'Espadachim',
    desc: 'Vença 10 batalhas',
    categoria: 'Combate',
    emoji: '⚔️',
    verificar: function(progresso, user) {
      return (progresso || 0) + 1
    },
    meta: 10,
    recompensa: { xp: 300, pontos: 200, item: 'fragmento_poder' }
  },
  {
    id: 'torneios',
    nome: '🏆 Campeão',
    titulo: 'Gladiador',
    desc: 'Vença 3 torneios',
    categoria: 'Combate',
    emoji: '🏟️',
    verificar: function(progresso, user) {
      return (progresso || 0) + 1
    },
    meta: 3,
    recompensa: { xp: 500, pontos: 400, item: 'fragmento_gloria' }
  },
  {
    id: 'bosses',
    nome: '💀 Caçador de Bosses',
    titulo: 'Exterminador',
    desc: 'Derrote 20 bosses na Masmorra',
    categoria: 'Masmorra',
    emoji: '💀',
    verificar: function(progresso, user) {
      return (progresso || 0) + 1
    },
    meta: 20,
    recompensa: { xp: 400, pontos: 300, item: 'fragmento_cacador' }
  },
  {
    id: 'pontos',
    nome: '💰 Magnata',
    titulo: 'Comerciante',
    desc: 'Acumule 5000 pontos',
    categoria: 'Riqueza',
    emoji: '💰',
    verificar: function(progresso, user) {
      return user.pontos || 0
    },
    meta: 5000,
    recompensa: { xp: 200, pontos: 500, item: 'fragmento_riqueza' }
  },
  {
    id: 'rank_s',
    nome: '🌟 Rank S',
    titulo: 'Elite',
    desc: 'Alcance o Rank S',
    categoria: 'Progresso',
    emoji: '🌟',
    verificar: function(progresso, user) {
      const ranks = ['S', 'SS', 'Nacional', 'Monarca', 'Divino']
      return ranks.includes(user.rank) ? 1 : 0
    },
    meta: 1,
    recompensa: { xp: 1000, pontos: 800, item: 'fragmento_elite' }
  },
  {
    id: 'guilda_grande',
    nome: '🏰 Líder',
    titulo: 'Estrategista',
    desc: 'Tenha uma Guilda com 10+ membros',
    categoria: 'Social',
    emoji: '🏰',
    verificar: function(progresso, user) {
      // Precisa ser verificado externamente
      return progresso || 0
    },
    meta: 10,
    recompensa: { xp: 500, pontos: 400, item: 'fragmento_lider' }
  },
  {
    id: 'lorekeeper',
    nome: '📜 Lorekeeper',
    titulo: 'Arquivista',
    desc: 'Complete todas as missões épicas',
    categoria: 'História',
    emoji: '📜',
    verificar: function(progresso, user) {
      return progresso || 0
    },
    meta: 12,
    recompensa: { xp: 1500, pontos: 1000, item: 'fragmento_lore' }
  },
  {
    id: 'lenda',
    nome: '👑 Lenda do Nexus',
    titulo: 'Lenda Viva',
    desc: 'Complete todas as conquistas',
    categoria: 'Especial',
    emoji: '👑',
    verificar: function(progresso, user) {
      return 0 // Verificação especial
    },
    meta: 9,
    recompensa: { xp: 5000, pontos: 3000, item: 'coroa_do_nexus' }
  }
]

// ════════════════════════════════════════
//  INICIALIZAR CONQUISTAS
// ════════════════════════════════════════
function inicializarConquistas(nome) {
  const conquistas = carregarConquistas()
  if (!conquistas[nome]) {
    conquistas[nome] = {}
    CONQUISTAS.forEach(c => {
      conquistas[nome][c.id] = { progresso: 0, completa: false }
    })
    salvarConquistas(conquistas)
  }
  return conquistas[nome]
}

// ════════════════════════════════════════
//  VERIFICAR PROGRESSO DE CONQUISTAS
// ════════════════════════════════════════
function verificarConquistas(nome, tipo, valorAdicional) {
  const conquistas = carregarConquistas()
  const jogador = conquistas[nome]
  if (!jogador) return []

  const user = getUser(nome)
  const completas = []

  CONQUISTAS.forEach(c => {
    if (jogador[c.id] && jogador[c.id].completa) return

    if (!jogador[c.id]) {
      jogador[c.id] = { progresso: 0, completa: false }
    }

    const prog = jogador[c.id]

    if (c.id === tipo || tipo === 'todas') {
      const novoProgresso = c.verificar(valorAdicional, user)
      prog.progresso = novoProgresso

      if (prog.progresso >= c.meta) {
        prog.completa = true
        completas.push(c)
      }
    }

    // Verificação especial para Lenda do Nexus
    if (c.id === 'lenda') {
      const outrasCompletas = CONQUISTAS.filter(conq => conq.id !== 'lenda').filter(conq => jogador[conq.id]?.completa).length
      prog.progresso = outrasCompletas
      if (outrasCompletas >= c.meta && !prog.completa) {
        prog.completa = true
        completas.push(c)
      }
    }
  })

  salvarConquistas(conquistas)
  return completas
}

// ════════════════════════════════════════
//  VER CONQUISTAS
// ════════════════════════════════════════
async function verConquistas(sock, jid, nome) {
  const user = getUser(nome)
  if (!user.despertou) {
    await sock.sendMessage(jid, { text: '🌌 Você ainda não despertou no Nexus World!' })
    return
  }

  const conquistas = carregarConquistas()
  const jogador = conquistas[nome]
  if (!jogador) {
    inicializarConquistas(nome)
    await sock.sendMessage(jid, { text: '🏅 Suas conquistas foram inicializadas! Use *!conquistas* novamente.' })
    return
  }

  let txt = '🏅 *CONQUISTAS DO NEXUS WORLD*\n\n'

  const categorias = {}
  CONQUISTAS.forEach(c => {
    if (!categorias[c.categoria]) categorias[c.categoria] = []
    categorias[c.categoria].push(c)
  })

  for (const [cat, lista] of Object.entries(categorias)) {
    txt += '*── ' + cat + ' ──*\n\n'
    lista.forEach(c => {
      const prog = jogador[c.id]
      const completa = prog && prog.completa
      const status = completa ? '✅' : (prog ? '🔄' : '🔒')
      txt += status + ' ' + c.emoji + ' *' + c.nome + '*\n'
      txt += '   ' + c.desc + '\n'
      txt += '   🏅 Título: _' + c.titulo + '_'
      if (prog && !completa) {
        txt += ' | Progresso: ' + prog.progresso + '/' + c.meta
      }
      txt += '\n\n'
    })
  }

  await sock.sendMessage(jid, { text: txt })
}

// ════════════════════════════════════════
//  NOTIFICAR CONQUISTA COMPLETA
// ════════════════════════════════════════
async function notificarConquista(sock, jid, nome, conquista) {
  const user = getUser(nome)
  user.xp = (user.xp || 0) + conquista.recompensa.xp
  user.pontos = (user.pontos || 0) + conquista.recompensa.pontos
  if (conquista.titulo && !user.titulo_conquista) {
    user.titulo_conquista = conquista.titulo
  }
  if (conquista.recompensa.item) {
    if (!user.inventario) user.inventario = []
    user.inventario.push(conquista.recompensa.item)
  }
  saveUser(nome, user)

  const txt = '🏅 *CONQUISTA DESBLOQUEADA!*\n\n' +
    conquista.emoji + ' *' + conquista.nome + '*\n' +
    '📝 ' + conquista.desc + '\n\n' +
    '🏅 Título: *' + conquista.titulo + '*\n' +
    '🌟 Recompensas:\n' +
    '+' + conquista.recompensa.xp + ' XP\n' +
    '+' + conquista.recompensa.pontos + ' pontos' +
    (conquista.recompensa.item ? '\n🎁 Item: *' + conquista.recompensa.item + '*' : '')

  await sock.sendMessage(jid, { text: txt })
}

module.exports = {
  inicializarConquistas,
  verificarConquistas,
  verConquistas,
  notificarConquista
}
