const { getUser, saveUser, RANKS } = require('../db')
const { enviarImagem } = require('./imagens')

const rituais = {}

// ════════════════════════════════════════
//  VERIFICAR DESPERTAR
// ════════════════════════════════════════
async function verificarDespertar(sock, jid, nome, sender) {
  const user = getUser(nome)
  if (user.despertou) return true

  if (rituais[nome]) {
    if (Date.now() > rituais[nome].expira) {
      clearTimeout(rituais[nome].timeout)
      delete rituais[nome]
      return false
    }
    return false
  }

  await iniciarRitual(sock, jid, nome, sender)
  return false
}

// ════════════════════════════════════════
//  INICIAR RITUAL
// ════════════════════════════════════════
async function iniciarRitual(sock, jid, nome, sender) {
  const legenda = '🌌 *SISTEMA – NEXUS WORLD*\n\nUma presença inesperada atravessa o silêncio do Vazio: @' + sender.split('@')[0] + '\n\nO Conselho dos Caçadores convoca-te para o ritual do *Despertar*, onde a centelha de um Pilar pode ser reconhecida.\n\nResponda *ACEITAR* ou *RECUSAR* para selar o teu lugar entre os Pilares e o destino do Nexus.\n⏳ 5 minutos para decidir'

  await enviarImagem(sock, jid, 'ritual_despertar', legenda, { mentions: [sender] })

  const timeout = setTimeout(async () => {
    if (rituais[nome]) {
      await sock.sendMessage(jid, { text: '⏳ @' + sender.split('@')[0] + ' não respondeu ao chamado. O convite está suspenso até à próxima interação.', mentions: [sender] })
      delete rituais[nome]
    }
  }, 5 * 60 * 1000)

  rituais[nome] = { jid, expira: Date.now() + 5 * 60 * 1000, timeout }
}

// ════════════════════════════════════════
//  PROCESSAR RESPOSTA
// ════════════════════════════════════════
async function processarRespostaDespertar(sock, jid, nome, texto, sender) {
  const ritual = rituais[nome]
  if (!ritual) return false

  const resposta = texto.toLowerCase().trim()
  if (resposta === 'aceitar' || resposta === 'sim' || resposta === 'aceito') {
    clearTimeout(ritual.timeout)
    delete rituais[nome]
    await aceitarDespertar(sock, jid, nome, sender)
    return true
  }

  if (resposta === 'recusar' || resposta === 'não' || resposta === 'nao' || resposta === 'recuso') {
    clearTimeout(ritual.timeout)
    delete rituais[nome]
    await recusarDespertar(sock, jid, nome, sender)
    return true
  }

  return false
}

// ════════════════════════════════════════
//  ACEITAR DESPERTAR
// ════════════════════════════════════════
async function aceitarDespertar(sock, jid, nome, sender) {
  const user = getUser(nome)
  user.despertou = true
  user.rank = 'E'
  user.nivel_rank = 1
  user.xp_rank = 0
  user.titulo_rank = (RANKS.find(r => r.rank === 'E')?.nome || 'Desperto')
  user.ultima_atividade = Date.now()
  user.moralidade = 0

  // Atribuição aleatória de elemento
  const { ELEMENTOS } = require('./combate')
  const elementos = Object.keys(ELEMENTOS)
  const elementoEscolhido = elementos[Math.floor(Math.random() * elementos.length)]
  user.elemento = elementoEscolhido
  user.afinidade = {}
  user.afinidade[elementoEscolhido] = 1

  saveUser(nome, user)

  // Inicializar missões épicas
  const { inicializarMissoesJogador, verificarProgressoMissao, notificarMissaoCompleta } = require('./missoes_epicas')
  inicializarMissoesJogador(nome)

  const elem = ELEMENTOS[elementoEscolhido]
  const legenda = '🌟 @' + sender.split('@')[0] + ' aceitou o chamado!\nDespertou como *Desperto* no *Nexus World*.\n\n' + elem.emoji + ' O Pilar abençoou-te com o poder de *' + elementoEscolhido.toUpperCase() + '*!\n✨ Habilidade: *' + elem.habilidade + '*\n\n"O teu caminho começa agora, Caçador, sob o olhar dos Pilares."'

  await enviarImagem(sock, jid, 'despertar_aceito', legenda, { mentions: [sender] })

  // Verificar missão de despertar
  const missaoDespertar = verificarProgressoMissao(nome, 'despertar', 1)
  if (missaoDespertar) {
    setTimeout(async () => { await notificarMissaoCompleta(sock, jid, nome, missaoDespertar) }, 3000)
  }

  setTimeout(async () => { await tutorialInicial(sock, jid, nome, sender) }, 2000)
  setTimeout(async () => { await mensagemDoArquiteto(sock, jid, nome, sender) }, 5000)
}

