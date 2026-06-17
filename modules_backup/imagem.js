require('dotenv').config()
const axios = require('axios')

// Pollinations.ai — gratuito, sem chave, sempre online
async function gerarImagem(sock, jid, prompt, estilo = 'anime') {

  const estilos = {
    anime: 'anime style, high quality, detailed, vibrant colors',
    arte: 'anime art style, painterly, cinematic, dramatic lighting',
    retrato: 'anime portrait, close up, detailed face, high quality',
  }

  const estiloTexto = estilos[estilo] || estilos.anime
  const promptFinal = `${prompt}, ${estiloTexto}`
  const promptEncoded = encodeURIComponent(promptFinal)

  await sock.sendMessage(jid, {
    text: `🎨 A gerar imagem...\n"${prompt}"\n\n⏳ Aguarda!`
  })

  try {
    // Pollinations.ai — gera imagem via URL direta
    const url = `https://image.pollinations.ai/prompt/${promptEncoded}?width=512&height=512&nologo=true&enhance=true`

    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    const buffer = Buffer.from(res.data)

    if (buffer.length > 5000) {
      await sock.sendMessage(jid, {
        image: buffer,
        caption: `🎨 *Imagem gerada!*\nPrompt: "${prompt}"\nEstilo: ${estilo}`
      })
    } else {
      throw new Error('Imagem inválida')
    }

  } catch (err) {
    console.error('Imagem erro:', err.message)

    // Fallback — tenta modelo diferente do Pollinations
    try {
      const url2 = `https://image.pollinations.ai/prompt/${promptEncoded}?model=flux&width=512&height=512&nologo=true`
      const res2 = await axios.get(url2, { responseType: 'arraybuffer', timeout: 60000 })
      const buffer2 = Buffer.from(res2.data)

      await sock.sendMessage(jid, {
        image: buffer2,
        caption: `🎨 *Imagem gerada!*\nPrompt: "${prompt}"`
      })
    } catch {
      await sock.sendMessage(jid, {
        text: `❌ Erro ao gerar imagem. Tenta um prompt mais simples!\nEx: *!img samurai anime*`
      })
    }
  }
}

async function comandoImagem(sock, jid, args) {
  const partes = args.split(' ')
  let estilo = 'anime'
  let prompt = args

  if (['anime', 'arte', 'retrato'].includes(partes[0])) {
    estilo = partes[0]
    prompt = partes.slice(1).join(' ')
  }

  if (!prompt || prompt.length < 2) {
    await sock.sendMessage(jid, {
      text: `🎨 *Como usar !img:*\n\n!img <descrição>\n!img anime <descrição>\n!img arte <descrição>\n!img retrato <descrição>\n\nExemplos:\n• !img naruto com sharingan\n• !img arte samurai ao pôr do sol\n• !img retrato waifu cabelo azul`
    })
    return
  }

  await gerarImagem(sock, jid, prompt, estilo)
}

module.exports = { comandoImagem }
