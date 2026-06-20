const { getUser, saveUser } = require('../db')
const { ITENS } = require('./loja')
const { enviarVitoriaTorneio, enviarBannerTorneio } = require('./imagens')
const fs = require('fs')

// ════════════════════════════════════════
//  ESTADO (objeto partilhado com o handler)
// ════════════════════════════════════════
const state = {
  torneio: null
}

// ════════════════════════════════════════
//  INICIAR TORNEIO (interativo por turnos)
// ════════════════════════════════════════
async function iniciarTorneio(sock, jid) {
  if (state.torneio) {
    await sock.sendMessage(jid, { text: '🏆 Já há um torneio em curso!' })
    return
  }

  state.torneio = { jid, inscritos: [], apostas: {}, fase: 'inscricao', batalhaAtual: null, modo: 'normal' }

  // 🖼️ Banner 1 - INÍCIO
  await enviarBannerTorneio(sock, jid, { inscritos: 0, tempo: 90, titulo: 'INSCRIÇÕES ABERTAS' })

  // 🖼️ Banner 2 - MEIO (45s)
  setTimeout(async () => {
    if (!state.torneio || state.torneio.fase !== 'inscricao') return
    await enviarBannerTorneio(sock, jid, {
      inscritos: state.torneio.inscritos.length,
      tempo: 45,
      titulo: 'ÚLTIMA CHANCE!'
    })
  }, 45000)

  // 🖼️ Banner 3 - FIM (90s) + início do torneio
  setTimeout(async () => {
    if (!state.torneio) return
    await enviarBannerTorneio(sock, jid, {
      inscritos: state.torneio.inscritos.length,
      tempo: 0,
      titulo: 'INSCRIÇÕES ENCERRADAS'
    })

    if (state.torneio.inscritos.length < 2) {
      await sock.sendMessage(jid, { text: '❌ Torneio cancelado — participantes insuficientes.' })
      await devolverApostas(sock, jid)
      state.torneio = null
      return
    }
    await iniciarFase(sock, jid)
  }, 90000)
}

// ════════════════════════════════════════
//  INSCRIÇÃO
// ════════════════════════════════════════
async function inscrever(sock, jid, nome) {
  if (!state.torneio || state.torneio.fase !== 'inscricao') {
    await sock.sendMessage(jid, { text: '⚠️ Nenhum torneio aberto! Aguarda !torneio' })
    return
  }
  if (state.torneio.modo === 'clans') {
    await sock.sendMessage(jid, { text: '⚠️ Este é um torneio de clãs com representantes já definidos!' })
    return
  }
  if (state.torneio.inscritos.includes(nome)) {
    await sock.sendMessage(jid, { text: `✅ *${nome}*, já estás inscrito!` })
    return
  }
  state.torneio.inscritos.push(nome)
  await sock.sendMessage(jid, {
    text: `✅ *${nome}* inscrito no torneio!\n👥 Inscritos (${state.torneio.inscritos.length}): ${state.torneio.inscritos.join(', ')}`
  })
}

// ════════════════════════════════════════
//  APOSTAS
// ════════════════════════════════════════
async function apostar(sock, jid, apostador, alvo, quantia) {
  if (!state.torneio || state.torneio.fase !== 'inscricao') {
    await sock.sendMessage(jid, { text: '⚠️ Só podes apostar durante as inscrições!' })
    return
  }

  const pts = parseInt(quantia)
  if (isNaN(pts) || pts < 10) {
    await sock.sendMessage(jid, { text: '❌ Aposta mínima: 10 pontos!\nEx: !apostar Naruto 50' })
    return
  }

  const user = getUser(apostador)
  if (user.pontos < pts) {
    await sock.sendMessage(jid, { text: `❌ Pontos insuficientes! Tens ${user.pontos} pts.` })
    return
  }

  user.pontos -= pts
  saveUser(apostador, user)

  if (!state.torneio.apostas[alvo]) state.torneio.apostas[alvo] = []
  state.torneio.apostas[alvo].push({ apostador, quantia: pts })

  await sock.sendMessage(jid, {
    text: `💰 *${apostador}* apostou *${pts} pontos* em *${alvo}*!\n🎲 Se ganhar, recebes *${pts * 2} pontos*!`
  })
}

