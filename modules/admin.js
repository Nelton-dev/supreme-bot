require('dotenv').config()
const fs = require('fs')
const { getUser, saveUser, todosUsuarios } = require('../db')

const CONFIG_PATH = './data/config.json'

function carregarConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({
      boasVindas: true,
      despedida: true,
      antilink: false,
      antifake: false,
      bemVindoMsg: '👋 Bem-vindo(a) ao grupo, *{nome}*! 🎌\n\nEste é um grupo de anime — usa *!ajuda* para ver os comandos do bot!\n\nEsperamos que te divitas muito! 🔥',
      despedidaMsg: '👋 *{nome}* saiu do grupo. Sayonara! 😢',
      antipalavras: [],
      admins: []
    }, null, 2))
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH))
}

function salvarConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

// ─── VERIFICAR SE É ADMIN ────────────────────────────────────
async function isAdmin(sock, jid, numero) {
  try {
    const meta = await sock.groupMetadata(jid)
    const admins = meta.participants.filter(p => p.admin).map(p => p.id)
    return admins.includes(numero)
  } catch {
    return false
  }
}

function isAdminConfig(numero) {
  const config = carregarConfig()
  return config.admins.includes(numero)
}

async function verificarAdmin(sock, jid, msg) {
  const numero = msg.key.participant || msg.key.remoteJid
  const adminGrupo = await isAdmin(sock, jid, numero)
  const adminConfig = isAdminConfig(numero)
  return adminGrupo || adminConfig
}

// ════════════════════════════════════════
//  BOAS-VINDAS AUTOMÁTICAS
// ════════════════════════════════════════
async function boasVindasAuto(sock, jid, participantes, tipo) {
  const config = carregarConfig()

  // Aguarda 3 segundos para sessão estabilizar
  await new Promise(r => setTimeout(r, 3000))

  for (const p of participantes) {
    const nome = p.split('@')[0]
    try {
      if (tipo === 'add' && config.boasVindas) {
        const msg = config.bemVindoMsg.replace('{nome}', nome)
        await sock.sendMessage(jid, { text: msg })
        const { user } = getUser(nome)
        user.xp = 0; user.nivel = 1; user.pontos = 0
        saveUser(nome, user)
      }
      if (tipo === 'remove' && config.despedida) {
        const msg = config.despedidaMsg.replace('{nome}', nome)
        await sock.sendMessage(jid, { text: msg })
      }
    } catch (err) {
      console.log(`⚠️ Boas-vindas falhou para ${nome}:`, err.message)
    }
  }
}

// ════════════════════════════════════════
//  ADICIONAR / REMOVER MEMBROS
// ════════════════════════════════════════
async function adicionarMembro(sock, jid, numero, msg) {
  if (!await verificarAdmin(sock, jid, msg)) {
    await sock.sendMessage(jid, { text: '❌ Apenas admins podem usar este comando!' })
    return
  }

  numero = numero.replace(/[^0-9]/g, '')
  if (!numero.startsWith('258')) numero = '258' + numero
  const jidMembro = numero + '@s.whatsapp.net'

  try {
    await sock.groupParticipantsUpdate(jid, [jidMembro], 'add')
    await sock.sendMessage(jid, { text: `✅ *+${numero}* adicionado ao grupo!` })
  } catch (err) {
    await sock.sendMessage(jid, { text: `❌ Não foi possível adicionar *+${numero}*.\nVerifica se o número está correto.` })
  }
}

async function removerMembro(sock, jid, numero, msg) {
  if (!await verificarAdmin(sock, jid, msg)) {
    await sock.sendMessage(jid, { text: '❌ Apenas admins podem usar este comando!' })
    return
  }

  numero = numero.replace(/[^0-9]/g, '')
  if (!numero.startsWith('258')) numero = '258' + numero
  const jidMembro = numero + '@s.whatsapp.net'

  try {
    await sock.groupParticipantsUpdate(jid, [jidMembro], 'remove')
    await sock.sendMessage(jid, { text: `✅ *+${numero}* removido do grupo.` })
  } catch (err) {
    await sock.sendMessage(jid, { text: `❌ Não foi possível remover *+${numero}*.` })
  }
}

