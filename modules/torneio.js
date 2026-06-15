const { getUser, saveUser, todosUsuarios } = require('../db')

let torneioAtivo = null

async function iniciarTorneio(sock, jid) {
  if (torneioAtivo) {
    await sock.sendMessage(jid, { text: '🏆 Já há um torneio em curso! Aguarda o fim.' })
    return
  }

  torneioAtivo = { jid, inscritos: [], fase: 'inscricao' }

  await sock.sendMessage(jid, {
    text: `🏆 *TORNEIO DE ANIME INICIADO!*\n\n⚔️ Inscreve-te com *!inscrever*\n⏱️ Tens 60 segundos para te inscrever!\n\nMínimo 2 participantes para começar.`
  })

  setTimeout(async () => {
    if (!torneioAtivo) return
    if (torneioAtivo.inscritos.length < 2) {
      await sock.sendMessage(jid, { text: '❌ Torneio cancelado — participantes insuficientes.' })
      torneioAtivo = null
      return
    }
    await correrTorneio(sock, jid)
  }, 60000)
}

async function inscrever(sock, jid, nome) {
  if (!torneioAtivo || torneioAtivo.fase !== 'inscricao') {
    await sock.sendMessage(jid, { text: '⚠️ Não há torneio aberto para inscrição. Aguarda !torneio.' })
    return
  }
  if (torneioAtivo.inscritos.includes(nome)) {
    await sock.sendMessage(jid, { text: `✅ *${nome}*, já estás inscrito!` })
    return
  }
  torneioAtivo.inscritos.push(nome)
  await sock.sendMessage(jid, {
    text: `✅ *${nome}* inscrito!\n👥 Inscritos: ${torneioAtivo.inscritos.join(', ')}`
  })
}

async function correrTorneio(sock, jid) {
  let participantes = [...torneioAtivo.inscritos]
  torneioAtivo.fase = 'batalha'

  // Embaralhar
  participantes = participantes.sort(() => Math.random() - 0.5)

  await sock.sendMessage(jid, {
    text: `⚔️ *TORNEIO COMEÇOU!*\n\n👥 Participantes:\n${participantes.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n🎮 As batalhas são automáticas!`
  })

  await sleep(2000)

  while (participantes.length > 1) {
    const vencedores = []
    const rodada = []

    for (let i = 0; i < participantes.length; i += 2) {
      if (i + 1 >= participantes.length) {
        vencedores.push(participantes[i])
        rodada.push(`🟡 *${participantes[i]}* — bye (avança automaticamente)`)
        continue
      }
      const j1 = participantes[i]
      const j2 = participantes[i + 1]
      const vencedor = simularBatalha(j1, j2)
      const perdedor = vencedor === j1 ? j2 : j1
      vencedores.push(vencedor)
      rodada.push(`⚔️ ${j1} vs ${j2} → 🏅 *${vencedor}* venceu!`)
    }

    await sock.sendMessage(jid, {
      text: `🥊 *RODADA*\n\n${rodada.join('\n')}\n\n➡️ Avançam: ${vencedores.join(', ')}`
    })

    participantes = vencedores
    await sleep(3000)
  }

  const campeao = participantes[0]
  const { user } = getUser(campeao)
  user.xp += 100
  user.pontos += 80
  user.vitorias = (user.vitorias || 0) + 1
  user.titulo = '🏆 Campeão do Torneio'
  saveUser(campeao, user)

  await sock.sendMessage(jid, {
    text: `🎉 *TORNEIO ENCERRADO!*\n\n👑 *CAMPEÃO: ${campeao}*\n\n+100 XP | +80 pontos | Título: 🏆 Campeão do Torneio`
  })

  torneioAtivo = null
}

function simularBatalha(j1, j2) {
  const { user: u1 } = getUser(j1)
  const { user: u2 } = getUser(j2)
  const p1 = (u1.ataque || 10) + (u1.nivel || 1) * 5 + Math.random() * 30
  const p2 = (u2.ataque || 10) + (u2.nivel || 1) * 5 + Math.random() * 30
  return p1 >= p2 ? j1 : j2
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = { iniciarTorneio, inscrever }