// ════════════════════════════════════════
//  INICIAR FASE DE BATALHAS (bracket)
// ════════════════════════════════════════
async function iniciarFase(sock, jid) {
  state.torneio.inscritos = state.torneio.inscritos.sort(() => Math.random() - 0.5)
  state.torneio.fase = 'batalha'
  state.torneio.rodada = 1
  state.torneio.confrontos = gerarConfrontos(state.torneio.inscritos)
  state.torneio.vencedores = []
  state.torneio.confrontoAtual = 0

  let bracket = `⚔️ *TORNEIO COMEÇOU!*\n📊 *BRACKET — RODADA ${state.torneio.rodada}*\n\n`
  state.torneio.confrontos.forEach((c, i) => {
    if (c.bye) bracket += `🟡 ${c.j1} — avança automaticamente\n`
    else bracket += `⚔️ Confronto ${i + 1}: *${c.j1}* vs *${c.j2}*\n`
  })
  bracket += `\n🎮 As batalhas começam agora!`

  await sock.sendMessage(jid, { text: bracket })
  await sleep(3000)
  await iniciarProximoBatalha(sock, jid)
}

// ════════════════════════════════════════
//  PRÓXIMA BATALHA
// ════════════════════════════════════════
async function iniciarProximoBatalha(sock, jid) {
  while (state.torneio.confrontoAtual < state.torneio.confrontos.length) {
    const c = state.torneio.confrontos[state.torneio.confrontoAtual]
    if (c.bye) {
      state.torneio.vencedores.push(c.j1)
      state.torneio.confrontoAtual++
      continue
    }
    break
  }

  if (state.torneio.confrontoAtual >= state.torneio.confrontos.length) {
    await verificarFimRodada(sock, jid)
    return
  }

  const confronto = state.torneio.confrontos[state.torneio.confrontoAtual]
  const u1 = getUser(confronto.j1)
  const u2 = getUser(confronto.j2)

  state.torneio.batalhaAtual = {
    j1: confronto.j1, j2: confronto.j2,
    vida1: u1.vida || 100, vida2: u2.vida || 100,
    atk1: u1.ataque || 10, atk2: u2.ataque || 10,
    hab1: u1.habilidade_ativa, hab2: u2.habilidade_ativa,
    pet1: u1.pet_ativo, pet2: u2.pet_ativo,
    escudo1: u1.escudo || false, escudo2: u2.escudo || false,
    turno: confronto.j1,
    timeout: null
  }

  await sock.sendMessage(jid, {
    text: `⚔️ *BATALHA ${state.torneio.confrontoAtual + 1}!*\n\n🔴 *${confronto.j1}* ❤️ ${state.torneio.batalhaAtual.vida1} HP\nvs\n🔵 *${confronto.j2}* ❤️ ${state.torneio.batalhaAtual.vida2} HP\n\n🎮 É o turno de *${confronto.j1}*!\nUsa *!atacar* para atacar!\n\n⏱️ 60 segundos para atacar ou perdes o turno!`
  })

  state.torneio.batalhaAtual.timeout = setTimeout(async () => {
    if (!state.torneio?.batalhaAtual) return
    const b = state.torneio.batalhaAtual
    await sock.sendMessage(jid, { text: `⏰ *${b.turno}* demorou demais! Perdeu o turno!\n\nAgora é a vez de *${b.turno === b.j1 ? b.j2 : b.j1}*!` })
    b.turno = b.turno === b.j1 ? b.j2 : b.j1
    reiniciarTimeout(sock, jid)
  }, 60000)
}

function reiniciarTimeout(sock, jid) {
  if (!state.torneio?.batalhaAtual) return
  clearTimeout(state.torneio.batalhaAtual.timeout)
  state.torneio.batalhaAtual.timeout = setTimeout(async () => {
    if (!state.torneio?.batalhaAtual) return
    const b = state.torneio.batalhaAtual
    await sock.sendMessage(jid, { text: `⏰ *${b.turno}* demorou demais! Perdeu o turno!` })
    b.turno = b.turno === b.j1 ? b.j2 : b.j1
    reiniciarTimeout(sock, jid)
  }, 60000)
}

