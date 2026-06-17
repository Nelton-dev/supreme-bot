const { getUser, saveUser, todosUsuarios } = require('../db')
const { ITENS } = require('./loja')

let torneioAtivo = null

// ════════════════════════════════════════
//  INICIAR TORNEIO
// ════════════════════════════════════════
async function iniciarTorneio(sock, jid, tipo = 'individual') {
  if (torneioAtivo) {
    await sock.sendMessage(jid, { text: '🏆 Já há um torneio em curso!' })
    return
  }

  torneioAtivo = {
    jid, tipo, inscritos: [], apostas: {},
    fase: 'inscricao', inicio: Date.now()
  }

  await sock.sendMessage(jid, {
    text: `🏆 *TORNEIO ${tipo.toUpperCase()} INICIADO!*\n\n⚔️ Inscreve-te com *!inscrever*\n💰 Aposta pontos com *!apostar <nome> <pontos>*\n⏱️ Inscrições encerram em 60 segundos!\n\nMínimo 2 participantes para começar.`
  })

  setTimeout(async () => {
    if (!torneioAtivo) return
    if (torneioAtivo.inscritos.length < 2) {
      await sock.sendMessage(jid, { text: '❌ Torneio cancelado — participantes insuficientes.' })
      // Devolve apostas
      await devolverApostas(sock, jid)
      torneioAtivo = null
      return
    }
    await correrTorneio(sock, jid)
  }, 60000)
}

// ════════════════════════════════════════
//  INSCRIÇÃO
// ════════════════════════════════════════
async function inscrever(sock, jid, nome) {
  if (!torneioAtivo || torneioAtivo.fase !== 'inscricao') {
    await sock.sendMessage(jid, { text: '⚠️ Nenhum torneio aberto! Aguarda *!torneio*' })
    return
  }
  if (torneioAtivo.inscritos.includes(nome)) {
    await sock.sendMessage(jid, { text: `✅ *${nome}*, já estás inscrito!` })
    return
  }
  torneioAtivo.inscritos.push(nome)
  await sock.sendMessage(jid, {
    text: `✅ *${nome}* inscrito!\n👥 Inscritos (${torneioAtivo.inscritos.length}): ${torneioAtivo.inscritos.join(', ')}`
  })
}

// ════════════════════════════════════════
//  APOSTAS
// ════════════════════════════════════════
async function apostar(sock, jid, apostador, alvo, quantia) {
  if (!torneioAtivo || torneioAtivo.fase !== 'inscricao') {
    await sock.sendMessage(jid, { text: '⚠️ Só podes apostar durante as inscrições!' })
    return
  }

  const pts = parseInt(quantia)
  if (isNaN(pts) || pts < 10) {
    await sock.sendMessage(jid, { text: '❌ Aposta mínima: 10 pontos!\nEx: *!apostar Naruto 50*' })
    return
  }

  const { user } = getUser(apostador)
  if (user.pontos < pts) {
    await sock.sendMessage(jid, { text: `❌ Pontos insuficientes! Tens ${user.pontos} pts.` })
    return
  }

  user.pontos -= pts
  saveUser(apostador, user)

  if (!torneioAtivo.apostas[alvo]) torneioAtivo.apostas[alvo] = []
  torneioAtivo.apostas[alvo].push({ apostador, quantia: pts })

  await sock.sendMessage(jid, {
    text: `💰 *${apostador}* apostou *${pts} pontos* em *${alvo}*!\n\n🎲 Se *${alvo}* ganhar, recebes o dobro (${pts * 2} pts)!`
  })
}

async function devolverApostas(sock, jid) {
  if (!torneioAtivo?.apostas) return
  for (const [, lista] of Object.entries(torneioAtivo.apostas)) {
    for (const { apostador, quantia } of lista) {
      const { user } = getUser(apostador)
      user.pontos += quantia
      saveUser(apostador, user)
    }
  }
}

async function pagarApostas(sock, jid, vencedor) {
  if (!torneioAtivo?.apostas?.[vencedor]) return
  const ganhadores = []
  for (const { apostador, quantia } of torneioAtivo.apostas[vencedor]) {
    const { user } = getUser(apostador)
    user.pontos += quantia * 2
    saveUser(apostador, user)
    ganhadores.push(`${apostador} (+${quantia * 2} pts)`)
  }
  if (ganhadores.length > 0) {
    await sock.sendMessage(jid, {
      text: `💰 *APOSTAS PAGAS!*\n\n${ganhadores.join('\n')}`
    })
  }
}

