const fs = require('fs')
const { getUser, saveUser } = require('../db')

const SOCIAL_PATH = './data/social.json'

function carregarSocial() {
  if (!fs.existsSync(SOCIAL_PATH)) fs.writeFileSync(SOCIAL_PATH, JSON.stringify({ clans: {}, casamentos: {}, missoes: {} }, null, 2))
  return JSON.parse(fs.readFileSync(SOCIAL_PATH))
}

function salvarSocial(data) {
  fs.writeFileSync(SOCIAL_PATH, JSON.stringify(data, null, 2))
}

// ════════════════════════════════════════
//  CLÃS
// ════════════════════════════════════════

const EMBLEMAS = ['🔥','⚡','🌊','🌪️','❄️','🌸','💀','👁️','🐉','⚔️']

async function criarCla(sock, jid, nome, nomeCla) {
  const social = carregarSocial()
  const user = getUser(nome)

  // Verifica se já está em clã
  const claAtual = Object.entries(social.clans).find(([, c]) => c.membros.includes(nome))
  if (claAtual) {
    await sock.sendMessage(jid, { text: `⚠️ *${nome}*, já pertences ao clã *${claAtual[1].nome}*!\nSai primeiro com *!sair-cla*` })
    return
  }

  if (social.clans[nomeCla]) {
    await sock.sendMessage(jid, { text: `❌ Já existe um clã com o nome *${nomeCla}*!` })
    return
  }

  if (user.pontos < 100) {
    await sock.sendMessage(jid, { text: `❌ Precisas de *100 pontos* para criar um clã!\nTens: ${user.pontos} pontos.` })
    return
  }

  user.pontos -= 100
  saveUser(nome, user)

  const emblema = EMBLEMAS[Math.floor(Math.random() * EMBLEMAS.length)]
  social.clans[nomeCla] = {
    nome: nomeCla,
    emblema,
    lider: nome,
    membros: [nome],
    xp: 0,
    nivel: 1,
    criado: new Date().toLocaleDateString('pt')
  }
  salvarSocial(social)

  await sock.sendMessage(jid, {
    text: `${emblema} *CLÃ CRIADO!*\n\n🏰 Nome: *${nomeCla}*\n👑 Líder: ${nome}\n📅 Criado em: ${social.clans[nomeCla].criado}\n\n💡 Outros membros podem entrar com:\n*!entrar-cla ${nomeCla}*`
  })
}

async function entrarCla(sock, jid, nome, nomeCla) {
  const social = carregarSocial()

  const claAtual = Object.entries(social.clans).find(([, c]) => c.membros.includes(nome))
  if (claAtual) {
    await sock.sendMessage(jid, { text: `⚠️ Já pertences ao clã *${claAtual[1].nome}*! Sai com *!sair-cla*` })
    return
  }

  if (!social.clans[nomeCla]) {
    await sock.sendMessage(jid, { text: `❌ Clã *${nomeCla}* não encontrado! Usa *!clans* para ver os clãs.` })
    return
  }

  social.clans[nomeCla].membros.push(nome)
  salvarSocial(social)

  const c = social.clans[nomeCla]
  await sock.sendMessage(jid, {
    text: `${c.emblema} *${nome}* entrou no clã *${nomeCla}*!\n👥 Membros: ${c.membros.length}`
  })
}

async function sairCla(sock, jid, nome) {
  const social = carregarSocial()
  const entrada = Object.entries(social.clans).find(([, c]) => c.membros.includes(nome))

  if (!entrada) {
    await sock.sendMessage(jid, { text: `⚠️ *${nome}*, não pertences a nenhum clã!` })
    return
  }

  const [nomeCla, cla] = entrada

  if (cla.lider === nome && cla.membros.length > 1) {
    await sock.sendMessage(jid, { text: `👑 És o líder! Passa a liderança primeiro com *!passar-lider <nome>*` })
    return
  }

  cla.membros = cla.membros.filter(m => m !== nome)

  if (cla.membros.length === 0) {
    delete social.clans[nomeCla]
    await sock.sendMessage(jid, { text: `🏚️ Clã *${nomeCla}* dissolvido por falta de membros.` })
  } else {
    if (cla.lider === nome) cla.lider = cla.membros[0]
    salvarSocial(social)
    await sock.sendMessage(jid, { text: `👋 *${nome}* saiu do clã *${nomeCla}*.` })
  }

  salvarSocial(social)
}

