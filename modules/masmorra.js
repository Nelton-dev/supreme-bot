const { getUser, saveUser, adicionarXpRank, penalizarDerrota } = require('../db')
const { calcularDanoElemental } = require('./combate')

const masmorras = {}

const BOSSES_BASE = [
  { nome: 'Lobo das Sombras', poder: 15, emoji: '🐺', habilidade: 'Mordida Sombria' },
  { nome: 'Golem de Magma', poder: 20, emoji: '🔥', habilidade: 'Erupção' },
  { nome: 'Serpente Sombria', poder: 18, emoji: '🐍', habilidade: 'Veneno Paralisante' },
  { nome: 'Espectro do Vazio', poder: 25, emoji: '👻', habilidade: 'Toque Fantasma' },
  { nome: 'Dragão Ancião', poder: 30, emoji: '🐉', habilidade: 'Sopro Incandescente' },
  { nome: 'Cavaleiro Caído', poder: 22, emoji: '⚔️', habilidade: 'Lâmina da Perdição' },
  { nome: 'Arauto do Caos', poder: 28, emoji: '🌀', habilidade: 'Distorção' }
]

function obterBoss(rank) {
  const base = BOSSES_BASE[Math.floor(Math.random() * BOSSES_BASE.length)]
  const multiplicador = 1 + Math.max(0, ['E','D','C','B','A','S','SS','Nacional','Monarca','Divino'].indexOf(rank) * 0.3)
  return {
    ...base,
    poder: Math.floor(base.poder * multiplicador),
    vida: 80 + Math.floor(Math.random() * 40) * multiplicador,
    vidaMax: 0
  }
}

async function iniciarMasmorra(sock, jid, nome) {
  const user = getUser(nome)
  if (!user.despertou) {
    await sock.sendMessage(jid, { text: '🌌 Você ainda não despertou no Nexus World! Envie qualquer mensagem para começar.' })
    return
  }

  const hoje = new Date().toDateString()
  if (user.ultimaMasmorra === hoje) {
    await sock.sendMessage(jid, { text: '⏳ Você já enfrentou a Masmorra hoje! Volte amanhã para um novo desafio.' })
    return
  }

  if (masmorras[nome]) {
    await sock.sendMessage(jid, { text: '⚔️ Você já está numa batalha de masmorra! Use os comandos para continuar.' })
    return
  }

  const boss = obterBoss(user.rank || 'E')
  boss.vidaMax = boss.vida

  const vidaJogador = user.vida || 100
  const atkJogador = user.ataque || 10
  const habJogador = user.habilidade_ativa || null
  const petJogador = user.pet_ativo || null

  masmorras[nome] = {
    boss,
    vidaJogador,
    vidaMaxJogador: vidaJogador,
    atkJogador,
    habJogador,
    petJogador,
    escudoJogador: user.escudo || false,
    turno: 'jogador',
    timeout: null,
    jid
  }

  await sock.sendMessage(jid, {
    text: `⚔️ *MASMORRA DIÁRIA* ⚔️\n\n${boss.emoji} *${boss.nome}* apareceu!\n❤️ Vida do Boss: ${boss.vida}/${boss.vidaMax}\n💢 Poder: ${boss.poder}\n✨ Habilidade: ${boss.habilidade}\n\n🔹 *Seu status:*\n❤️ Vida: ${vidaJogador}/${vidaJogador}\n⚔️ Ataque: ${atkJogador}\n\n🎮 *Seu turno!*\nUse !masmorra atacar, !masmorra defender, !masmorra curar, !masmorra fugir\n⏱️ 60 segundos para agir!`
  })

  iniciarTimeout(sock, jid, nome)
}

function iniciarTimeout(sock, jid, nome) {
  const m = masmorras[nome]
  if (!m) return
  clearTimeout(m.timeout)
  m.timeout = setTimeout(async () => {
    if (!masmorras[nome]) return
    await sock.sendMessage(jid, { text: `⏰ Tempo esgotado! O ${m.boss.emoji} *${m.boss.nome}* ataca enquanto você hesita.` })
    await turnoBoss(sock, jid, nome)
  }, 60000)
}