// ════════════════════════════════════════
//  ATACAR NO TORNEIO (interativo)
// ════════════════════════════════════════
async function atacarTorneio(sock, jid, nome) {
  if (!state.torneio?.batalhaAtual) return false
  const b = state.torneio.batalhaAtual

  if (nome !== b.j1 && nome !== b.j2) return false
  if (b.turno !== nome) {
    await sock.sendMessage(jid, { text: `⏳ Não é o teu turno, *${nome}*! Aguarda *${b.turno}*!` })
    return true
  }

  clearTimeout(b.timeout)

  const ehJ1 = nome === b.j1
  const oponente = ehJ1 ? b.j2 : b.j1
  const atkBase = ehJ1 ? b.atk1 : b.atk2
  const hab = ehJ1 ? b.hab1 : b.hab2
  const habOp = ehJ1 ? b.hab2 : b.hab1
  const escudoOp = ehJ1 ? b.escudo2 : b.escudo1

  let dano = Math.floor(atkBase * (0.8 + Math.random() * 0.6))
  let efeitos = []

  if (hab === 'rasengan' && Math.random() < 0.25) { dano *= 2; efeitos.push('💥 CRÍTICO com Rasengan!') }
  if (hab === 'bankai') { dano = Math.floor(dano * 1.5); efeitos.push('🌑 Bankai ativado!') }
  if (hab === 'kamehameha' && Math.random() < 0.15) { efeitos.push(`⚡ *KNOCKDOWN! ${oponente} perde o próximo turno!*`) }
  if (hab === 'modo_seis') { dano = Math.floor(dano * 2); efeitos.push('🔱 Modo Seis Caminhos!') }

  if (habOp === 'sharingan' && Math.random() < 0.20) { dano = 0; efeitos.push(`👁️ *${oponente} esquivou com Sharingan!*`) }
  if (habOp === 'haki') { dano = Math.floor(dano * 0.7); efeitos.push(`⚫ *Haki de ${oponente} reduziu o dano!*`) }

  if (escudoOp) {
    dano = 0
    if (ehJ1) b.escudo2 = false; else b.escudo1 = false
    efeitos.push(`🛡️ *${oponente} bloqueou com escudo!*`)
  }

  if ((ehJ1 ? b.pet1 : b.pet2) === 'kurama') {
    const regen = 10
    if (ehJ1) b.vida1 = Math.min(b.vida1 + regen, 150)
    else b.vida2 = Math.min(b.vida2 + regen, 150)
    efeitos.push(`🦊 *Kurama regenerou ${regen} HP!*`)
  }

  if (ehJ1) b.vida2 = Math.max(0, b.vida2 - dano)
  else b.vida1 = Math.max(0, b.vida1 - dano)

  const vidaOponente = ehJ1 ? b.vida2 : b.vida1
  const habilidades = {
    sharingan: '👁️ Sharingan', rasengan: '🌀 Rasengan',
    haki: '⚫ Haki', bankai: '🌑 Bankai',
    kamehameha: '💥 Kamehameha', modo_seis: '🔱 Seis Caminhos'
  }
  const habNome = habilidades[hab] || 'Ataque normal'

  let txt = `⚔️ *${nome}* usou *${habNome}*!\n💢 ${dano} de dano em *${oponente}*!\n\n`
  if (efeitos.length > 0) txt += efeitos.join('\n') + '\n\n'
  txt += `❤️ ${b.j1}: ${b.vida1} HP\n❤️ ${b.j2}: ${b.vida2} HP\n\n`

  if (vidaOponente <= 0) {
    clearTimeout(b.timeout)
    txt += `💀 *${oponente}* foi derrotado!\n🏅 *${nome}* venceu a batalha!`
    await sock.sendMessage(jid, { text: txt })

    const user = getUser(nome)
    user.xp += 30; user.pontos += 20; user.vitorias = (user.vitorias || 0) + 1
    saveUser(nome, user)

    state.torneio.vencedores.push(nome)
    state.torneio.confrontoAtual++
    state.torneio.batalhaAtual = null

    await sleep(3000)
    await iniciarProximoBatalha(sock, jid)
    return true
  }

  b.turno = oponente
  txt += `🎮 Turno de *${oponente}* — usa *!atacar*!`
  await sock.sendMessage(jid, { text: txt })
  reiniciarTimeout(sock, jid)
  return true
}

