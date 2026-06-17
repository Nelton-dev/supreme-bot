const { getUser, saveUser } = require('../db')

const batalhasAtivas = {}

const habilidades = [
  { nome: 'Rasengan', dano: [20, 40] },
  { nome: 'Chidori', dano: [15, 45] },
  { nome: 'Getsuga Tenshō', dano: [25, 35] },
  { nome: 'Kamehameha', dano: [30, 50] },
  { nome: 'Smash de 100%', dano: [35, 55] },
  { nome: 'Explosion!', dano: [20, 60] },
  { nome: 'Amaterasu', dano: [40, 60] },
]

function habilidadeAleatoria() {
  return habilidades[Math.floor(Math.random() * habilidades.length)]
}

function danoAleatorio(hab) {
  return Math.floor(Math.random() * (hab.dano[1] - hab.dano[0] + 1)) + hab.dano[0]
}

async function desafiar(sock, jid, desafiante, alvo) {
  if (batalhasAtivas[jid]) {
    await sock.sendMessage(jid, { text: '⚔️ Já há uma batalha em curso! Aguardem.' })
    return
  }
  batalhasAtivas[jid] = {
    jogador1: { nome: desafiante, vida: 100 },
    jogador2: { nome: alvo, vida: 100 },
    turno: desafiante,
    aguardando: true
  }
  await sock.sendMessage(jid, {
    text: `⚔️ *${desafiante}* desafiou *${alvo}* para uma batalha!\n\n@${alvo}, aceitas o desafio? Responde *!aceitar* ou *!recusar*`
  })
}

async function aceitar(sock, jid, nome) {
  const b = batalhasAtivas[jid]
  if (!b || !b.aguardando || b.jogador2.nome !== nome) return
  b.aguardando = false
  await sock.sendMessage(jid, {
    text: `🔥 *BATALHA INICIADA!*\n\n⚔️ ${b.jogador1.nome} ❤️ 100 HP\nvs\n⚔️ ${b.jogador2.nome} ❤️ 100 HP\n\n🎮 É o turno de *${b.turno}*!\nUsa *!atacar* para atacar!`
  })
}

async function recusar(sock, jid, nome) {
  const b = batalhasAtivas[jid]
  if (!b || !b.aguardando || b.jogador2.nome !== nome) return
  delete batalhasAtivas[jid]
  await sock.sendMessage(jid, { text: `😤 *${nome}* recusou o desafio. Covarde! 🐔` })
}

async function atacar(sock, jid, nome) {
  const b = batalhasAtivas[jid]
  if (!b || b.aguardando) return
  if (b.turno !== nome) {
    await sock.sendMessage(jid, { text: `⏳ Não é o teu turno, *${nome}*!` })
    return
  }

  const hab = habilidadeAleatoria()
  const dano = danoAleatorio(hab)
  const oponente = b.jogador1.nome === nome ? b.jogador2 : b.jogador1
  oponente.vida = Math.max(0, oponente.vida - dano)

  if (oponente.vida <= 0) {
    // Fim da batalha
    const { db, user: vencedorUser } = getUser(nome)
    vencedorUser.vitorias = (vencedorUser.vitorias || 0) + 1
    vencedorUser.xp += 50
    vencedorUser.pontos += 30
    saveUser(nome, vencedorUser)

    await sock.sendMessage(jid, {
      text: `💥 *${nome}* usou *${hab.nome}* e causou *${dano} de dano!*\n\n☠️ *${oponente.nome}* foi derrotado!\n\n🏆 *${nome}* venceu!\n+50 XP | +30 pontos`
    })
    delete batalhasAtivas[jid]
    return
  }

  b.turno = oponente.nome
  const atual = b.jogador1.nome === nome ? b.jogador1 : b.jogador2
  await sock.sendMessage(jid, {
    text: `💥 *${nome}* usou *${hab.nome}*!\n⚡ ${dano} de dano!\n\n❤️ ${atual.nome}: ${atual.vida} HP\n❤️ ${oponente.nome}: ${oponente.vida} HP\n\n🎮 Turno de *${oponente.nome}* — usa *!atacar*!`
  })
}

module.exports = { desafiar, aceitar, recusar, atacar, batalhasAtivas }