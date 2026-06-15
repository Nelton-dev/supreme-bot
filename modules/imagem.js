require('dotenv').config()
const axios = require('axios')

// Modelos gratuitos no Hugging Face para estilo anime
const MODELOS = {
  anime: 'Ojimi/anime-kawaii-diffusion',
  arte: 'dreamlike-art/dreamlike-anime-1.0',
  retrato: 'Linaqruf/anything-v3-better-vae',
}

async function gerarImagem(sock, jid, prompt, estilo = 'anime') {
  await sock.sendMessage(jid, {
    text: `🎨 A gerar imagem...\n"${prompt}"\n\n⏳ Pode demorar até 30 segundos!`
  })

  const modelo = MODELOS[estilo] || MODELOS.anime
  const promptFinal = `anime style, high quality, detailed, ${prompt}`

  try {
    const res = await axios.post(
      `https://api-inference.huggingface.co/models/${modelo}`,
      { inputs: promptFinal },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 60000
      }
    )

    const buffer = Buffer.from(res.data)

    // Verifica se é realmente uma imagem (não erro JSON)
    if (res.headers['content-type']?.includes('image')) {
      await sock.sendMessage(jid, {
        image: buffer,
        caption: `🎨 *Imagem gerada!*\nPrompt: "${prompt}"\nEstilo: ${estilo}`
      })
    } else {
      // Modelo a carregar (warmup), tenta de novo em 20s
      await sock.sendMessage(jid, { text: '⏳ Modelo a iniciar... Tentando novamente em 20s!' })
      setTimeout(() => gerarImagem(sock, jid, prompt, estilo), 20000)
    }

  } catch (err) {
    console.error('Imagem erro:', err.message)
    await sock.sendMessage(jid, {
      text: `❌ Erro ao gerar imagem. Tenta:\n• Um prompt mais simples\n• Outro estilo (!img arte ou !img retrato)\n• Aguarda alguns minutos`
    })
  }
}

async function comandoImagem(sock, jid, args) {
  // !img anime naruto com rinnegan
  // !img arte samurai ao pôr do sol
  const partes = args.split(' ')
  let estilo = 'anime'
  let prompt = args

  if (['anime', 'arte', 'retrato'].includes(partes[0])) {
    estilo = partes[0]
    prompt = partes.slice(1).join(' ')
  }

  if (!prompt || prompt.length < 3) {
    await sock.sendMessage(jid, {
      text: `🎨 *Como usar !img:*\n\n!img <descrição>\n!img anime <descrição>\n!img arte <descrição>\n!img retrato <descrição>\n\nExemplos:\n• !img naruto usando sharingan\n• !img arte samurai ao pôr do sol\n• !img retrato waifu cabelo azul`
    })
    return
  }

  await gerarImagem(sock, jid, prompt, estilo)
}

module.exports = { comandoImagem }