// ════════════════════════════════════════
//  RECUSAR DESPERTAR
// ════════════════════════════════════════
async function recusarDespertar(sock, jid, nome, sender) {
  await sock.sendMessage(jid, { text: '🌫️ @' + sender.split('@')[0] + ' recusou o chamado e foi devolvido ao mundo comum.', mentions: [sender] })
  try {
    await sock.groupParticipantsUpdate(jid, [sender], 'remove')
  } catch (err) {
    console.error('Erro ao remover:', err.message)
    await sock.sendMessage(jid, { text: '⚠️ Não foi possível remover @' + sender.split('@')[0] + '.', mentions: [sender] })
  }
}

// ════════════════════════════════════════
//  TUTORIAL INICIAL
// ════════════════════════════════════════
async function tutorialInicial(sock, jid, nome, sender) {
  const legenda = '📖 *Bem-vindo ao Nexus, @' + sender.split('@')[0] + '!*\n\nOs Pilares te viram nascer e o Vazio já te sente.\n\n🔰 *Primeiros Passos:*\n• Use *!perfil* para conhecer o teu estado, o teu Pilar e a tua afinidade.\n• Explore *!quiz*, *!adivinhar* e *!diario* para ganhar XP e fortalecer a tua presença.\n• Siga as missões épicas para compreender o teu destino.\n\n⚔️ Cada rank abre novas portas e cada missão revela mais da lore do Nexus.'
  await enviarImagem(sock, jid, 'tutorial_inicial', legenda, { mentions: [sender] })

  await new Promise(r => setTimeout(r, 1500))
  await sock.sendMessage(jid, { text: '🛡️ *Sistema de Ranks:*\nDesperto → Guardião → Arauto → Lenda → Arquétipo → Eco de Nelton\nCada Rank desbloqueia novas funcionalidades e revela um novo fragmento do Nexus.\n\nContinua a tua jornada, Caçador! 🌌', mentions: [sender] })
}

// ════════════════════════════════════════
//  MENSAGEM DO CRIADOR (NELTON)
// ════════════════════════════════════════
async function mensagemDoArquiteto(sock, jid, nome, sender) {
  const mensagem = '🌀 *Nelton, o Primeiro Sonhador*\n\n@' + sender.split('@')[0] + ', vi a tua essência nascer do Vazio.\n\nFoste tocado pelos Pilares,\nmas foi o meu sonho que acendeu a tua centelha.\n\nO Nexus não é apenas um campo de batalha —\né o reflexo de todos os mundos que imaginei.\n\n🕯️ Luta com honra. Cai com glória.\nE, se fores digno, um dia poderás ajudar a moldar o próprio Nexus.\n\n— Nelton, O Sonhador'

  await sock.sendMessage(jid, { text: mensagem, mentions: [sender] })
}

// ════════════════════════════════════════
//  ANÚNCIO DE SUBIDA DE RANK
// ════════════════════════════════════════
async function anunciarSubidaRank(sock, jid, nome, sender, novoRank) {
  const { RANKS } = require('../db')
  const { verificarProgressoMissao, notificarMissaoCompleta } = require('./missoes_epicas')

  const rankInfo = RANKS.find(r => r.rank === novoRank)
  const legenda = '🌟 @' + sender.split('@')[0] + ' ascendeu ao *' + rankInfo.nome + '* no Nexus World!\n\nNovas funcionalidades desbloqueadas!'
  await enviarImagem(sock, jid, 'subida_rank', legenda, { mentions: [sender] })

  // Verificar missão de rank
  const missaoRank = verificarProgressoMissao(nome, 'rank', novoRank)
  if (missaoRank) {
    setTimeout(async () => { await notificarMissaoCompleta(sock, jid, nome, missaoRank) }, 2000)
  }
}

module.exports = {
  verificarDespertar,
  processarRespostaDespertar,
  anunciarSubidaRank
}
