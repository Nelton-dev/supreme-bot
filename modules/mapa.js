const { getUser, saveUser } = require('../db')

// ════════════════════════════════════════
//  ÁREAS DO MAPA
// ════════════════════════════════════════

const AREAS = [
  { id: 'vazio_inicial', nome: '🌑 Vazio Inicial', rank: 'E', bonus: {}, desc: 'O ponto de partida de todos os Caçadores. Uma vasta planície escura onde a jornada começa.' },
  { id: 'planicies_fogo', nome: '🔥 Planícies de Fogo', rank: 'D', bonus: { fogo: 10 }, desc: 'Terras queimadas pelo sopro de Ignis. O calor fortalece os guerreiros do Fogo.' },
  { id: 'lago_cristalino', nome: '💧 Lago Cristalino', rank: 'D', bonus: { agua: 10 }, desc: 'Águas puras abençoadas por Aquor. A serenidade esconde um poder profundo.' },
  { id: 'floresta_ancestral', nome: '🌿 Floresta Ancestral', rank: 'C', bonus: { xp: 15 }, desc: 'Lar do Ente Ancestral. A vida floresce e o conhecimento antigo espera.' },
  { id: 'montanha_tempestuosa', nome: '⚡ Montanha Tempestuosa', rank: 'C', bonus: { trovao: 10 }, desc: 'O Pássaro Celeste sobrevoa estes picos. Raios caem sem cessar.' },
  { id: 'cavernas_profundas', nome: '🪨 Cavernas Profundas', rank: 'B', bonus: { defesa: 10 }, desc: 'O Titã Adormecido repousa aqui. As paredes de cristal oferecem proteção.' },
  { id: 'abismo_sombrio', nome: '🌑 Abismo Sombrio', rank: 'B', bonus: { trevas: 10 }, desc: 'Onde Umbra reina. A escuridão é absoluta, mas o poder é imenso.' },
  { id: 'templo_sagrado', nome: '✨ Templo Sagrado', rank: 'A', bonus: { luz: 10 }, desc: 'O Farol Incorruptível ilumina este lugar. A verdade aguarda os dignos.' },
  { id: 'fortaleza_nexus', nome: '🏰 Fortaleza do Nexus', rank: 'S', bonus: { todos: 20 }, desc: 'O coração do Nexus World. Todos os elementos convergem aqui.' },
  { id: 'salao_criador', nome: '🌀 Salão do Criador', rank: 'SS', bonus: { todos: 30 }, desc: 'O santuário de Nelton. Apenas os mais poderosos podem entrar.' }
]

// ════════════════════════════════════════
//  VER MAPA
// ════════════════════════════════════════
async function verMapa(sock, jid, nome) {
  const user = getUser(nome)
  if (!user.despertou) {
    await sock.sendMessage(jid, { text: '🌌 Você ainda não despertou no Nexus World!' })
    return
  }

  const areaAtual = user.area_atual || 'vazio_inicial'
  const rankAtual = user.rank || 'E'

  const ranks = ['E','D','C','B','A','S','SS','Nacional','Monarca','Divino']
  const rankIdx = ranks.indexOf(rankAtual)

  let txt = '🗺️ *MAPA DO NEXUS WORLD*\n\nOs Pilares revelam os caminhos do destino.\n\n'
  txt += '📍 *Área Atual:* ' + (AREAS.find(a => a.id === areaAtual)?.nome || '🌑 Vazio Inicial') + '\n\n'
  txt += '═══ *Áreas Disponíveis* ═══\n\n'

  AREAS.forEach(area => {
    const areaRankIdx = ranks.indexOf(area.rank)
    const disponivel = areaRankIdx <= rankIdx
    const ehAtual = area.id === areaAtual

    txt += (disponivel ? (ehAtual ? '📍' : '✅') : '🔒') + ' ' + area.nome + '\n'
    txt += '   Rank: ' + area.rank + ' | ' + area.desc + '\n'
    if (disponivel && !ehAtual) {
      txt += '   ➡️ Use *!viajar ' + area.id + '* para viajar\n'
    }
    if (Object.keys(area.bonus).length > 0) {
      const bonusTxt = Object.entries(area.bonus).map(([k, v]) => {
        if (k === 'todos') return 'Todos os ganhos +' + v + '%'
        if (k === 'xp') return 'XP +' + v + '%'
        if (k === 'defesa') return 'Defesa +' + v + '%'
        return k.charAt(0).toUpperCase() + k.slice(1) + ' +' + v + '%'
      }).join(', ')
      txt += '   🎁 Bónus: ' + bonusTxt + '\n'
    }
    txt += '\n'
  })

  await sock.sendMessage(jid, { text: txt })
}

// ════════════════════════════════════════
//  VIAJAR PARA UMA ÁREA
// ════════════════════════════════════════
async function viajar(sock, jid, nome, areaId) {
  const user = getUser(nome)
  if (!user.despertou) {
    await sock.sendMessage(jid, { text: '🌌 Você ainda não despertou no Nexus World!' })
    return
  }

  const area = AREAS.find(a => a.id === areaId)
  if (!area) {
    await sock.sendMessage(jid, { text: '🗺️ Área não encontrada! Use *!mapa* para ver as áreas disponíveis.' })
    return
  }

  const ranks = ['E','D','C','B','A','S','SS','Nacional','Monarca','Divino']
  const areaRankIdx = ranks.indexOf(area.rank)
  const userRankIdx = ranks.indexOf(user.rank || 'E')

  if (areaRankIdx > userRankIdx) {
    await sock.sendMessage(jid, { text: '🔒 Você não tem rank suficiente para viajar para esta área! Rank necessário: *' + area.rank + '*\nSeu rank atual: *' + (user.rank || 'E') + '*' })
    return
  }

  if (user.area_atual === areaId) {
    await sock.sendMessage(jid, { text: '📍 Você já está nesta área!' })
    return
  }

  user.area_atual = areaId
  saveUser(nome, user)

  await sock.sendMessage(jid, {
    text: '🗺️ *VIAGEM CONCLUÍDA!*\n\n📍 Chegaste a: ' + area.nome + '\n📝 ' + area.desc + '\n\nOs bónus da área estão ativos e o Nexus responde ao teu passo.'
  })
}

module.exports = {
  verMapa,
  viajar
}
