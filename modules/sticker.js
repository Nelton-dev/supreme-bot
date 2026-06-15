const axios = require('axios')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Verifica se ffmpeg está instalado
function ffmpegDisponivel() {
  try { execSync('ffmpeg -version', { stdio: 'ignore' }); return true }
  catch { return false }
}

// ─── CONVERTER IMAGEM EM STICKER ─────────────────────────────
async function imagemParaSticker(sock, jid, msg) {
  const tipoMensagem = Object.keys(msg.message || {})[0]
  const temImagem = tipoMensagem === 'imageMessage'
  const temSticker = tipoMensagem === 'stickerMessage'

  if (!temImagem && !temSticker) {
    await sock.sendMessage(jid, { text: '📸 Envia uma imagem com a legenda *!sticker* para converter!' })
    return
  }

  await sock.sendMessage(jid, { text: '🎭 Convertendo para sticker...' })

  try {
    const stream = await sock.downloadMediaMessage(msg)
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const buffer = Buffer.concat(chunks)

    await sock.sendMessage(jid, {
      sticker: buffer
    })
  } catch (err) {
    console.error('Sticker erro:', err.message)
    await sock.sendMessage(jid, { text: '❌ Erro ao criar sticker. A imagem é válida?' })
  }
}

// ─── STICKER DE REAÇÃO ALEATÓRIO ─────────────────────────────
const reacoesAnime = {
  feliz: [
    'https://media.giphy.com/media/JpCal8XTXT3MepYwkS/giphy.gif',
    'https://media.giphy.com/media/Cmr1OMJ2FN0B2/giphy.gif',
  ],
  triste: [
    'https://media.giphy.com/media/TbYgHMnICI1A4/giphy.gif',
    'https://media.giphy.com/media/zTIRMlJqS4BIc/giphy.gif',
  ],
  bravo: [
    'https://media.giphy.com/media/bGm9FaFMtJvNC/giphy.gif',
    'https://media.giphy.com/media/u1kLBBCdJprmo/giphy.gif',
  ],
  surpreso: [
    'https://media.giphy.com/media/3oKHWikxKFJhjArSvS/giphy.gif',
    'https://media.giphy.com/media/8vQSQ3cNXuDGo/giphy.gif',
  ],
  danca: [
    'https://media.giphy.com/media/CkuKuzTXuZDSo/giphy.gif',
    'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif',
  ]
}

async function stickerReacao(sock, jid, emocao) {
  const lista = reacoesAnime[emocao]
  if (!lista) {
    const disponiveis = Object.keys(reacoesAnime).join(', ')
    await sock.sendMessage(jid, {
      text: `🎭 Reações disponíveis:\n${disponiveis}\n\nEx: !reacao feliz`
    })
    return
  }

  const url = lista[Math.floor(Math.random() * lista.length)]

  try {
    await sock.sendMessage(jid, { text: '🎭 Buscando sticker...' })
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 })
    const buffer = Buffer.from(res.data)

    // Envia como GIF animado
    await sock.sendMessage(jid, {
      video: buffer,
      gifPlayback: true,
      caption: `${emocao} 🎌`
    })
  } catch (err) {
    console.error('Reação erro:', err.message)
    await sock.sendMessage(jid, { text: `❌ Erro ao buscar reação. Tenta: !reacao ${emocao}` })
  }
}

// ─── STICKER DE TEXTO (ASCII arte) ───────────────────────────
async function stickerTexto(sock, jid, texto) {
  const emojis = {
    'gg': '🏆 GG EZ!',
    'oof': '😵 OOF!',
    'rip': '💀 F no chat',
    'uwu': '🥺 UwU~',
    'owo': '👀 OwO?!',
    'nani': '😱 NANI?!',
    'sugoi': '✨ SUGOI!',
    'yosh': '💪 YOSH!',
    'nakama': '❤️ Nakama!',
    'plus ultra': '🔥 PLUS ULTRA!!',
    'dattebayo': '🍜 Dattebayo!',
  }

  const resposta = emojis[texto.toLowerCase()] || `💬 ${texto}`
  await sock.sendMessage(jid, { text: resposta })
}

// ─── AUTO STICKER POR PALAVRA-CHAVE ──────────────────────────
const gatilhos = {
  'nani': '😱 *NANI?!*',
  'sugoi': '✨ *SUGOI desuu~*',
  'kawaii': '🥺 *Kawaii~* uwu',
  'baka': '😤 *BAKA!* 💢',
  'senpai': '😳 *S-senpai...!*',
  'nakama': '❤️ *Nakama para sempre!*',
  'plus ultra': '🔥 *PLUS ULTRA!!* 💥',
  'dattebayo': '🍜 *Dattebayo!* 🌀',
  'omae wa': '💀 *Omae wa mou shindeiru...*\n*NANI?!*',
  'believe it': '🍜 *Believe it! Dattebayo!*',
}

function verificarGatilho(texto) {
  for (const [palavra, resposta] of Object.entries(gatilhos)) {
    if (texto.includes(palavra)) return resposta
  }
  return null
}

module.exports = { imagemParaSticker, stickerReacao, stickerTexto, verificarGatilho }