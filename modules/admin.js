const { getUser } = require('../db')
const fs = require('fs')

const ADMIN_STATE_PATH = './data/admin-state.json'

// ─── Persistência ─────────────────────────────────────────────
function carregarAdminState() {
  try {
    if (!fs.existsSync(ADMIN_STATE_PATH)) return { antilinkAtivo: false, boasVindasAtivas: true, palavrasProibidas: [] }
    return JSON.parse(fs.readFileSync(ADMIN_STATE_PATH, 'utf8'))
  } catch {
    return { antilinkAtivo: false, boasVindasAtivas: true, palavrasProibidas: [] }
  }
}

function salvarAdminState() {
  fs.writeFileSync(ADMIN_STATE_PATH, JSON.stringify({ antilinkAtivo, boasVindasAtivas, palavrasProibidas }, null, 2))
}

const state = carregarAdminState()
let antilinkAtivo = state.antilinkAtivo
let boasVindasAtivas = state.boasVindasAtivas
let palavrasProibidas = state.palavrasProibidas

// ════════════════════════════════════════
//  BOAS-VINDAS AUTOMÁTICAS
// ════════════════════════════════════════
async function boasVindasAuto(sock, jid, participants, action) {
  try {
    // O Baileys envia participants como array de objetos { jid }
    const jids = Array.isArray(participants)
      ? participants.map(p => p.jid || p).filter(j => j)
      : typeof participants === 'string'
        ? [participants]
        : []

    for (const participantJid of jids) {
      const nome = participantJid.split('@')[0]
      if (action === 'add') {
        const mensagem = `� Bem-vindo(a) ao Nexus, @${nome}!
O Vazio sentiu o teu despertar e os Pilares te observam.
Agora és mais um Caçador a caminho das guildas, arenas e missões da era.`
        await sock.sendMessage(jid, {
          text: mensagem,
          mentions: [participantJid]
        })
      } else if (action === 'remove') {
        await sock.sendMessage(jid, {
          text: `🌫️ ${nome} afastou-se do círculo do grupo, como um eco perdido no Vazio.`
        })
      }
    }
  } catch (err) {
    console.error('Erro nas boas-vindas:', err.message)
  }
}

// ════════════════════════════════════════
//  ADICIONAR MEMBRO
// ════════════════════════════════════════
async function adicionarMembro(sock, jid, numero, msg) {
  try {
    const formatted = numero.includes('@s.whatsapp.net') ? numero : `${numero}@s.whatsapp.net`
    await sock.groupParticipantsUpdate(jid, [formatted], 'add')
    await sock.sendMessage(jid, { text: `✅ Membro adicionado: @${formatted.split('@')[0]}`, mentions: [formatted] })
  } catch (err) {
    await sock.sendMessage(jid, { text: `❌ Erro ao adicionar: ${err.message}` })
  }
}

// ════════════════════════════════════════
//  REMOVER MEMBRO
// ════════════════════════════════════════
async function removerMembro(sock, jid, numero, msg) {
  try {
    const formatted = numero.includes('@s.whatsapp.net') ? numero : `${numero}@s.whatsapp.net`
    await sock.groupParticipantsUpdate(jid, [formatted], 'remove')
    await sock.sendMessage(jid, { text: `🗑️ Membro removido: @${formatted.split('@')[0]}`, mentions: [formatted] })
  } catch (err) {
    await sock.sendMessage(jid, { text: `❌ Erro ao remover: ${err.message}` })
  }
}

// ════════════════════════════════════════
//  PROMOVER A ADMIN
// ════════════════════════════════════════
async function promoverAdmin(sock, jid, numero, msg) {
  try {
    const formatted = numero.includes('@s.whatsapp.net') ? numero : `${numero}@s.whatsapp.net`
    await sock.groupParticipantsUpdate(jid, [formatted], 'promote')
    await sock.sendMessage(jid, { text: `👑 Promovido a admin: @${formatted.split('@')[0]}`, mentions: [formatted] })
  } catch (err) {
    await sock.sendMessage(jid, { text: `❌ Erro ao promover: ${err.message}` })
  }
}

// ════════════════════════════════════════
//  REBAIXAR ADMIN
// ════════════════════════════════════════
async function rebaixarAdmin(sock, jid, numero, msg) {
  try {
    const formatted = numero.includes('@s.whatsapp.net') ? numero : `${numero}@s.whatsapp.net`
    await sock.groupParticipantsUpdate(jid, [formatted], 'demote')
    await sock.sendMessage(jid, { text: `⬇️ Admin rebaixado: @${formatted.split('@')[0]}`, mentions: [formatted] })
  } catch (err) {
    await sock.sendMessage(jid, { text: `❌ Erro ao rebaixar: ${err.message}` })
  }
}

// ════════════════════════════════════════
//  SILENCIAR GRUPO (apenas admins podem falar)
// ════════════════════════════════════════
async function silenciarGrupo(sock, jid, msg) {
  try {
    await sock.groupSettingUpdate(jid, 'announcement')
    await sock.sendMessage(jid, { text: '🔇 Grupo silenciado. Apenas admins podem enviar mensagens.' })
  } catch (err) {
    await sock.sendMessage(jid, { text: `❌ Erro ao silenciar: ${err.message}` })
  }
}