async function verClans(sock, jid) {
  const social = carregarSocial()
  const clans = Object.values(social.clans)

  if (!clans.length) {
    await sock.sendMessage(jid, { text: '🏚️ Nenhum clã criado ainda!\nCria o teu com *!criar-cla <nome>* (custa 100 pontos)' })
    return
  }

  const sorted = clans.sort((a, b) => b.xp - a.xp)
  let txt = '⚔️ *CLÃS DO GRUPO* ⚔️\n\n'
  sorted.forEach((c, i) => {
    txt += `${i + 1}. ${c.emblema} *${c.nome}*\n   👑 ${c.lider} | 👥 ${c.membros.length} membros | ⭐ ${c.xp} XP\n\n`
  })
  txt += '💡 *!cla <nome>* para ver detalhes'
  await sock.sendMessage(jid, { text: txt })
}

async function verCla(sock, jid, nomeCla) {
  const social = carregarSocial()

  const cla = social.clans[nomeCla]
  if (!cla) {
    await sock.sendMessage(jid, { text: `❌ Clã *${nomeCla}* não encontrado!` })
    return
  }

  await sock.sendMessage(jid, {
    text: `${cla.emblema} *CLÃ ${cla.nome.toUpperCase()}*\n\n👑 Líder: ${cla.lider}\n👥 Membros (${cla.membros.length}):\n${cla.membros.map(m => `  • ${m}`).join('\n')}\n⭐ XP do Clã: ${cla.xp}\n🏅 Nível: ${cla.nivel}\n📅 Criado: ${cla.criado}`
  })
}

// ════════════════════════════════════════
//  ELEGER REPRESENTANTE DO CLÃ
// ════════════════════════════════════════
async function elegerRepresentante(sock, jid, nome, alvo) {
  const social = carregarSocial()

  // Descobre o clã a que o remetente pertence
  const entrada = Object.entries(social.clans).find(([, c]) => c.membros.includes(nome))
  if (!entrada) {
    await sock.sendMessage(jid, { text: '❌ Não pertences a nenhum clã!' })
    return
  }

  const [clanId, clan] = entrada

  // Verifica se o alvo está no mesmo clã
  if (!clan.membros.includes(alvo)) {
    await sock.sendMessage(jid, { text: '❌ Esse membro não está no teu clã!' })
    return
  }

  // Define o representante
  clan.representante = alvo
  salvarSocial(social)

  await sock.sendMessage(jid, { text: `✅ *${alvo}* é agora o representante do clã *${clan.nome}* para os torneios!` })
}

// ════════════════════════════════════════
//  CASAMENTO
// ════════════════════════════════════════

async function propor(sock, jid, nome, alvo) {
  const social = carregarSocial()

  if (nome === alvo) {
    await sock.sendMessage(jid, { text: '😅 Não podes casar contigo mesmo!' })
    return
  }

  if (social.casamentos[nome] || social.casamentos[alvo]) {
    const parceiro = social.casamentos[nome] || social.casamentos[alvo]
    await sock.sendMessage(jid, { text: `💔 Um de vocês já é casado! Use *!divorcio* primeiro.` })
    return
  }

  social.casamentos[`proposta_${nome}`] = alvo
  salvarSocial(social)

  await sock.sendMessage(jid, {
    text: `💍 *${nome}* propôs casamento a *${alvo}*!\n\n*${alvo}*, aceitas? Responde:\n✅ *!aceitar-casamento*\n❌ *!recusar-casamento*`
  })
}

async function aceitarCasamento(sock, jid, nome) {
  const social = carregarSocial()
  const proponente = Object.entries(social.casamentos).find(([k, v]) => k.startsWith('proposta_') && v === nome)

  if (!proponente) {
    await sock.sendMessage(jid, { text: `💔 Nenhuma proposta pendente para *${nome}*!` })
    return
  }

  const nomeProp = proponente[0].replace('proposta_', '')
  delete social.casamentos[proponente[0]]
  social.casamentos[nome] = nomeProp
  social.casamentos[nomeProp] = nome
  salvarSocial(social)

  // Bónus de XP para os dois
  const u1 = getUser(nome)
  const u2 = getUser(nomeProp)
  u1.xp += 30; u2.xp += 30
  saveUser(nome, u1); saveUser(nomeProp, u2)

  await sock.sendMessage(jid, {
    text: `💒 *CASAMENTO CONFIRMADO!* 💒\n\n💑 *${nomeProp}* & *${nome}*\n\n🎉 Parabéns ao casal!\n+30 XP para cada um 🥂`
  })
}

