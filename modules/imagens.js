const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { createCanvas } = require('@napi-rs/canvas')
const { execSync } = require('child_process')
const { getUser, saveUser } = require('../db')

const ASSETS_DIR = path.join(__dirname, '..', 'assets')

async function gerarImagemPollinations(prompt, largura, altura) {
  if (!largura) largura = 512
  if (!altura) altura = 512
  var url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?width=' + largura + '&height=' + altura + '&nologo=true&enhance=true'
  try {
    var res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    var buf = Buffer.from(res.data)
    if (buf.length > 5000) return buf
    return null
  } catch (e) { return null }
}

function gerarPlaceholder(emoji, largura, altura) {
  if (!largura) largura = 500
  if (!altura) altura = 250
  var canvas = createCanvas(largura, altura)
  var ctx = canvas.getContext('2d')

  var grad = ctx.createLinearGradient(0, 0, largura, altura)
  grad.addColorStop(0, '#1a1a2e')
  grad.addColorStop(1, '#16213e')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, largura, altura)

  ctx.font = Math.min(largura, altura) * 0.4 + 'px "Sans"'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, largura / 2, altura / 2)

  return canvas.toBuffer('image/png')
}

function carregarImagem(nomeBase, placeholderEmoji, largura, altura) {
  if (!placeholderEmoji) placeholderEmoji = '🖼️'
  if (!largura) largura = 500
  if (!altura) altura = 250
  var extensoes = ['.png', '.jpg', '.jpeg', '.gif']
  for (var i = 0; i < extensoes.length; i++) {
    var filePath = path.join(ASSETS_DIR, nomeBase + extensoes[i])
    try {
      if (fs.existsSync(filePath)) return fs.readFileSync(filePath)
    } catch (e) {}
  }
  return gerarPlaceholder(placeholderEmoji, largura, altura)
}

function carregarArquivo(nomeBase) {
  var extensoes = ['.gif', '.png', '.jpg', '.jpeg']
  for (var i = 0; i < extensoes.length; i++) {
    var filePath = path.join(ASSETS_DIR, nomeBase + extensoes[i])
    try {
      if (fs.existsSync(filePath)) return fs.readFileSync(filePath)
    } catch (e) {}
  }
  return null
}

async function enviarGif(sock, jid, bufferOuCaminho, caption, options) {
  if (!options) options = {}
  var buffer = bufferOuCaminho
  if (typeof buffer === 'string') {
    buffer = carregarArquivo(buffer)
  }

  if (!Buffer.isBuffer(buffer) || buffer.length < 500) {
    var tp = { text: caption || '' }
    Object.assign(tp, options)
    await sock.sendMessage(jid, tp)
    return
  }

  var temFfmpeg = false
  try { execSync('ffmpeg -version', { stdio: 'ignore' }); temFfmpeg = true } catch (e) {}

  if (temFfmpeg) {
    var tmpDir = path.join(__dirname, '..', 'temp')
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
    var inputPath = path.join(tmpDir, 'in_' + Date.now() + '.gif')
    var outputPath = path.join(tmpDir, 'out_' + Date.now() + '.mp4')
    fs.writeFileSync(inputPath, buffer)
    try {
      execSync('ffmpeg -y -i "' + inputPath + '" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -r 15 "' + outputPath + '"', { stdio: 'ignore', timeout: 15000 })
      var mp4 = fs.readFileSync(outputPath)
      if (mp4.length > 500) {
        var vp = { video: mp4, gifPlayback: true, mimetype: 'video/mp4', caption: caption || '' }
        Object.assign(vp, options)
        await sock.sendMessage(jid, vp)
      } else throw new Error('MP4 pequeno')
    } catch (e) {
      var dp = { document: buffer, mimetype: 'image/gif', fileName: 'animacao.gif', caption: caption || '' }
      Object.assign(dp, options)
      await sock.sendMessage(jid, dp)
    } finally {
      try { fs.unlinkSync(inputPath) } catch (e) {}
      try { fs.unlinkSync(outputPath) } catch (e) {}
    }
  } else {
    var dp2 = { document: buffer, mimetype: 'image/gif', fileName: 'animacao.gif', caption: caption || '' }
    Object.assign(dp2, options)
    await sock.sendMessage(jid, dp2)
  }
}

async function enviarImagem(sock, jid, imagem, caption, options) {
  if (!options) options = {}
  if (typeof imagem === 'string') {
    if (imagem.endsWith('.gif')) return enviarGif(sock, jid, imagem, caption, options)
    imagem = carregarImagem(imagem)
  }

  if (Buffer.isBuffer(imagem) && imagem.length > 500) {
    var gif = imagem[0] === 0x47 && imagem[1] === 0x49 && imagem[2] === 0x46 && imagem[3] === 0x38
    if (gif) return enviarGif(sock, jid, imagem, caption, options)
    var ip = { image: imagem, caption: caption }
    Object.assign(ip, options)
    await sock.sendMessage(jid, ip)
  } else {
    var tp = { text: caption }
    Object.assign(tp, options)
    await sock.sendMessage(jid, tp)
  }
}

async function buscarImagemPersonagem(nome) {
  var q = 'query ($search: String) { Character(search: $search) { name { full } image { large } } }'
  try {
    var r = await axios.post('https://graphql.anilist.co', { query: q, variables: { search: nome } })
    var url = r.data && r.data.data && r.data.data.Character && r.data.data.Character.image && r.data.data.Character.image.large
    if (!url) return null
    var img = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 })
    return Buffer.from(img.data)
  } catch (e) { return null }
}