// ════════════════════════════════════════
//  PROMOVER / REBAIXAR ADMIN
// ════════════════════════════════════════
async function promoverAdmin(sock, jid, numero, msg) {
  if (!await verificarAdmin(sock, jid, msg)) {
    await sock.sendMessage(jid, { text: '❌ Apenas admins podem usar este comando!' })
    return
  }

  numero = numero.replace(/[^0-9]/g, '')
  if (!numero.startsWith('258')) numero = '258' + numero

  try {
    await sock.groupParticipantsUpdate(jid, [numero + '@s.whatsapp.net'], 'promote')
    await sock.sendMessage(jid, { text: `👑 *+${numero}* foi promovido a admin!` })
  } catch {
    await sock.sendMessage(jid, { text: '❌ Erro ao promover!' })
  }
}

async function rebaixarAdmin(sock, jid, numero, msg) {
  if (!await verificarAdmin(sock, jid, msg)) {
    await sock.sendMessage(jid, { text: '❌ Apenas admins podem usar este comando!' })
    return
  }

  numero = numero.replace(/[^0-9]/g, '')
  if (!numero.startsWith('258')) numero = '258' + numero

  try {
    await sock.groupParticipantsUpdate(jid, [numero + '@s.whatsapp.net'], 'demote')
    await sock.sendMessage(jid, { text: `⬇️ *+${numero}* foi rebaixado de admin.` })
  } catch {
    await sock.sendMessage(jid, { text: '❌ Erro ao rebaixar!' })
  }
}

// ════════════════════════════════════════
//  SILENCIAR / ABRIR GRUPO
// ════════════════════════════════════════
async function silenciarGrupo(sock, jid, msg) {
  if (!await verificarAdmin(sock, jid, msg)) {
    await sock.sendMessage(jid, { text: '❌ Apenas admins!' })
    return
  }
  try {
    await sock.groupSettingUpdate(jid, 'announcement')
    await sock.sendMessage(jid, { text: '🔇 Grupo silenciado! Só admins podem enviar mensagens.' })
  } catch {
    await sock.sendMessage(jid, { text: '❌ Erro ao silenciar grupo!' })
  }
}

async function abrirGrupo(sock, jid, msg) {
  if (!await verificarAdmin(sock, jid, msg)) {
    await sock.sendMessage(jid, { text: '❌ Apenas admins!' })
    return
  }
  try {
    await sock.groupSettingUpdate(jid, 'not_announcement')
    await sock.sendMessage(jid, { text: '🔊 Grupo aberto! Todos podem enviar mensagens.' })
  } catch {
    await sock.sendMessage(jid, { text: '❌ Erro ao abrir grupo!' })
  }
}

// ════════════════════════════════════════
//  ANTI-LINK
// ════════════════════════════════════════
async function toggleAntilink(sock, jid, msg, ativar) {
  if (!await verificarAdmin(sock, jid, msg)) {
    await sock.sendMessage(jid, { text: '❌ Apenas admins!' })
    return
  }
  const config = carregarConfig()
  config.antilink = ativar
  salvarConfig(config)
  await sock.sendMessage(jid, {
    text: ativar
      ? '🔒 *Anti-link ativado!* Links serão deletados automaticamente.'
      : '🔓 *Anti-link desativado.*'
  })
}

async function verificarLink(sock, jid, msg, texto, numero) {
  const config = carregarConfig()
  if (!config.antilink) return false

  const temLink = /https?:\/\/|wa\.me|chat\.whatsapp\.com/i.test(texto)
  if (!temLink) return false

  const admin = await isAdmin(sock, jid, numero)
  if (admin) return false // Admins podem enviar links

  try {
    await sock.sendMessage(jid, { text: `⚠️ Links não são permitidos neste grupo!` })
    // Apaga a mensagem
    await sock.sendMessage(jid, { delete: msg.key })
  } catch {}

  return true
}

// ════════════════════════════════════════
//  ANTI-PALAVRÃO
// ════════════════════════════════════════
async function adicionarPalavra(sock, jid, palavra, msg) {
  if (!await verificarAdmin(sock, jid, msg)) {
    await sock.sendMessage(jid, { text: '❌ Apenas admins!' })
    return
  }
  const config = carregarConfig()
  if (!config.antipalavras.includes(palavra)) config.antipalavras.push(palavra)
  salvarConfig(config)
  await sock.sendMessage(jid, { text: `✅ Palavra "*${palavra}*" adicionada ao filtro!` })
}

async function verificarPalavrao(sock, jid, msg, texto) {
  const config = carregarConfig()
  const encontrou = config.antipalavras.some(p => texto.includes(p.toLowerCase()))
  if (!encontrou) return false

  try {
    await sock.sendMessage(jid, { text: '⚠️ Mensagem removida por conter palavras proibidas!' })
    await sock.sendMessage(jid, { delete: msg.key })
  } catch {}

  return true
}