async function recusarCasamento(sock, jid, nome) {
  const social = carregarSocial()
  const proponente = Object.entries(social.casamentos).find(([k, v]) => k.startsWith('proposta_') && v === nome)

  if (!proponente) return

  const nomeProp = proponente[0].replace('proposta_', '')
  delete social.casamentos[proponente[0]]
  salvarSocial(social)

  await sock.sendMessage(jid, { text: `💔 *${nome}* recusou a proposta de *${nomeProp}*. Que pena! 😢` })
}

async function divorcio(sock, jid, nome) {
  const social = carregarSocial()
  const parceiro = social.casamentos[nome]

  if (!parceiro) {
    await sock.sendMessage(jid, { text: `💔 *${nome}*, não és casado(a)!` })
    return
  }

  delete social.casamentos[nome]
  delete social.casamentos[parceiro]
  salvarSocial(social)

  await sock.sendMessage(jid, { text: `💔 *${nome}* e *${parceiro}* divorciaram-se. Fim de uma era... 😢` })
}

async function verCasal(sock, jid, nome) {
  const social = carregarSocial()
  const parceiro = social.casamentos[nome]

  if (!parceiro) {
    await sock.sendMessage(jid, { text: `💔 *${nome}*, não és casado(a)!\nUsa *!propor <nome>* para pedir em casamento.` })
    return
  }

  await sock.sendMessage(jid, { text: `💑 *${nome}* é casado(a) com *${parceiro}* 💍` })
}

// ════════════════════════════════════════
//  MISSÕES
// ════════════════════════════════════════

const MISSOES = [
  { id: 'quiz5', nome: '🎯 Mestre do Quiz', desc: 'Acerta 5 perguntas do !quiz', xp: 80, pontos: 60, meta: 5, tipo: 'quiz' },
  { id: 'batalha3', nome: '⚔️ Guerreiro', desc: 'Vence 3 batalhas', xp: 100, pontos: 80, meta: 3, tipo: 'batalha' },
  { id: 'diario3', nome: '🌟 Dedicado', desc: 'Completa o desafio diário 3 dias seguidos', xp: 90, pontos: 70, meta: 3, tipo: 'diario' },
  { id: 'adivinhar3', nome: '🕵️ Detetive', desc: 'Adivinha 3 personagens', xp: 70, pontos: 50, meta: 3, tipo: 'adivinhar' },
  { id: 'torneio1', nome: '🏆 Campeão', desc: 'Vence 1 torneio', xp: 150, pontos: 120, meta: 1, tipo: 'torneio' },
]

function getMissoesUsuario(nome) {
  const social = carregarSocial()
  if (!social.missoes[nome]) {
    social.missoes[nome] = {}
    MISSOES.forEach(m => {
      social.missoes[nome][m.id] = { progresso: 0, completa: false }
    })
    salvarSocial(social)
  }
  return social.missoes[nome]
}

async function verMissoes(sock, jid, nome) {
  const missoes = getMissoesUsuario(nome)
  const social = carregarSocial()

  let txt = `📋 *MISSÕES DE ${nome.toUpperCase()}*\n\n`
  MISSOES.forEach(m => {
    const prog = social.missoes[nome][m.id]
    const status = prog.completa ? '✅' : `${prog.progresso}/${m.meta}`
    txt += `${prog.completa ? '✅' : '🔄'} *${m.nome}*\n   ${m.desc}\n   Progresso: ${status} | +${m.xp} XP | +${m.pontos} pts\n\n`
  })

  await sock.sendMessage(jid, { text: txt })
}

function atualizarMissao(nome, tipo) {
  const social = carregarSocial()
  if (!social.missoes[nome]) getMissoesUsuario(nome)

  MISSOES.filter(m => m.tipo === tipo).forEach(m => {
    const prog = social.missoes[nome][m.id]
    if (prog.completa) return
    prog.progresso++
    if (prog.progresso >= m.meta) {
      prog.completa = true
      // Dar recompensa
      const user = getUser(nome)
      user.xp += m.xp
      user.pontos += m.pontos
      saveUser(nome, user)
      // Notificar (retorna info para o handler enviar)
      social._notificacao = { nome, missao: m }
    }
  })

  salvarSocial(social)

  // Retorna notificação se houver
  const notif = social._notificacao
  if (notif) {
    delete social._notificacao
    salvarSocial(social)
    return notif
  }
  return null
}

module.exports = {
  criarCla,
  entrarCla,
  sairCla,
  verClans,
  verCla,
  propor,
  aceitarCasamento,
  recusarCasamento,
  divorcio,
  verCasal,
  verMissoes,
  atualizarMissao,
  elegerRepresentante   // <-- NOVA
}