async function enviarCardPerfil(sock, jid, nome, user, captionPersonalizada) {
  var avatarBuffer = user.avatar
  if (!avatarBuffer) {
    var prompt = 'portrait of original anime character named ' + nome + ', ' + (user.titulo || 'novato') + ', unique design, detailed face, vibrant colors, high quality'
    avatarBuffer = await gerarImagemPollinations(prompt, 512, 512)
    if (avatarBuffer) {
      user.avatar = avatarBuffer
      saveUser(nome, user)
    }
  }

  var caption = captionPersonalizada
  if (!caption) {
    caption = '👤 *' + nome + '*\n🏅 ' + (user.titulo || 'Novato') + '\n⭐ Nv ' + (user.nivel || 1) + ' (' + (user.xp || 0) + ' XP)\n💰 ' + (user.pontos || 0) + ' pts\n⚔️ ' + (user.ataque || 10) + ' atk\n❤️ ' + (user.vida || 100) + ' vida\n🏆 ' + (user.vitorias || 0) + ' vitórias\n⚡ ' + (user.habilidade_ativa || 'Nenhuma') + '\n🐾 ' + (user.pet_ativo || 'Nenhum')
  }

  await enviarImagem(sock, jid, avatarBuffer, caption)
}

async function enviarBannerTorneio(sock, jid, params) {
  if (!params) params = {}
  var inscritos = params.inscritos || 0
  var tempo = params.tempo || 90
  var titulo = params.titulo || 'TORNEIO DE ANIME'

  var nomeBase = 'banner_torneio'
  if (tempo === 90) nomeBase = 'inscricoes_abertas'
  else if (tempo === 45) nomeBase = 'ultima_chance'
  else if (tempo === 0) nomeBase = 'inscricoes_encerradas'

  var cap = '🏆 *' + titulo + '*\n⏱️ ' + (tempo > 0 ? tempo + 's restantes' : 'Encerradas') + '\n👥 Inscritos: ' + inscritos + '\n\n' + (tempo > 0 ? 'Usa *!inscrever* e *!apostar*' : 'A preparar as batalhas...') + '\n🏅 +150 XP • +120 pts • Título • Habilidade secreta'

  await enviarImagem(sock, jid, nomeBase, cap)
}

async function enviarRankingComImagem(sock, jid, sorted, top3) {
  var itens = sorted.slice(0, 10).map(function(arr, i) {
    var nome = arr[0]
    var dados = arr[1]
    var medalha = i < 3 ? ['🥇','🥈','🥉'][i] : (i+1) + '.'
    return medalha + ' *' + nome + '* — Nv ' + dados.nivel + ' | ' + dados.xp + ' XP'
  }).join('\n')
  await enviarImagem(sock, jid, 'ranking', '🏆 *RANKING*\n\n' + itens)
}

async function enviarBoasVindasComImagem(sock, jid, nome, mensagem) {
  await enviarImagem(sock, jid, 'boasvindas', mensagem)
}

async function enviarWaifuComImagem(sock, jid, waifu, husbando) {
  var cap = '💖 *Waifu:* ' + waifu.nome + '\n📺 ' + waifu.anime + '\n💬 "' + waifu.descricao + '"\n\n💪 *Husbando:* ' + husbando.nome + '\n📺 ' + husbando.anime + '\n💬 "' + husbando.descricao + '"'
  var img = await buscarImagemPersonagem(waifu.nome)
  if (!img) img = 'waifu_fallback'
  await enviarImagem(sock, jid, img, cap)
}

async function enviarVitoriaTorneio(sock, jid, campeao) {
  await enviarImagem(sock, jid, 'vitoria_torneio', '🎉 *TORNEIO ENCERRADO!*\n👑 *' + campeao + '*\n+150 XP | +120 pts\n🏆 Título | 🔱 Modo Seis Caminhos')
}

async function enviarLevelUp(sock, jid, nome, novoNivel, novoTitulo) {
  await enviarImagem(sock, jid, 'levelup', '🆙 *' + nome + '* subiu para nível *' + novoNivel + '*!\n🏅 ' + novoTitulo)
}

async function enviarVitoriaBatalha(sock, jid, vencedor, perdedor) {
  await enviarImagem(sock, jid, 'vitoria_batalha', '🏆 *' + vencedor + '* venceu a batalha!\n💀 *' + perdedor + '* foi derrotado\n+50 XP | +30 pts')
}

module.exports = {
  enviarCardPerfil: enviarCardPerfil,
  enviarRankingComImagem: enviarRankingComImagem,
  enviarBoasVindasComImagem: enviarBoasVindasComImagem,
  enviarWaifuComImagem: enviarWaifuComImagem,
  enviarVitoriaTorneio: enviarVitoriaTorneio,
  enviarLevelUp: enviarLevelUp,
  enviarVitoriaBatalha: enviarVitoriaBatalha,
  buscarImagemPersonagem: buscarImagemPersonagem,
  buscarImagemAnime: buscarImagemPersonagem,
  enviarBannerTorneio: enviarBannerTorneio,
  enviarImagem: enviarImagem,
  enviarGif: enviarGif
}