// ════════════════════════════════════════
//  SIMULAR BATALHA COM HABILIDADES
// ════════════════════════════════════════
function simularBatalhaCompleta(j1, j2) {
  const { user: u1 } = getUser(j1)
  const { user: u2 } = getUser(j2)

  let vida1 = u1.vida || 100
  let vida2 = u2.vida || 100
  const atk1 = u1.ataque || 10
  const atk2 = u2.ataque || 10
  const hab1 = u1.habilidade_ativa
  const hab2 = u2.habilidade_ativa
  const pet1 = u1.pet_ativo
  const pet2 = u2.pet_ativo
  const log = []

  // Aplica bônus de pet
  const petBonus = (petId) => {
    const pet = ITENS[petId]
    return pet?.atk || 0
  }

  const atk1Final = atk1 + petBonus(pet1) + (u1.nivel || 1) * 3 + Math.random() * 20
  const atk2Final = atk2 + petBonus(pet2) + (u2.nivel || 1) * 3 + Math.random() * 20

  // Simula 3 rondas
  for (let i = 0; i < 3; i++) {
    let dano1 = Math.floor(atk1Final * (0.8 + Math.random() * 0.4))
    let dano2 = Math.floor(atk2Final * (0.8 + Math.random() * 0.4))

    // Habilidades j1
    if (hab1 === 'rasengan' && Math.random() < 0.25) { dano1 *= 2; log.push(`💥 ${j1} acertou crítico com Rasengan!`) }
    if (hab1 === 'bankai') dano1 = Math.floor(dano1 * 1.5)
    if (hab1 === 'kamehameha' && Math.random() < 0.15) { dano2 = 0; log.push(`⚡ ${j1} fez knockdown com Kamehameha!`) }

    // Habilidades j2
    if (hab2 === 'sharingan' && Math.random() < 0.20) { dano1 = 0; log.push(`👁️ ${j2} esquivou com Sharingan!`) }
    if (hab2 === 'haki') dano1 = Math.floor(dano1 * 0.7)
    if (hab2 === 'modo_seis') { dano2 *= 2; log.push(`🔱 ${j2} ativou Modo Seis Caminhos!`) }

    // Escudo
    if (u1.escudo) { dano2 = 0; u1.escudo = false; log.push(`🛡️ ${j1} bloqueou com escudo!`) }
    if (u2.escudo) { dano1 = 0; u2.escudo = false; log.push(`🛡️ ${j2} bloqueou com escudo!`) }

    // Pet Kurama regen
    if (pet1 === 'kurama') vida1 = Math.min(vida1 + 10, u1.vida || 100)
    if (pet2 === 'kurama') vida2 = Math.min(vida2 + 10, u2.vida || 100)

    vida1 -= dano2
    vida2 -= dano1
  }

  return {
    vencedor: vida1 >= vida2 ? j1 : j2,
    perdedor: vida1 >= vida2 ? j2 : j1,
    log: log.slice(0, 3)
  }
}

// ════════════════════════════════════════
//  CORRER TORNEIO COM BRACKET
// ════════════════════════════════════════
async function correrTorneio(sock, jid) {
  let participantes = [...torneioAtivo.inscritos].sort(() => Math.random() - 0.5)
  torneioAtivo.fase = 'batalha'
  let rodada = 1

  // Bracket visual
  const bracket = gerarBracket(participantes)
  await sock.sendMessage(jid, {
    text: `⚔️ *TORNEIO COMEÇOU!*\n\n${bracket}\n\n🎮 As batalhas começam agora!`
  })

  await sleep(3000)

  while (participantes.length > 1) {
    const vencedores = []
    let txtRodada = `🥊 *RODADA ${rodada}*\n\n`

    for (let i = 0; i < participantes.length; i += 2) {
      if (i + 1 >= participantes.length) {
        vencedores.push(participantes[i])
        txtRodada += `🟡 *${participantes[i]}* — bye (avança)\n\n`
        continue
      }

      const j1 = participantes[i]
      const j2 = participantes[i + 1]
      const resultado = simularBatalhaCompleta(j1, j2)

      vencedores.push(resultado.vencedor)
      txtRodada += `⚔️ *${j1}* vs *${j2}*\n`
      if (resultado.log.length > 0) txtRodada += resultado.log.join('\n') + '\n'
      txtRodada += `🏅 Vencedor: *${resultado.vencedor}*\n\n`
    }

    await sock.sendMessage(jid, { text: txtRodada })
    participantes = vencedores
    rodada++
    await sleep(3000)
  }

  const campeao = participantes[0]
  const { user } = getUser(campeao)
  user.xp += 150
  user.pontos += 120
  user.vitorias = (user.vitorias || 0) + 1
  user.titulo = '🏆 Campeão do Torneio'
  // Habilidade exclusiva para campeão
  if (!user.habilidades) user.habilidades = []
  if (!user.habilidades.find(h => h.id === 'modo_seis')) {
    user.habilidades.push({ id: 'modo_seis', ...ITENS['modo_seis'] })
  }
  saveUser(campeao, user)

  await pagarApostas(sock, jid, campeao)

  await sock.sendMessage(jid, {
    text: `🎉 *TORNEIO ENCERRADO!*\n\n👑 *CAMPEÃO: ${campeao}*\n\n+150 XP | +120 pontos\n🎁 Título: 🏆 Campeão do Torneio\n🎁 Habilidade desbloqueada: 🔱 Modo Seis Caminhos\n\n${gerarPodio(torneioAtivo.inscritos, campeao)}`
  })

  torneioAtivo = null
}