// ════════════════════════════════════════
//  VERIFICAR FIM DA RODADA
// ════════════════════════════════════════
async function verificarFimRodada(sock, jid) {
  if (state.torneio.vencedores.length === 1) {
    const campeao = state.torneio.vencedores[0]
    const user = getUser(campeao)

    user.xp += 150; user.pontos += 120
    user.vitorias = (user.vitorias || 0) + 1
    user.titulo = '🏆 Campeão do Torneio'
    if (!user.habilidades) user.habilidades = []
    if (!user.habilidades.find(h => h.id === 'modo_seis')) {
      user.habilidades.push({ id: 'modo_seis', ...ITENS['modo_seis'] })
    }
    saveUser(campeao, user)

    if (state.torneio.modo === 'clans' && state.torneio.claDosInscritos) {
      const nomeCla = state.torneio.claDosInscritos[campeao]
      if (nomeCla) {
        const social = JSON.parse(fs.readFileSync('./data/social.json'))
        const clan = Object.values(social.clans).find(c => c.nome === nomeCla)
        if (clan) {
          for (const membro of clan.membros) {
            const membroUser = getUser(membro)
            membroUser.xp += 80
            membroUser.pontos += 60
            saveUser(membro, membroUser)
          }
          await sock.sendMessage(jid, {
            text: `🎉 *${clan.emblema} ${clan.nome}* venceu o Torneio de Clãs!\n👑 Representante: *${campeao}*\n\n+80 XP e +60 pontos para todos os membros: ${clan.membros.join(', ')}`
          })
        }
      }
    } else {
      await pagarApostas(sock, jid, campeao)
      await enviarVitoriaTorneio(sock, jid, campeao)
    }

    state.torneio = null
    return
  }

  state.torneio.rodada++
  state.torneio.inscritos = [...state.torneio.vencedores]
  state.torneio.confrontos = gerarConfrontos(state.torneio.inscritos)
  state.torneio.vencedores = []
  state.torneio.confrontoAtual = 0

  let bracket = `📊 *RODADA ${state.torneio.rodada}*\n\n`
  state.torneio.confrontos.forEach((c, i) => {
    if (c.bye) bracket += `🟡 ${c.j1} — avança automaticamente\n`
    else bracket += `⚔️ Confronto ${i + 1}: *${c.j1}* vs *${c.j2}*\n`
  })

  await sock.sendMessage(jid, { text: bracket })
  await sleep(3000)
  await iniciarProximoBatalha(sock, jid)
}

// ════════════════════════════════════════
//  TORNEIO DE CLÃS
// ════════════════════════════════════════
async function torneioClans(sock, jid) {
  if (state.torneio) {
    await sock.sendMessage(jid, { text: '🏆 Já há um torneio em curso! Termina esse primeiro.' })
    return
  }

  const social = JSON.parse(fs.readFileSync('./data/social.json'))
  const clans = Object.values(social.clans || {})

  const participantes = clans.filter(c => c.representante && c.membros.includes(c.representante))

  if (participantes.length < 2) {
    await sock.sendMessage(jid, { text: '❌ Precisas de pelo menos 2 clãs com representante definido!\nUsa *!cla representante @membro* em cada clã.' })
    return
  }

  state.torneio = {
    jid,
    inscritos: participantes.map(c => c.representante),
    apostas: {},
    fase: 'inscricao',
    batalhaAtual: null,
    modo: 'clans',
    claDosInscritos: {}
  }

  for (const clan of participantes) {
    state.torneio.claDosInscritos[clan.representante] = clan.nome
  }

  await sock.sendMessage(jid, {
    text: `⚔️ *TORNEIO DE CLÃS INICIADO!*\n\nRepresentantes:\n${participantes.map(c => `${c.emblema} ${c.nome}: *${c.representante}*`).join('\n')}\n\n🎮 As batalhas começam em breve!`
  })

  await sleep(3000)
  await iniciarFase(sock, jid)
}