// ════════════════════════════════════════
//  ABRIR GRUPO (todos podem falar)
// ════════════════════════════════════════
async function abrirGrupo(sock, jid, msg) {
  try {
    await sock.groupSettingUpdate(jid, 'not_announcement')
    await sock.sendMessage(jid, { text: '🔈 Grupo aberto. Todos podem enviar mensagens.' })
  } catch (err) {
    await sock.sendMessage(jid, { text: `❌ Erro ao abrir grupo: ${err.message}` })
  }
}

// ════════════════════════════════════════
//  ANTILINK
// ════════════════════════════════════════

async function toggleAntilink(sock, jid, msg, estado) {
  antilinkAtivo = estado
  salvarAdminState()
  await sock.sendMessage(jid, { text: estado ? '🔗 Antilink ATIVADO. Links serão bloqueados.' : '🔗 Antilink DESATIVADO.' })
}

async function verificarLink(sock, jid, texto, msg) {
  if (!antilinkAtivo) return false
  if (texto.includes('http://') || texto.includes('https://') || texto.includes('wa.me/')) {
    await sock.sendMessage(jid, { text: '⛔ Links não são permitidos neste grupo!', delete: msg.key })
    return true
  }
  return false
}

// ════════════════════════════════════════
//  FILTRO DE PALAVRAS
// ════════════════════════════════════════

async function adicionarPalavra(sock, jid, palavra, msg) {
  palavrasProibidas.push(palavra.toLowerCase())
  salvarAdminState()
  await sock.sendMessage(jid, { text: `🚫 Palavra "${palavra}" adicionada ao filtro.` })
}

async function verificarPalavrao(sock, jid, texto, msg) {
  const temProibida = palavrasProibidas.some(p => texto.includes(p))
  if (temProibida) {
    await sock.sendMessage(jid, { text: '⛔ Mensagem bloqueada por conter palavra proibida.', delete: msg.key })
    return true
  }
  return false
}

// ════════════════════════════════════════
//  ANÚNCIO
// ════════════════════════════════════════
async function anuncio(sock, jid, texto, msg) {
  await sock.sendMessage(jid, {
    text: `📢 *ANÚNCIO*\n\n${texto}`
  })
}

// ════════════════════════════════════════
//  INFORMAÇÕES DO GRUPO
// ════════════════════════════════════════
async function infoGrupo(sock, jid) {
  try {
    const metadata = await sock.groupMetadata(jid)
    const { subject, desc, participants, creation } = metadata
    const admins = participants.filter(p => p.admin).map(p => `• @${p.id.split('@')[0]}`)
    const texto = `📋 *${subject}*\n📝 ${desc || 'Sem descrição'}\n👥 Membros: ${participants.length}\n👑 Admins:\n${admins.join('\n')}\n📅 Criado em: ${new Date(creation * 1000).toLocaleDateString('pt')}`
    await sock.sendMessage(jid, { text: texto, mentions: participants.map(p => p.id) })
  } catch (err) {
    await sock.sendMessage(jid, { text: `❌ Erro ao obter informações: ${err.message}` })
  }
}

// ════════════════════════════════════════
//  CONFIGURAR BOAS-VINDAS
// ════════════════════════════════════════

async function toggleBoasVindas(sock, jid, msg, estado) {
  boasVindasAtivas = estado
  salvarAdminState()
  await sock.sendMessage(jid, { text: estado ? '👋 Boas-vindas ATIVADAS.' : '👋 Boas-vindas DESATIVADAS.' })
}

async function configBoasVindas(sock, jid, texto, msg) {
  // Não está implementado armazenamento dinâmico; mantém a funcionalidade básica
  await sock.sendMessage(jid, { text: '✅ Mensagem de boas-vindas atualizada (funcionalidade em breve).' })
}

// ════════════════════════════════════════
//  MENU ADMIN
// ════════════════════════════════════════
async function menuAdmin(sock, jid, msg) {
  const texto = `👑 *Menu de Administração*\n\n!add <número> - Adiciona membro\n!kick <número> - Remove membro\n!promover <número> - Promove a admin\n!rebaixar <número> - Remove admin\n!silenciar - Silencia o grupo\n!abrir - Abre o grupo\n!antilink on/off - Ativa/desativa bloqueio de links\n!filtro <palavra> - Adiciona palavra proibida\n!anuncio <texto> - Envia anúncio\n!infogrupo - Informações do grupo\n!boasvindas on/off - Ativa/desativa boas-vindas\n!setboasvindas <texto> - Personaliza mensagem`
  await sock.sendMessage(jid, { text: texto })
}

module.exports = {
  boasVindasAuto,
  adicionarMembro,
  removerMembro,
  promoverAdmin,
  rebaixarAdmin,
  silenciarGrupo,
  abrirGrupo,
  toggleAntilink,
  verificarLink,
  adicionarPalavra,
  verificarPalavrao,
  anuncio,
  infoGrupo,
  configBoasVindas,
  toggleBoasVindas,
  menuAdmin
}
