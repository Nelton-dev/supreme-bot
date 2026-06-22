const { getUser, saveUser } = require('../db')

// ════════════════════════════════════════
//  ELEMENTOS E INTERAÇÕES
// ════════════════════════════════════════
const ELEMENTOS = {
  fogo:     { emoji: '🔥', forteContra: 'natureza', fracoContra: 'agua', habilidade: 'Explosão Flamejante', desc: 'Dano extra contra Natureza. Queima o inimigo por 3 turnos.' },
  agua:     { emoji: '💧', forteContra: 'fogo', fracoContra: 'trovão', habilidade: 'Torrente Congelante', desc: 'Dano extra contra Fogo. Reduz o ataque do inimigo.' },
  natureza: { emoji: '🌿', forteContra: 'agua', fracoContra: 'fogo', habilidade: 'Vinhas Espinhosas', desc: 'Dano extra contra Água. Envenena o inimigo.' },
  trovão:   { emoji: '⚡', forteContra: 'agua', fracoContra: 'terra', habilidade: 'Tempestade Elétrica', desc: 'Dano extra contra Água. Atordoa o inimigo por 1 turno.' },
  terra:    { emoji: '🪨', forteContra: 'trovão', fracoContra: 'natureza', habilidade: 'Terremoto', desc: 'Dano extra contra Trovão. Aumenta sua defesa.' },
  trevas:   { emoji: '🌑', forteContra: 'luz', fracoContra: 'luz', habilidade: 'Abismo Sombrio', desc: 'Dano extra contra Luz. Drena vida do inimigo.' },
  luz:      { emoji: '✨', forteContra: 'trevas', fracoContra: 'trevas', habilidade: 'Julgamento Divino', desc: 'Dano extra contra Trevas. Cura uma porção do dano causado.' }
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

  const elem = ELEMENTOS[elemento]
  if (!elem) {
    const lista = Object.entries(ELEMENTOS).map(([k, v]) => `${v.emoji} *${k}* - ${v.desc}`).join('\n')
    await sock.sendMessage(jid, { text: `⚠️ Elemento inválido! Escolha um dos elementos disponíveis:\n\n${lista}\n\nUse *!elemento <nome>*` })
    return
  }

  user.elemento = elemento
  if (!user.afinidade) user.afinidade = {}
  user.afinidade[elemento] = (user.afinidade[elemento] || 0) + 1
  saveUser(nome, user)

  await sock.sendMessage(jid, {
    text: `${elem.emoji} *${nome}* escolheu o elemento *${elemento.toUpperCase()}*!\n\nHabilidade especial: *${elem.habilidade}*\n${elem.desc}\n\nUse *!afinidade* para ver seus elementos.`
  })
}

// ════════════════════════════════════════
//  VER AFINIDADE ELEMENTAL
// ════════════════════════════════════════
async function verAfinidade(sock, jid, nome) {
  const user = getUser(nome)
  if (!user.elemento) {
    await sock.sendMessage(jid, { text: '🌌 Você ainda não escolheu um elemento! Use *!elemento <nome>* para escolher.' })
    return
  }

  const afinidade = user.afinidade || {}
  let txt = `🌟 *Afinidade Elemental de ${nome}*\n\n`
  for (const [elem, nivel] of Object.entries(afinidade)) {
    const barra = '█'.repeat(nivel) + '░'.repeat(10 - nivel)
    txt += `${ELEMENTOS[elem].emoji} *${elem}*: Nível ${nivel} [${barra}]\n`
  }
  txt += `\n🎯 Elemento Principal: ${ELEMENTOS[user.elemento].emoji} *${user.elemento.toUpperCase()}*`

  await sock.sendMessage(jid, { text: txt })
}

// ════════════════════════════════════════
//  CALCULAR DANO COM ELEMENTO
// ════════════════════════════════════════
function calcularDanoElemental(atacante, defensor, danoBase) {
  const elementoAtk = atacante.elemento
  const elementoDef = defensor.elemento

  if (!elementoAtk || !elementoDef) return danoBase

  const interacao = ELEMENTOS[elementoAtk]
  let multiplicador = 1.0

  if (interacao.forteContra === elementoDef) {
    multiplicador = 1.5 // Vantagem elemental
  } else if (interacao.fracoContra === elementoDef) {
    multiplicador = 0.7 // Desvantagem elemental
  }

  // Bónus de afinidade
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