async function atacarMasmorra(sock, jid, nome) {
  const m = masmorras[nome]
  if (!m) return false
  if (m.turno !== 'jogador') {
    await sock.sendMessage(jid, { text: '⏳ Aguarde o seu turno!' })
    return true
  }
  clearTimeout(m.timeout)

  const user = getUser(nome)
  let dano = Math.floor(m.atkJogador * (0.8 + Math.random() * 0.6))
  dano = calcularDanoElemental(user, { elemento: null }, dano)
  let efeitos = []

  const hab = m.habJogador

  // Habilidades clássicas
  if (hab === 'rasengan' && Math.random() < 0.25) { dano *= 2; efeitos.push('💥 CRÍTICO com Rasengan!') }
  if (hab === 'bankai') { dano = Math.floor(dano * 1.5); efeitos.push('🌑 Bankai ativado!') }
  if (hab === 'kamehameha' && Math.random() < 0.15) { dano = Math.floor(dano * 1.8); efeitos.push('⚡ Kamehameha devastador!') }
  if (hab === 'modo_seis') { dano = Math.floor(dano * 2); efeitos.push('🔱 Modo Seis Caminhos!') }

  // NOVOS PODERES DO NEXUS - ATAQUE
  if (hab === 'onda_espiritual' && Math.random() < 0.30) { dano = Math.floor(dano * 1.4); efeitos.push('🌊 Onda Espiritual! Dano em área!') }
  if (hab === 'golpe_do_vazio' && Math.random() < 0.20) { dano = Math.floor(dano * 1.5); efeitos.push('🕳️ Golpe do Vazio! Defesa ignorada!') }
  if (hab === 'lamina_nexus') { dano = Math.floor(dano * 1.4); if (Math.random() < 0.10) efeitos.push('⚔️ Lâmina do Nexus! Sangramento!') }
  if (hab === 'colera_dos_pilares' && Math.random() < 0.15) { dano = Math.floor(dano * 2); efeitos.push('🔥 Cólera dos Pilares! Ataque duplo!') }
  if (hab === 'rugido_do_dragao') { dano = Math.floor(dano * 1.5); if (Math.random() < 0.25) efeitos.push('🐉 Rugido do Dragão! Inimigo atordoado!') }

  // NOVOS PODERES DO NEXUS - ESPECIAIS
  if (hab === 'visao_do_vazio' && Math.random() < 0.30) { dano = Math.floor(dano * 1.25); efeitos.push('👁️ Visão do Vazio! Fraqueza revelada!') }
  if (hab === 'furor_do_nexus') { dano = Math.floor(dano * 2); efeitos.push('⚡ Furor do Nexus! Ataque devastador!') }
  if (hab === 'toque_do_criador' && Math.random() < 0.10) { dano = 99999; efeitos.push('🖐️ TOQUE DO CRIADOR! INSTA-KILL!') }

  // Pet Kurama
  if (m.petJogador === 'kurama') {
    const regen = 10
    m.vidaJogador = Math.min(m.vidaMaxJogador, m.vidaJogador + regen)
    efeitos.push('🦊 Kurama regenerou ' + regen + ' HP!')
  }

  m.boss.vida = Math.max(0, m.boss.vida - dano)

  let txt = '⚔️ *Você atacou!*\n💢 ' + dano + ' de dano em ' + m.boss.emoji + ' *' + m.boss.nome + '*!\n\n'
  if (efeitos.length) txt += efeitos.join('\n') + '\n\n'
  txt += '❤️ Boss: ' + m.boss.vida + '/' + m.boss.vidaMax + '\n❤️ Você: ' + m.vidaJogador + '/' + m.vidaMaxJogador + '\n\n'

  if (m.boss.vida <= 0) {
    txt += '💀 *' + m.boss.nome + '* foi derrotado!\n🎉 *VITÓRIA NA MASMORRA!*'
    await finalizarMasmorra(sock, jid, nome, true, txt)
    return true
  }

  m.turno = 'boss'
  await sock.sendMessage(jid, { text: txt })
  await turnoBoss(sock, jid, nome)
  return true
}
async function defenderMasmorra(sock, jid, nome) {
  const m = masmorras[nome]
  if (!m) return false
  if (m.turno !== 'jogador') {
    await sock.sendMessage(jid, { text: '⏳ Aguarde o seu turno!' })
    return true
  }
  clearTimeout(m.timeout)
  m.escudoJogador = true
  await sock.sendMessage(jid, { text: `🛡️ *Você se defendeu!* O próximo ataque do boss terá dano reduzido.` })
  m.turno = 'boss'
  await turnoBoss(sock, jid, nome)
  return true
}

