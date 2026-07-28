const fs = require('fs')
const { getUser, saveUser } = require('../db')

const MISSOES_PATH = './data/missoes_epicas.json'

function carregarMissoes() {
  if (!fs.existsSync(MISSOES_PATH)) {
    const base = {}
    fs.writeFileSync(MISSOES_PATH, JSON.stringify(base, null, 2))
    return base
  }
  return JSON.parse(fs.readFileSync(MISSOES_PATH, 'utf8'))
}

function salvarMissoes(data) {
  fs.writeFileSync(MISSOES_PATH, JSON.stringify(data, null, 2))
}

// ════════════════════════════════════════
//  DEFINIÇÃO DAS MISSÕES ÉPICAS
// ════════════════════════════════════════

const MISSOES_EPICAS = [
  // ATO I – O DESPERTAR
  {
    id: 'ato1_1',
    ato: 'I – O Despertar',
    nome: 'O Chamado do Vazio',
    desc: 'Complete o Ritual de Despertar e aceite o seu destino no Nexus.',
    objetivo: 'despertar',
    meta: 1,
    recompensa: { xp: 50, pontos: 30, titulo: null },
    lore: 'Do silêncio do Vazio, uma alma foi chamada. Os Pilares observam o novo Caçador com expectativa.',
    requer: null
  },
  {
    id: 'ato1_2',
    ato: 'I – O Despertar',
    nome: 'Primeira Centelha',
    desc: 'Alcance o Rank D para provar que a sua chama ainda não se apagou.',
    objetivo: 'rank',
    meta: 'D',
    recompensa: { xp: 80, pontos: 50, titulo: 'Portador da Centelha' },
    lore: 'A centelha elemental desperta dentro de si. Os Pilares sussurram o seu nome como um juramento antigo.',
    requer: 'ato1_1'
  },
  {
    id: 'ato1_3',
    ato: 'I – O Despertar',
    nome: 'O Pilar Reconhece',
    desc: 'Use o seu elemento na Masmorra Diária pela primeira vez.',
    objetivo: 'usar_elemento_masmorra',
    meta: 1,
    recompensa: { xp: 60, pontos: 40, titulo: null },
    lore: 'O Pilar elemental reconhece o seu poder. A afinidade começa a fluir como um rio sagrado.',
    requer: 'ato1_2'
  },

  // ATO II – A ASCENSÃO
  {
    id: 'ato2_1',
    ato: 'II – A Ascensão',
    nome: 'Força dos Antigos',
    desc: 'Alcance o Rank B para sentir o poder dos guerreiros ancestrais.',
    objetivo: 'rank',
    meta: 'B',
    recompensa: { xp: 150, pontos: 100, titulo: 'Herdeiro dos Antigos' },
    lore: 'Os guerreiros do passado olham para si com aprovação. O teu poder ecoa através das eras como uma lenda viva.',
    requer: 'ato1_3'
  },
  {
    id: 'ato2_2',
    ato: 'II – A Ascensão',
    nome: 'Ecos do Abismo',
    desc: 'Derrote 5 bosses diferentes na Masmorra Diária.',
    objetivo: 'derrotar_bosses',
    meta: 5,
    recompensa: { xp: 200, pontos: 150, titulo: 'Caçador do Abismo' },
    lore: 'Cada boss derrotado enfraquece o Vazio. Mas algo maior espreita nas sombras, à espera do teu erro.',
    requer: 'ato2_1'
  },
  {
    id: 'ato2_3',
    ato: 'II – A Ascensão',
    nome: 'Aliança de Guerreiros',
    desc: 'Crie ou entre numa Guilda para unir forças contra a escuridão.',
    objetivo: 'entrar_guilda',
    meta: 1,
    recompensa: { xp: 100, pontos: 80, titulo: null },
    lore: 'Sozinhos somos fortes, juntos somos imparáveis. A Guilda será a tua nova família no meio do caos.',
    requer: 'ato2_2'
  },

  // ATO III – O CONFLITO
  {
    id: 'ato3_1',
    ato: 'III – O Conflito',
    nome: 'A Sombra dos Pilares',
    desc: 'Alcance o Rank A. O Vazio começa a temer o teu poder.',
    objetivo: 'rank',
    meta: 'A',
    recompensa: { xp: 300, pontos: 200, titulo: 'Sombra dos Pilares' },
    lore: 'Os Pilares tremem. O Vazio recua. Mas a verdadeira batalha ainda não começou; ela apenas mudou de nome.',
    requer: 'ato2_3'
  },
  {
    id: 'ato3_2',
    ato: 'III – O Conflito',
    nome: 'Guerra do Nexus',
    desc: 'Vença 3 torneios para provar a tua supremacia.',
    objetivo: 'vencer_torneio',
    meta: 3,
    recompensa: { xp: 400, pontos: 300, titulo: 'Campeão do Nexus' },
    lore: 'As arenas testemunham a tua glória. Multidões clamam o teu nome e o eco das suas vitórias atravessa o Nexus.',
    requer: 'ato3_1'
  },
  {
    id: 'ato3_3',
    ato: 'III – O Conflito',
    nome: 'O Véu Rompido',
    desc: 'Alcance o Rank S. O véu entre os mundos começa a romper-se.',
    objetivo: 'rank',
    meta: 'S',
    recompensa: { xp: 500, pontos: 400, titulo: 'Rompedor do Véu' },
    lore: 'O véu entre o Nexus e o Vazio rompe-se. Vislumbres de outros mundos aparecem, como memórias esquecidas.',
    requer: 'ato3_2'
  },

  // ATO IV – O LEGADO
  {
    id: 'ato4_1',
    ato: 'IV – O Legado',
    nome: 'Diante do Criador',
    desc: 'Alcance o Rank SS. Nelton observa-te com interesse.',
    objetivo: 'rank',
    meta: 'SS',
    recompensa: { xp: 800, pontos: 600, titulo: 'Escolhido do Criador' },
    lore: 'Nelton, o Criador Incriado, volta o seu olhar para ti. “Este pode ser o escolhido...”',
    requer: 'ato3_3'
  },
  {
    id: 'ato4_2',
    ato: 'IV – O Legado',
    nome: 'Guardião do Nexus',
    desc: 'Alcance o Rank Nacional. Torna-te um pilar de proteção para todos.',
    objetivo: 'rank',
    meta: 'Nacional',
    recompensa: { xp: 1200, pontos: 1000, titulo: 'Guardião do Nexus' },
    lore: 'O Nexus encontra em ti um protetor. As suas muralhas passam a ser a tua vontade e o teu juramento.',
    requer: 'ato4_1'
  },
  {
    id: 'ato4_3',
    ato: 'IV – O Legado',
    nome: 'O Sonho de Nelton',
    desc: 'Alcance o Rank Monarca. Cumpra o sonho do Criador.',
    objetivo: 'rank',
    meta: 'Monarca',
    recompensa: { xp: 2000, pontos: 1500, titulo: 'Herdeiro do Sonho' },
    lore: '“Tu cumpriste o meu sonho”, sussurra Nelton. “Agora, o Nexus é teu.”',
    requer: 'ato4_2'
  }
]