// ════════════════════════════════════════
//  TORNEIO DE CLÃS
// ════════════════════════════════════════
async function torneioClans(sock, jid) {
  const fs = require('fs')
  const social = JSON.parse(fs.readFileSync('./data/social.json'))
  const clans = Object.values(social.clans || {})

  if (clans.length < 2) {
    await sock.sendMessage(jid, { text: '❌ Precisas de pelo menos 2 clãs para o torneio!\nCria um clã com *!criar-cla <nome>*' })
    return
  }

  await sock.sendMessage(jid, { text: `⚔️ *TORNEIO DE CLÃS INICIADO!*\n\n${clans.map(c => `${c.emblema} ${c.nome} (${c.membros.length} membros)`).join('\n')}\n\n🎮 Batalhas a simular...` })

  await sleep(2000)

  let participantes = clans.sort(() => Math.random() - 0.5)

  while (participantes.length > 1) {
    const vencedores = []
    let txt = ''

    for (let i = 0; i < participantes.length; i += 2) {
      if (i + 1 >= participantes.length) { vencedores.push(participantes[i]); continue }

      const c1 = participantes[i]
      const c2 = participantes[i + 1]

      // Força do clã = soma de ataque dos membros
      const forcaC1 = c1.membros.reduce((s, m) => s + (getUser(m).user.ataque || 10) + (getUser(m).user.nivel || 1) * 5, 0) + Math.random() * 50
      const forcaC2 = c2.membros.reduce((s, m) => s + (getUser(m).user.ataque || 10) + (getUser(m).user.nivel || 1) * 5, 0) + Math.random() * 50

      const vencedor = forcaC1 >= forcaC2 ? c1 : c2
      vencedores.push(vencedor)
      txt += `${c1.emblema} *${c1.nome}* vs ${c2.emblema} *${c2.nome}* → 🏅 *${vencedor.nome}*\n`
    }

    await sock.sendMessage(jid, { text: txt })
    participantes = vencedores
    await sleep(2000)
  }

  const clanVencedor = participantes[0]

  // Recompensa membros do clã vencedor
  for (const membro of clanVencedor.membros) {
    const { user } = getUser(membro)
    user.xp += 80; user.pontos += 60
    saveUser(membro, user)
  }

  await sock.sendMessage(jid, {
    text: `🎉 *TORNEIO DE CLÃS ENCERRADO!*\n\n👑 *CAMPEÃO: ${clanVencedor.emblema} ${clanVencedor.nome}*\n\n+80 XP e +60 pontos para todos os membros!\n👥 Membros: ${clanVencedor.membros.join(', ')}`
  })
}

// ════════════════════════════════════════
//  TORNEIO SEMANAL AUTOMÁTICO
// ════════════════════════════════════════
function agendarTorneioSemanal(sock, jid) {
  // Todo sábado às 20:00
  setInterval(async () => {
    const agora = new Date()
    if (agora.getDay() === 6 && agora.getHours() === 20 && agora.getMinutes() === 0) {
      await sock.sendMessage(jid, {
        text: `🏆 *TORNEIO SEMANAL AUTOMÁTICO!*\n\nÉ sábado e são 20h — hora do grande torneio!\n\nInscreve-te com *!inscrever*\nO prémio desta semana é DOBRADO! 🎁`
      })
      torneioAtivo = {
        jid, tipo: 'semanal', inscritos: [],
        apostas: {}, fase: 'inscricao',
        multiplicador: 2
      }
      setTimeout(async () => {
        if (!torneioAtivo || torneioAtivo.inscritos.length < 2) {
          torneioAtivo = null; return
        }
        await correrTorneio(sock, jid)
      }, 120000) // 2 minutos para inscrições
    }
  }, 60000)
}

// ════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════
function gerarBracket(participantes) {
  let txt = '📊 *BRACKET DO TORNEIO*\n\n'
  for (let i = 0; i < participantes.length; i += 2) {
    if (i + 1 < participantes.length) {
      txt += `⚔️ ${participantes[i]} vs ${participantes[i + 1]}\n`
    } else {
      txt += `🟡 ${participantes[i]} (bye)\n`
    }
  }
  return txt
}

function gerarPodio(todos, campeao) {
  return `🏆 *PÓDIO FINAL*\n🥇 ${campeao}\n${todos.filter(p => p !== campeao).map((p, i) => `${['🥈','🥉'][i] || `${i+2}.`} ${p}`).join('\n')}`
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

module.exports = {
  iniciarTorneio, inscrever, apostar,
  torneioClans, agendarTorneioSemanal
}