// ════════════════════════════════════════
//  TORNEIO SEMANAL AUTOMÁTICO
// ════════════════════════════════════════
function agendarTorneioSemanal(sock, jid) {
  setInterval(async () => {
    const agora = new Date()
    if (agora.getDay() === 6 && agora.getHours() === 20 && agora.getMinutes() === 0) {
      if (state.torneio) return

      await sock.sendMessage(jid, {
        text: `🏆 *TORNEIO SEMANAL AUTOMÁTICO!*\n\nÉ sábado e são 20h — hora do grande torneio!\n\nInscreve-te com *!inscrever*\nO prémio desta semana é DOBRADO! 🎁`
      })

      state.torneio = { jid, inscritos: [], apostas: {}, fase: 'inscricao', batalhaAtual: null, multiplicador: 2, modo: 'normal' }

      setTimeout(async () => {
        if (!state.torneio || state.torneio.inscritos.length < 2) {
          if (state.torneio) {
            await sock.sendMessage(jid, { text: '❌ Torneio semanal cancelado — participantes insuficientes.' })
            await devolverApostas(sock, jid)
            state.torneio = null
          }
          return
        }
        await iniciarFase(sock, jid)
      }, 120000)
    }
  }, 60000)
}

// ════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════
function gerarConfrontos(participantes) {
  const lista = [...participantes]
  const confrontos = []
  for (let i = 0; i < lista.length; i += 2) {
    if (i + 1 < lista.length) confrontos.push({ j1: lista[i], j2: lista[i + 1], bye: false })
    else confrontos.push({ j1: lista[i], bye: true })
  }
  return confrontos
}

async function pagarApostas(sock, jid, vencedor) {
  if (!state.torneio?.apostas?.[vencedor]?.length) return
  const ganhadores = []
  for (const { apostador, quantia } of state.torneio.apostas[vencedor]) {
    const user = getUser(apostador)
    user.pontos += quantia * 2
    saveUser(apostador, user)
    ganhadores.push(`${apostador} (+${quantia * 2} pts)`)
  }
  await sock.sendMessage(jid, { text: `💰 *APOSTAS PAGAS!*\n\n${ganhadores.join('\n')}` })
}

async function devolverApostas(sock, jid) {
  if (!state.torneio?.apostas) return
  for (const lista of Object.values(state.torneio.apostas)) {
    for (const { apostador, quantia } of lista) {
      const user = getUser(apostador)
      user.pontos += quantia
      saveUser(apostador, user)
    }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function verTorneio(sock, jid) {
  if (!state.torneio) {
    await sock.sendMessage(jid, { text: '🏆 Nenhum torneio ativo. Usa !torneio para iniciar!' })
    return
  }

  if (state.torneio.fase === 'inscricao') {
    await sock.sendMessage(jid, {
      text: `🏆 *TORNEIO — Inscrições abertas*\n\n👥 Inscritos (${state.torneio.inscritos.length}): ${state.torneio.inscritos.join(', ') || 'nenhum'}\n\n⚔️ Inscreve-te com *!inscrever*\n💰 Aposta com *!apostar <nome> <pontos>*`
    })
    return
  }

  const b = state.torneio.batalhaAtual
  if (b) {
    await sock.sendMessage(jid, {
      text: `⚔️ *BATALHA EM CURSO — Rodada ${state.torneio.rodada}*\n\n🔴 *${b.j1}* ❤️ ${b.vida1} HP\n🔵 *${b.j2}* ❤️ ${b.vida2} HP\n\n🎮 Turno de *${b.turno}* — usa *!atacar*!`
    })
  }
}

module.exports = {
  iniciarTorneio,
  inscrever,
  apostar,
  atacarTorneio,
  verTorneio,
  torneioClans,
  agendarTorneioSemanal,
  state
}
