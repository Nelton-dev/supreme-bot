const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { createCanvas } = require('@napi-rs/canvas')
const { getUser, saveUser } = require('../db')

// Pasta onde estão as tuas imagens estáticas
const ASSETS_DIR = path.join(__dirname, '..', 'assets')

// ════════════════════════════════════════
//  GERADOR DE IMAGEM (Pollinations – só perfil)
// ════════════════════════════════════════
async function gerarImagemPollinations(prompt, largura = 512, altura = 512) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${largura}&height=${altura}&nologo=true&enhance=true`
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const buf = Buffer.from(res.data)
    return buf.length > 5000 ? buf : null
  } catch { return null }
}

// ════════════════════════════════════════
//  PLACEHOLDER SIMPLES (canvas) – quando não existe imagem estática
// ════════════════════════════════════════
function gerarPlaceholder(emoji, largura = 500, altura = 250) {
  const canvas = createCanvas(largura, altura)
  const ctx = canvas.getContext('2d')

  // Fundo gradiente escuro
  const grad = ctx.createLinearGradient(0, 0, largura, altura)
  grad.addColorStop(0, '#1a1a2e')
  grad.addColorStop(1, '#16213e')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, largura, altura)

  // Emoji grande no centro
  ctx.font = `${Math.min(largura, altura) * 0.4}px "Sans"`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, largura / 2, altura / 2)

  return canvas.toBuffer('image/png')
}

// ════════════════════════════════════════
//  CARREGADOR DE IMAGEM (tenta .png, depois .jpg, senão placeholder)
// ════════════════════════════════════════
function carregarImagem(nomeBase, placeholderEmoji = '🖼️', largura = 500, altura = 250) {
  const extensoes = ['.png', '.jpg', '.jpeg']

  for (const ext of extensoes) {
    const filePath = path.join(ASSETS_DIR, nomeBase + ext)
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath)
      }
    } catch (err) {
      // ignora e tenta a próxima extensão
    }
  }

  console.log(`Imagem '${nomeBase}' não encontrada (tentei .png e .jpg), usando placeholder.`)
  return gerarPlaceholder(placeholderEmoji, largura, altura)
}

// ════════════════════════════════════════
//  HELPER DE ENVIO (garante buffer válido)
// ════════════════════════════════════════
async function enviarImagem(sock, jid, imagem, caption) {
  // Se for um nome de ficheiro (string), carrega com fallback de extensão
  if (typeof imagem === 'string') {
    imagem = carregarImagem(imagem)
  }

  if (Buffer.isBuffer(imagem) && imagem.length > 500) {
    await sock.sendMessage(jid, { image: imagem, caption })
  } else {
    await sock.sendMessage(jid, { text: caption })
  }
}

// ════════════════════════════════════════
//  BUSCAR IMAGEM DE PERSONAGEM (AniList)
// ════════════════════════════════════════
async function buscarImagemPersonagem(nome) {
  const query = `query ($search: String) { Character(search: $search) { name { full } image { large } } }`
  try {
    const res = await axios.post('https://graphql.anilist.co', { query, variables: { search: nome } })
    const imgUrl = res.data?.data?.Character?.image?.large
    if (!imgUrl) return null
    const img = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 15000 })
    return Buffer.from(img.data)
  } catch { return null }
}

// ════════════════════════════════════════
//  CARD DE PERFIL (avatar via Pollinations)
// ════════════════════════════════════════
async function enviarCardPerfil(sock, jid, nome, user) {
  let avatarBuffer = user.avatar
  if (!avatarBuffer) {
    const prompt = `portrait of original anime character named ${nome}, ${user.titulo || 'novato'}, unique design, detailed face, vibrant colors, high quality`
    avatarBuffer = await gerarImagemPollinations(prompt, 512, 512)
    if (avatarBuffer) {
      user.avatar = avatarBuffer
      saveUser(nome, user)
    }
  }

  const caption = `👤 *${nome}*\n🏅 ${user.titulo || 'Novato'}\n⭐ Nv ${user.nivel || 1} (${user.xp || 0} XP)\n💰 ${user.pontos || 0} pts\n⚔️ ${user.ataque || 10} atk\n❤️ ${user.vida || 100} vida\n🏆 ${user.vitorias || 0} vitórias\n⚡ ${user.habilidade_ativa || 'Nenhuma'}\n🐾 ${user.pet_ativo || 'Nenhum'}`

  await enviarImagem(sock, jid, avatarBuffer, caption)
}

// ════════════════════════════════════════
//  BANNER DO TORNEIO (imagem estática, varia conforme o tempo)
// ════════════════════════════════════════
async function enviarBannerTorneio(sock, jid, { inscritos = 0, tempo = 90, titulo = 'TORNEIO DE ANIME' } = {}) {
  let nomeBase
  if (tempo === 90) {
    nomeBase = 'inscricoes_abertas'
  } else if (tempo === 45) {
    nomeBase = 'ultima_chance'
  } else if (tempo === 0) {
    nomeBase = 'inscricoes_encerradas'
  } else {
    nomeBase = 'banner_torneio'
  }

  const caption = `🏆 *${titulo}*\n⏱️ ${tempo > 0 ? `${tempo}s restantes` : 'Encerradas'}\n👥 Inscritos: ${inscritos}\n\n${tempo > 0 ? 'Usa *!inscrever* e *!apostar*' : 'A preparar as batalhas...'}\n🏅 +150 XP • +120 pts • Título • Habilidade secreta`

  await enviarImagem(sock, jid, nomeBase, caption)
}

// ════════════════════════════════════════
//  RANKING (imagem estática)
// ════════════════════════════════════════
async function enviarRankingComImagem(sock, jid, sorted, top3) {
  const caption = `🏆 *RANKING*\n\n${sorted.slice(0, 10).map(([n, d], i) => `${i < 3 ? ['🥇','🥈','🥉'][i] : `${i+1}.`} *${n}* — Nv ${d.nivel} | ${d.xp} XP`).join('\n')}`
  await enviarImagem(sock, jid, 'ranking', caption)
}

// ════════════════════════════════════════
//  BOAS-VINDAS (imagem estática)
// ════════════════════════════════════════
async function enviarBoasVindasComImagem(sock, jid, nome, mensagem) {
  await enviarImagem(sock, jid, 'boasvindas', mensagem)
}

// ════════════════════════════════════════
//  WAIFU (imagem real ou fallback estático)
// ════════════════════════════════════════
async function enviarWaifuComImagem(sock, jid, waifu, husbando) {
  const caption = `💖 *Waifu:* ${waifu.nome}\n📺 ${waifu.anime}\n💬 "${waifu.descricao}"\n\n💪 *Husbando:* ${husbando.nome}\n📺 ${husbando.anime}\n💬 "${husbando.descricao}"`

  let img = await buscarImagemPersonagem(waifu.nome)
  if (!img) {
    img = 'waifu_fallback'
  }
  await enviarImagem(sock, jid, img, caption)
}

// ════════════════════════════════════════
//  VITÓRIA NO TORNEIO (imagem estática)
// ════════════════════════════════════════
async function enviarVitoriaTorneio(sock, jid, campeao) {
  const txt = `🎉 *TORNEIO ENCERRADO!*\n👑 *${campeao}*\n+150 XP | +120 pts\n🏆 Título | 🔱 Modo Seis Caminhos`
  await enviarImagem(sock, jid, 'vitoria_torneio', txt)
}

// ════════════════════════════════════════
//  LEVEL UP (imagem estática)
// ════════════════════════════════════════
async function enviarLevelUp(sock, jid, nome, novoNivel, novoTitulo) {
  const txt = `🆙 *${nome}* subiu para nível *${novoNivel}*!\n🏅 ${novoTitulo}`
  await enviarImagem(sock, jid, 'levelup', txt)
}

// ════════════════════════════════════════
//  VITÓRIA EM BATALHA (imagem estática ou placeholder)
// ════════════════════════════════════════
async function enviarVitoriaBatalha(sock, jid, vencedor, perdedor) {
  const txt = `🏆 *${vencedor}* venceu a batalha!\n💀 *${perdedor}* foi derrotado\n+50 XP | +30 pts`
  await enviarImagem(sock, jid, 'vitoria_batalha', txt)
}

module.exports = {
  enviarCardPerfil,
  enviarRankingComImagem,
  enviarBoasVindasComImagem,
  enviarWaifuComImagem,
  enviarVitoriaTorneio,
  enviarLevelUp,
  enviarVitoriaBatalha,
  buscarImagemPersonagem,
  buscarImagemAnime: buscarImagemPersonagem,
  enviarBannerTorneio
}