async function curarMasmorra(sock, jid, nome) {
  const m = masmorras[nome]
  if (!m) return false
  if (m.turno !== 'jogador') {
    await sock.sendMessage(jid, { text: '⏳ Aguarde o seu turno!' })
    return true
  }
  clearTimeout(m.timeout)
  const cura = 25 + Math.floor(Math.random() * 15)
  m.vidaJogador = Math.min(m.vidaMaxJogador, m.vidaJogador + cura)
  await sock.sendMessage(jid, { text: `🧪 *Você se curou!* +${cura} HP\n❤️ Sua vida: ${m.vidaJogador}/${m.vidaMaxJogador}` })
  m.turno = 'boss'
  await turnoBoss(sock, jid, nome)
  return true
}

async function fugirMasmorra(sock, jid, nome) {
  const m = masmorras[nome]
  if (!m) return false
  if (m.turno !== 'jogador') {
    await sock.sendMessage(jid, { text: '⏳ Aguarde o seu turno!' })
    return true
  }
  clearTimeout(m.timeout)
  await sock.sendMessage(jid, { text: `🏃 Você fugiu da masmorra... A vergonha custa XP.` })
  await finalizarMasmorra(sock, jid, nome, false, `Você fugiu do desafio.`)
  return true
}

async function turnoBoss(sock, jid, nome) {
  const m = masmorras[nome]
  if (!m) return

  let dano = Math.floor(m.boss.poder * (0.8 + Math.random() * 0.4))
  if (m.escudoJogador) {
    dano = Math.floor(dano * 0.3)
    m.escudoJogador = false
  }
  m.vidaJogador = Math.max(0, m.vidaJogador - dano)

  let txt = `💢 ${m.boss.emoji} *${m.boss.nome}* atacou com *${m.boss.habilidade}*!\n💔 ${dano} de dano!\n\n`
  txt += `❤️ Boss: ${m.boss.vida}/${m.boss.vidaMax}\n❤️ Você: ${m.vidaJogador}/${m.vidaMaxJogador}\n\n`

  if (m.vidaJogador <= 0) {
    txt += `💀 *Você foi derrotado!*\nA masmorra consumiu sua energia.`
    await finalizarMasmorra(sock, jid, nome, false, txt)
    return
  }

  m.turno = 'jogador'
  txt += `🎮 *Seu turno!* Use !masmorra atacar, !masmorra defender, !masmorra curar ou !masmorra fugir.`
  await sock.sendMessage(jid, { text: txt })
  iniciarTimeout(sock, jid, nome)
}

async function finalizarMasmorra(sock, jid, nome, vitoria, txtFinal) {
  const m = masmorras[nome]
  if (!m) return
  clearTimeout(m.timeout)

  const user = getUser(nome)
  const hoje = new Date().toDateString()
  user.ultimaMasmorra = hoje
  user.ultima_atividade = Date.now()
  saveUser(nome, user)

  if (vitoria) {
    const xpGanho = 20 + Math.floor(Math.random() * 20)
    const pontosGanho = 30 + Math.floor(Math.random() * 30)
    user.pontos = (user.pontos || 0) + pontosGanho
    saveUser(nome, user)

    const subiu = adicionarXpRank(nome, xpGanho)
    await sock.sendMessage(jid, { text: `${txtFinal}\n\n🌟 +${xpGanho} XP de Rank\n💰 +${pontosGanho} pontos\n${subiu ? '🎉 Você ascendeu de Rank! Use !perfil para ver.' : ''}` })

    if (subiu) {
      const { anunciarSubidaRank } = require('./sistema')
      await anunciarSubidaRank(sock, jid, nome, nome, user.rank)
    }
  } else {
    penalizarDerrota(nome, 10)
    await sock.sendMessage(jid, { text: `${txtFinal}\n\n💀 -10 XP de Rank\n"Levante-se e lute novamente amanhã."` })
  }

  delete masmorras[nome]
}

module.exports = {
  iniciarMasmorra,
  masmorras,
  atacarMasmorra,
  defenderMasmorra,
  curarMasmorra,
  fugirMasmorra
}
