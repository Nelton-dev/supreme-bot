const { getUser, saveUser } = require('../db')

// ════════════════════════════════════════
//  PILARES PRIMORDIAIS E INTERAÇÕES
// ════════════════════════════════════════
const ELEMENTOS = {
  ignis: { emoji: '🔥', forteContra: 'petra', fracoContra: 'aquor', habilidade: 'Explosão Flamejante', desc: 'Ignis, o Pilar da Paixão e da destruição criativa. Queima o inimigo por 3 turnos.' },
  aquor: { emoji: '💧', forteContra: 'ignis', fracoContra: 'fulgor', habilidade: 'Torrente Congelante', desc: 'Aquor, o Pilar da fluidez e da adaptação. Reduz o ataque do inimigo.' },
  petra: { emoji: '🪨', forteContra: 'fulgor', fracoContra: 'aeris', habilidade: 'Terremoto', desc: 'Petra, o Pilar da firmeza e da tradição. Aumenta sua defesa.' },
  aeris: { emoji: '🌬️', forteContra: 'petra', fracoContra: 'ignis', habilidade: 'Vento do Despertar', desc: 'Aeris, o Pilar da liberdade e da mudança. Ganha mobilidade e evasão.' },
  lux: { emoji: '✨', forteContra: 'umbra', fracoContra: 'umbra', habilidade: 'Julgamento Divino', desc: 'Lux, o Pilar da clareza e da verdade. Cura uma porção do dano causado.' },
  umbra: { emoji: '🌑', forteContra: 'lux', fracoContra: 'lux', habilidade: 'Abismo Sombrio', desc: 'Umbra, o Pilar do mistério e do potencial oculto. Drena vida do inimigo.' },
  fulgor: { emoji: '⚡', forteContra: 'aquor', fracoContra: 'petra', habilidade: 'Tempestade Elétrica', desc: 'Fulgor, o Pilar da transformação e do choque. Atordoa o inimigo por 1 turno.' },
  tempus: { emoji: '⏳', forteContra: 'animus', fracoContra: null, habilidade: 'Eclipse Temporal', desc: 'Tempus, Pilar perdido do tempo, selado por ser perigoso demais.', raro: true },
  animus: { emoji: '🕊️', forteContra: 'tempus', fracoContra: null, habilidade: 'Essência Viva', desc: 'Animus, o Pilar da alma e da essência, raríssimo entre os Caçadores.', raro: true }
}

const ALIAS_ELEMENTOS = {
  fogo: 'ignis',
  agua: 'aquor',
  natureza: 'petra',
  terra: 'petra',
  trovão: 'fulgor',
  trevas: 'umbra',
  luz: 'lux',
  ar: 'aeris',
  vento: 'aeris'
}

function normalizarElemento(elemento) {
  if (!elemento) return null
  const chave = String(elemento).toLowerCase()
  return ALIAS_ELEMENTOS[chave] || chave
}

// ════════════════════════════════════════
//  ESCOLHER ELEMENTO
// ════════════════════════════════════════
async function escolherElemento(sock, jid, nome, elemento) {
  const user = getUser(nome)
  if (!user.despertou) {
    await sock.sendMessage(jid, { text: '🌌 Você ainda não despertou no Nexus World!' })
    return
  }

  const elementoNormalizado = normalizarElemento(elemento)
  const elem = ELEMENTOS[elementoNormalizado]
  if (!elem) {
    const lista = Object.entries(ELEMENTOS).filter(([, v]) => !v.raro).map(([k, v]) => `${v.emoji} *${k}* - ${v.desc}`).join('\n')
    await sock.sendMessage(jid, { text: `⚠️ Pilar inválido! Escolha um dos Pilares disponíveis:\n\n${lista}\n\nUse *!elemento <nome>*` })
    return
  }

  user.elemento = elementoNormalizado
  if (!user.afinidade) user.afinidade = {}
  user.afinidade[elementoNormalizado] = (user.afinidade[elementoNormalizado] || 0) + 1
  saveUser(nome, user)

  await sock.sendMessage(jid, {
    text: `${elem.emoji} *${nome}* recebeu a bênção do Pilar *${elemento.toUpperCase()}*!\n\nHabilidade especial: *${elem.habilidade}*\n${elem.desc}\n\nUse *!afinidade* para ver a sua ligação com os Pilares.`
  })
}

// ════════════════════════════════════════
//  VER AFINIDADE ELEMENTAL
// ════════════════════════════════════════
async function verAfinidade(sock, jid, nome) {
  const user = getUser(nome)
  if (!user.elemento) {
    await sock.sendMessage(jid, { text: '🌌 Você ainda não escolheu um Pilar! Use *!elemento <nome>* para receber a sua bênção.' })
    return
  }

  const afinidade = user.afinidade || {}
  let txt = `🌟 *Afinidade dos Pilares de ${nome}*\n\n`
  for (const [elem, nivel] of Object.entries(afinidade)) {
    const chave = normalizarElemento(elem)
    const info = ELEMENTOS[chave]
    if (!info) continue
    const barra = '█'.repeat(Math.min(10, nivel)) + '░'.repeat(Math.max(0, 10 - Math.min(10, nivel)))
    txt += `${info.emoji} *${chave}*: Nível ${nivel} [${barra}]\n`
  }
  const elementoPrincipal = normalizarElemento(user.elemento)
  const infoPrincipal = ELEMENTOS[elementoPrincipal]
  txt += `\n🎯 Pilar Principal: ${infoPrincipal ? infoPrincipal.emoji : '🕯️'} *${elementoPrincipal ? elementoPrincipal.toUpperCase() : 'NENHUM'}*`

  await sock.sendMessage(jid, { text: txt })
}

// ════════════════════════════════════════
//  CALCULAR DANO COM ELEMENTO
// ════════════════════════════════════════
function calcularDanoElemental(atacante, defensor, danoBase) {
  const elementoAtk = normalizarElemento(atacante.elemento)
  const elementoDef = normalizarElemento(defensor.elemento)

  if (!elementoAtk || !elementoDef) return danoBase

  const interacao = ELEMENTOS[elementoAtk]
  let multiplicador = 1.0

  if (interacao.forteContra === elementoDef) {
    multiplicador = 1.5
  } else if (interacao.fracoContra === elementoDef) {
    multiplicador = 0.7
  }

  const afinidadeAtk = atacante.afinidade?.[elementoAtk] || 0
  multiplicador += afinidadeAtk * 0.05 // +5% por nível de afinidade

  return Math.floor(danoBase * multiplicador)
}

module.exports = {
  ELEMENTOS,
  escolherElemento,
  verAfinidade,
  calcularDanoElemental
}
