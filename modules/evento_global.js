const { getUser, saveUser, adicionarXpRank } = require('../db')

// Estado do evento global
let eventoAtivo = null

const BOSSES_GLOBAIS = [
  { nome: 'Titã do Vazio', emoji: '👾', vida: 5000, recompensa: { xp: 200, pontos: 150 } },
  { nome: 'Dragão Celestial', emoji: '🐉', vida: 8000, recompensa: { xp: 300, pontos: 250 } },
  { nome: 'Deus Caído', emoji: '⚡', vida: 12000, recompensa: { xp: 500, pontos: 400 } },
  { nome: 'Arauto do Apocalipse', emoji: '💀', vida: 15000, recompensa: { xp: 800, pontos: 600 } },
  { nome: 'Nelton Corrompido', emoji: '🌀', vida: 20000, recompensa: { xp: 1500, pontos: 1000, titulo: 'Purificador do Criador' } }
]

// ════════════════════════════════════════
//  INICIAR EVENTO GLOBAL
// ════════════════════════════════════════
async function iniciarEventoGlobal(sock, jid, nome) {
  if (eventoAtivo) {
    await sock.sendMessage(jid, { text: '🐉 Já há um Evento Global em curso!' })
    return
  }

  const boss = BOSSES_GLOBAIS[Math.floor(Math.random() * BOSSES_GLOBAIS.length)]
  eventoAtivo = {
    boss: { ...boss, vidaAtual: boss.vida },
    participantes: {},
    jid,
    inicio: Date.now()
  }

  await sock.sendMessage(jid, {
    text: '🐉 *EVENTO GLOBAL INICIADO!* 🐉\n\n' + boss.emoji + ' *' + boss.nome + '* atravessou uma fenda do Vazio e ameaçou a ordem dos Pilares no Nexus!\n\n❤️ Vida: ' + boss.vida + '/' + boss.vida + '\n\n⚔️ Todos os Caçadores podem atacar com *!evento atacar*!\n⏱️ 2 horas para derrotá-lo antes que a Corrupção se espalhe pelos Pilares!'
  })

  // Timeout de 2 horas
  setTimeout(async () => {
    if (eventoAtivo) {
      await sock.sendMessage(jid, { text: '⏰ O tempo acabou! ' + eventoAtivo.boss.emoji + ' *' + eventoAtivo.boss.nome + '* recuou para o Vazio, mas a Corrupção deixou marcas nos Pilares...\nNinguém recebeu recompensas, mas a ameaça não desapareceu por completo.' })
      eventoAtivo = null
    }
  }, 2 * 60 * 60 * 1000)
}

// ════════════════════════════════════════
//  ATACAR NO EVENTO GLOBAL
// ════════════════════════════════════════
async function atacarEvento(sock, jid, nome) {
  if (!eventoAtivo) {
    await sock.sendMessage(jid, { text: '❌ Não há nenhum Evento Global ativo!' })
    return
  }

  const user = getUser(nome)
  if (!user.despertou) {
    await sock.sendMessage(jid, { text: '🌌 Você ainda não despertou no Nexus World!' })
    return
  }

  // Cada Caçador pode atacar a cada 5 minutos
  const agora = Date.now()
  if (eventoAtivo.participantes[nome] && agora - eventoAtivo.participantes[nome] < 5 * 60 * 1000) {
    const restante = Math.ceil((5 * 60 * 1000 - (agora - eventoAtivo.participantes[nome])) / 60000)
    await sock.sendMessage(jid, { text: '⏳ Você já atacou! Aguarde ' + restante + ' minutos para atacar novamente.' })
    return
  }

  // Calcula dano
  const atk = (user.ataque || 10) + (user.nivel || 1) * 5 + Math.random() * 30
  const rankBonus = ['E','D','C','B','A','S','SS','Nacional','Monarca','Divino'].indexOf(user.rank || 'E') * 5
  const dano = Math.floor(atk + rankBonus)

  eventoAtivo.boss.vidaAtual = Math.max(0, eventoAtivo.boss.vidaAtual - dano)
  eventoAtivo.participantes[nome] = agora

  let txt = '⚔️ @' + nome + ' avançou contra ' + eventoAtivo.boss.emoji + ' *' + eventoAtivo.boss.nome + '*!\n💢 ' + dano + ' de dano!\n\n❤️ Vida do Boss: ' + eventoAtivo.boss.vidaAtual + '/' + eventoAtivo.boss.vida

  if (eventoAtivo.boss.vidaAtual <= 0) {
    // Boss derrotado!
    const boss = eventoAtivo.boss
    const participantes = Object.keys(eventoAtivo.participantes)

    for (const p of participantes) {
      const u = getUser(p)
      u.xp = (u.xp || 0) + boss.recompensa.xp
      u.pontos = (u.pontos || 0) + boss.recompensa.pontos
      if (boss.recompensa.titulo) u.titulo = boss.recompensa.titulo
      adicionarXpRank(p, boss.recompensa.xp / 2)
      saveUser(p, u)
    }

    txt += '\n\n🎉 *BOSS DERROTADO!* 🎉\n\nTodos os ' + participantes.length + ' participantes recebem:\n+' + boss.recompensa.xp + ' XP\n+' + boss.recompensa.pontos + ' pontos' + (boss.recompensa.titulo ? '\n🏅 Título: *' + boss.recompensa.titulo + '*' : '')

    eventoAtivo = null
  } else {
    txt += '\n\nContinue atacando! Use *!evento status* para ver o progresso.'
  }

  await sock.sendMessage(jid, { text: txt })
}

// ════════════════════════════════════════
//  STATUS DO EVENTO
// ════════════════════════════════════════
async function statusEvento(sock, jid) {
  if (!eventoAtivo) {
    await sock.sendMessage(jid, { text: '🐉 Nenhum Evento Global ativo no momento.' })
    return
  }

  const boss = eventoAtivo.boss
  const participantes = Object.keys(eventoAtivo.participantes).length
  const progresso = Math.round(((boss.vida - boss.vidaAtual) / boss.vida) * 100)
  const barra = '█'.repeat(Math.floor(progresso / 10)) + '░'.repeat(10 - Math.floor(progresso / 10))

  await sock.sendMessage(jid, {
    text: '🐉 *EVENTO GLOBAL*\n\n' + boss.emoji + ' *' + boss.nome + '*\n❤️ Vida: ' + boss.vidaAtual + '/' + boss.vida + '\n📊 Progresso: [' + barra + '] ' + progresso + '%\n👥 Participantes: ' + participantes + '\n\nUse *!evento atacar* para ajudar!'
  })
}

module.exports = {
  iniciarEventoGlobal,
  atacarEvento,
  statusEvento
}