// ════════════════════════════════════════
//  INICIALIZAR MISSÕES DO JOGADOR
// ════════════════════════════════════════
function inicializarMissoesJogador(nome) {
  const missoes = carregarMissoes()
  if (!missoes[nome]) {
    missoes[nome] = {
      atuais: {},      // { missaoId: { progresso, completa } }
      completas: [],   // [missaoId, ...]
      bossDerrotados: [],
      torneiosVencidos: 0
    }
    salvarMissoes(missoes)
  }
  return missoes[nome]
}

// ════════════════════════════════════════
//  VERIFICAR PROGRESSO DE MISSÕES
// ════════════════════════════════════════
function verificarProgressoMissao(nome, tipo, valor) {
  const missoes = carregarMissoes()
  const jogador = missoes[nome]
  if (!jogador) return null

  let missaoCompleta = null

  for (const missao of MISSOES_EPICAS) {
    // Verifica se já foi completada
    if (jogador.completas.includes(missao.id)) continue

    // Verifica se tem o requisito (missão anterior)
    if (missao.requer && !jogador.completas.includes(missao.requer)) continue

    // Inicializa o progresso se não existir
    if (!jogador.atuais[missao.id]) {
      jogador.atuais[missao.id] = { progresso: 0, completa: false }
    }

    const prog = jogador.atuais[missao.id]

    // Verifica se o tipo coincide
    if (missao.objetivo === tipo) {
      if (tipo === 'rank') {
        // Para ranks, verifica se atingiu o rank necessário
        const ranks = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'Nacional', 'Monarca', 'Divino']
        const idxAtual = ranks.indexOf(valor)
        const idxMeta = ranks.indexOf(missao.meta)
        if (idxAtual >= idxMeta) {
          prog.completa = true
          prog.progresso = missao.meta
        }
      } else {
        prog.progresso += valor
        if (prog.progresso >= missao.meta) {
          prog.completa = true
        }
      }

      if (prog.completa) {
        jogador.completas.push(missao.id)
        delete jogador.atuais[missao.id]
        missaoCompleta = missao
        break
      }
    }
  }

  salvarMissoes(missoes)
  return missaoCompleta
}