// ════════════════════════════════════════
//  ANÚNCIO PARA O GRUPO
// ════════════════════════════════════════
async function anuncio(sock, jid, texto, msg) {
  if (!await verificarAdmin(sock, jid, msg)) {
    await sock.sendMessage(jid, { text: '❌ Apenas admins!' })
    return
  }

  await sock.sendMessage(jid, {
    text: `📢 *ANÚNCIO DO ADMIN*\n\n${texto}\n\n━━━━━━━━━━━━━━━`
  })
}

// ════════════════════════════════════════
//  INFO DO GRUPO
// ════════════════════════════════════════
async function infoGrupo(sock, jid) {
  try {
    const meta = await sock.groupMetadata(jid)
    const admins = meta.participants.filter(p => p.admin).length
    const total = meta.participants.length
    const criado = new Date(meta.creation * 1000).toLocaleDateString('pt')

    await sock.sendMessage(jid, {
      text: `📊 *INFO DO GRUPO*\n\n📛 Nome: ${meta.subject}\n👥 Membros: ${total}\n👑 Admins: ${admins}\n📅 Criado: ${criado}\n🆔 JID: ${jid}`
    })
  } catch {
    await sock.sendMessage(jid, { text: '❌ Erro ao obter info do grupo!' })
  }
}

// ════════════════════════════════════════
//  CONFIGURAR BOAS-VINDAS
// ════════════════════════════════════════
async function configBoasVindas(sock, jid, novaMsg, msg) {
  if (!await verificarAdmin(sock, jid, msg)) {
    await sock.sendMessage(jid, { text: '❌ Apenas admins!' })
    return
  }
  const config = carregarConfig()
  config.bemVindoMsg = novaMsg
  salvarConfig(config)
  await sock.sendMessage(jid, {
    text: `✅ Mensagem de boas-vindas atualizada!\n\nPreview:\n${novaMsg.replace('{nome}', 'NovoMembro')}`
  })
}

async function toggleBoasVindas(sock, jid, msg, ativar) {
  if (!await verificarAdmin(sock, jid, msg)) {
    await sock.sendMessage(jid, { text: '❌ Apenas admins!' })
    return
  }
  const config = carregarConfig()
  config.boasVindas = ativar
  salvarConfig(config)
  await sock.sendMessage(jid, {
    text: ativar ? '👋 Boas-vindas ativadas!' : '👋 Boas-vindas desativadas.'
  })
}

// ════════════════════════════════════════
//  MENU ADMIN
// ════════════════════════════════════════
async function menuAdmin(sock, jid, msg) {
  if (!await verificarAdmin(sock, jid, msg)) {
    await sock.sendMessage(jid, { text: '❌ Apenas admins têm acesso!' })
    return
  }
  const config = carregarConfig()
  await sock.sendMessage(jid, {
    text: `👑 *MENU ADMIN*\n\n👥 *Membros*\n!add 84xxxxxxx — Adicionar membro\n!kick 84xxxxxxx — Remover membro\n!promover 84xxxxxxx — Tornar admin\n!rebaixar 84xxxxxxx — Remover admin\n\n📢 *Grupo*\n!anuncio <texto> — Anúncio oficial\n!silenciar — Só admins falam\n!abrir — Todos podem falar\n!infogrupo — Info do grupo\n\n🛡️ *Moderação*\n!antilink on/off — Bloquear links\n!filtro <palavra> — Adicionar palavra proibida\n\n👋 *Boas-vindas*\n!boasvindas on/off — Ativar/desativar\n!setboasvindas <msg> — Personalizar msg\n  Use {nome} para o nome do membro\n\n📊 *Status atual*\n👋 Boas-vindas: ${config.boasVindas ? '✅' : '❌'}\n🔒 Anti-link: ${config.antilink ? '✅' : '❌'}`
  })
}

module.exports = {
  boasVindasAuto,
  adicionarMembro, removerMembro,
  promoverAdmin, rebaixarAdmin,
  silenciarGrupo, abrirGrupo,
  toggleAntilink, verificarLink,
  adicionarPalavra, verificarPalavrao,
  anuncio, infoGrupo,
  configBoasVindas, toggleBoasVindas,
  menuAdmin, verificarAdmin
}
