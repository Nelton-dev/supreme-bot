const fs = require('fs')
const { getUser, saveUser } = require('../db')

const GUERRA_PATH = './data/guerra_guildas.json'

function carregarGuerra() {
  if (!fs.existsSync(GUERRA_PATH)) {
    const base = { ativa: false, guildas: {}, historico: [] }
    fs.writeFileSync(GUERRA_PATH, JSON.stringify(base, null, 2))
    return base
  }
  return JSON.parse(fs.readFileSync(GUERRA_PATH, 'utf8'))
}

function salvarGuerra(data) {
  fs.writeFileSync(GUERRA_PATH, JSON.stringify(data, null, 2))
}

// ════════════════════════════════════════
//  INICIAR GUERRA DE GUILDAS
// ════════════════════════════════════════
async function iniciarGuerraGuildas(sock, jid, nome) {
  const guerra = carregarGuerra()
  if (guerra.ativa) {
    await sock.sendMessage(jid, { text: '⚔️ Uma Guerra de Guildas já está em curso!' })
    return
  }

  const guildas = JSON.parse(fs.readFileSync('./data/guildas.json', 'utf8'))
  const lista = Object.values(guildas)

  if (lista.length < 2) {
    await sock.sendMessage(jid, { text: '❌ Precisas de pelo menos 2 guildas para iniciar uma guerra!' })
    return
  }

  // Embaralha e forma pares de guildas
  const shuffled = lista.sort(() => Math.random() - 0.5)
  const confrontos = []
  for (let i = 0; i < shuffled.length - 1; i += 2) {
    confrontos.push({
      guilda1: shuffled[i].nome,
      guilda2: shuffled[i + 1].nome,
      placar: { guilda1: 0, guilda2: 0 },
      finalizado: false
    })
  }

  guerra.ativa = true
  guerra.confrontos = confrontos
  guerra.inicio = Date.now()
  salvarGuerra(guerra)

  let txt = '⚔️ *GUERRA DE GUILDAS INICIADA!* ⚔️\n\n'
  confrontos.forEach(c => {
    txt += '🏰 *' + c.guilda1 + '* vs *' + c.guilda2 + '*\n'
  })
  txt += '\n⏱️ A guerra durará até que todas as batalhas sejam concluídas!\nUse *!guerra lutar* para participar!'

  await sock.sendMessage(jid, { text: txt })
}

// ════════════════════════════════════════
//  LUTAR NA GUERRA
// ════════════════════════════════════════
async function lutarGuerra(sock, jid, nome) {
  const guerra = carregarGuerra()
  if (!guerra.ativa) {
    await sock.sendMessage(jid, { text: '❌ Não há nenhuma Guerra de Guildas ativa!' })
    return
  }

  const user = getUser(nome)
  if (!user.despertou) {
    await sock.sendMessage(jid, { text: '🌌 Você ainda não despertou no Nexus World!' })
    return
  }

  const guildas = JSON.parse(fs.readFileSync('./data/guildas.json', 'utf8'))
  const minhaGuilda = Object.entries(guildas).find(([_, g]) => g.membros.includes(nome))
  if (!minhaGuilda) {
    await sock.sendMessage(jid, { text: '❌ Você não pertence a nenhuma guilda!' })
    return
  }

  const nomeMinhaGuilda = minhaGuilda[0]

  // Encontra o confronto da minha guilda
  const confronto = guerra.confrontos.find(c =>
    (c.guilda1 === nomeMinhaGuilda || c.guilda2 === nomeMinhaGuilda) && !c.finalizado
  )
  if (!confronto) {
    await sock.sendMessage(jid, { text: '❌ Sua guilda não está em nenhum confronto ativo ou já finalizou!' })
    return
  }

  const ehGuilda1 = confronto.guilda1 === nomeMinhaGuilda
  const guildaOponente = ehGuilda1 ? guildas[confronto.guilda2] : guildas[confronto.guilda1]
  const oponente = guildaOponente.membros[Math.floor(Math.random() * guildaOponente.membros.length)]
  const userOponente = getUser(oponente)

  // Simula a batalha
  const atk1 = (user.ataque || 10) + (user.nivel || 1) * 3 + Math.random() * 20
  const atk2 = (userOponente.ataque || 10) + (userOponente.nivel || 1) * 3 + Math.random() * 20

  // Bónus elemental
  if (user.elemento && userOponente.elemento) {
    const { ELEMENTOS } = require('./combate')
    const interacao = ELEMENTOS[user.elemento]
    if (interacao && interacao.forteContra === userOponente.elemento) {
      atk1 = atk1 * 1.3
    }
  }

  const venceu = atk1 >= atk2

  if (venceu) {
    if (ehGuilda1) confronto.placar.guilda1++
    else confronto.placar.guilda2++

    user.pontos = (user.pontos || 0) + 50
    user.xp = (user.xp || 0) + 100
    saveUser(nome, user)

    await sock.sendMessage(jid, {
      text: '⚔️ *VITÓRIA NA GUERRA!*\n\nVocê derrotou *' + oponente + '* da guilda *' + guildaOponente.nome + '*!\n+50 pontos | +100 XP\n\nPlacar: ' + confronto.placar.guilda1 + ' x ' + confronto.placar.guilda2
    })
  } else {
    userOponente.pontos = (userOponente.pontos || 0) + 50
    saveUser(oponente, userOponente)
    penalizarDerrota(nome, 3)

    await sock.sendMessage(jid, {
      text: '💀 *DERROTA NA GUERRA!*\n\n*' + oponente + '* da guilda *' + guildaOponente.nome + '* venceu você!\n-3 XP de Rank\n\nPlacar: ' + confronto.placar.guilda1 + ' x ' + confronto.placar.guilda2
    })
  }

  salvarGuerra(guerra)
}

// ════════════════════════════════════════
//  VER STATUS DA GUERRA
// ════════════════════════════════════════
async function statusGuerra(sock, jid) {
  const guerra = carregarGuerra()
  if (!guerra.ativa) {
    await sock.sendMessage(jid, { text: '🏳️ Nenhuma Guerra de Guildas ativa no momento.' })
    return
  }

  let txt = '⚔️ *GUERRA DE GUILDAS* ⚔️\n\n'
  guerra.confrontos.forEach(c => {
    txt += '🏰 *' + c.guilda1 + '* ' + c.placar.guilda1 + ' x ' + c.placar.guilda2 + ' *' + c.guilda2 + '*\n'
  })
  txt += '\nUse *!guerra lutar* para participar!'

  await sock.sendMessage(jid, { text: txt })
}

// ════════════════════════════════════════
//  FINALIZAR GUERRA (automático após 24h)
// ════════════════════════════════════════
function verificarFimGuerra() {
  const guerra = carregarGuerra()
  if (!guerra.ativa) return

  const agora = Date.now()
  if (agora - guerra.inicio > 24 * 60 * 60 * 1000) {
    guerra.ativa = false
    guerra.historico.push({
      data: new Date().toLocaleDateString('pt'),
      confrontos: guerra.confrontos
    })
    salvarGuerra(guerra)
  }
}

setInterval(verificarFimGuerra, 60000)

module.exports = {
  iniciarGuerraGuildas,
  lutarGuerra,
  statusGuerra
}