// ════════════════════════════════════════
//  VER MISSÕES DO JOGADOR
// ════════════════════════════════════════
async function verMissoesEpicas(sock, jid, nome) {
  const user = getUser(nome)
  if (!user.despertou) {
    await sock.sendMessage(jid, { text: '🌌 Você ainda não despertou no Nexus World!' })
    return
  }

  const missoes = carregarMissoes()
  const jogador = missoes[nome]
  if (!jogador) {
    inicializarMissoesJogador(nome)
    await sock.sendMessage(jid, { text: '📜 As suas missões épicas foram inicializadas! Use *!missoes-epicas* novamente.' })
    return
  }

  let txt = '📜 *MISSÕES ÉPICAS DO NEXUS*\n\nO destino do Caçador se revela a cada passo no caminho do despertar.\n\n'

  let atoAtual = ''
  for (const missao of MISSOES_EPICAS) {
    if (missao.ato !== atoAtual) {
      atoAtual = missao.ato
      txt += '*═══════════════════*\n'
      txt += '🎭 *' + atoAtual + '*\n'
      txt += '*═══════════════════*\n\n'
    }

    const completa = jogador.completas.includes(missao.id)
    const prog = jogador.atuais[missao.id]
    const bloqueada = missao.requer && !jogador.completas.includes(missao.requer)

    if (completa) {
      txt += '✅ *' + missao.nome + '*\n'
      txt += '   ' + missao.desc + '\n'
      txt += '   💬 _"' + missao.lore + '"_'
    } else if (bloqueada) {
      txt += '🔒 *' + missao.nome + '*\n'
      txt += '   Complete a missão anterior para desbloquear.\n'
    } else if (prog) {
      txt += '🔄 *' + missao.nome + '*\n'
      txt += '   ' + missao.desc + '\n'
      txt += '   Progresso: ' + prog.progresso + '/' + missao.meta + '\n'
    } else {
      txt += '📋 *' + missao.nome + '*\n'
      txt += '   ' + missao.desc + '\n'
    }

    if (missao.recompensa.titulo) {
      txt += '   🏅 Título: _' + missao.recompensa.titulo + '_'
    }
    txt += '\n\n'
  }

  await sock.sendMessage(jid, { text: txt })
}

// ════════════════════════════════════════
//  NOTIFICAR MISSÃO COMPLETA
// ════════════════════════════════════════
async function notificarMissaoCompleta(sock, jid, nome, missao) {
  const user = getUser(nome)

  // Dar recompensas
  user.xp = (user.xp || 0) + missao.recompensa.xp
  user.pontos = (user.pontos || 0) + missao.recompensa.pontos
  if (missao.recompensa.titulo) {
    user.titulo = missao.recompensa.titulo
  }
  saveUser(nome, user)

  const txt = 
'🎉 *MISSÃO ÉPICA COMPLETA!*\n\n' +
'A trama do Nexus avançou e os Pilares reconheceram o teu valor.\n\n' +
'📜 *' + missao.nome + '*\n' +
'🎭 ' + missao.ato + '\n\n' +
'💬 _"' + missao.lore + '"_' +
'\n\n🌟 Recompensas:\n' +
'+' + missao.recompensa.xp + ' XP\n' +
'+' + missao.recompensa.pontos + ' pontos' +
(missao.recompensa.titulo ? '\n🏅 Título: *' + missao.recompensa.titulo + '*' : '')

  await sock.sendMessage(jid, { text: txt })
}

module.exports = {
  inicializarMissoesJogador,
  verificarProgressoMissao,
  verMissoesEpicas,
  notificarMissaoCompleta
}
