require('dotenv').config()
const axios = require('axios')

// Modelos de áudio gratuitos no Hugging Face
const MODELOS_AUDIO = {
  musica: 'facebook/musicgen-small',      // Gera música
  voz: 'espnet/kan-bayashi_ljspeech_vits', // Text-to-speech
}

// Frases de efeito de anime para TTS
const FRASES_ANIME = [
  "Eu nunca volto atrás na minha palavra! Esse é o meu nindo, meu caminho ninja!",
  "Vou ser o Rei dos Piratas!",
  "Eu vou ultrapassar todos e me tornar o número um!",
  "Com o meu poder, vou proteger todos que amo!",
  "Esse é o poder da minha explosão!!",
  "Serei o melhor espadachim do mundo, mesmo que custe minha vida!",
  "Nenhum esforço é desperdiçado. Toda semente germina com o tempo.",
]

async function gerarMusica(sock, jid, descricao) {
  await sock.sendMessage(jid, {
    text: `🎵 A compor música...\n"${descricao}"\n\n⏳ Pode demorar até 1 minuto!`
  })

  const prompt = `anime opening theme, ${descricao}, epic, orchestral, japanese style`

  try {
    const res = await axios.post(
      `https://api-inference.huggingface.co/models/${MODELOS_AUDIO.musica}`,
      {
        inputs: prompt,
        parameters: { duration: 10 } // 10 segundos
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 120000
      }
    )

    const buffer = Buffer.from(res.data)
    const contentType = res.headers['content-type'] || ''

    if (contentType.includes('audio') || buffer.length > 10000) {
      await sock.sendMessage(jid, {
        audio: buffer,
        mimetype: 'audio/mpeg',
        caption: `🎵 *Música gerada!*\nTema: "${descricao}"`
      })
    } else {
      await sock.sendMessage(jid, { text: '⏳ Modelo a iniciar, tenta de novo em 30 segundos!' })
    }

  } catch (err) {
    console.error('Áudio erro:', err.message)
    await sock.sendMessage(jid, {
      text: `❌ Erro ao gerar música.\nTenta: !musica epic battle anime`
    })
  }
}

async function gerarVoz(sock, jid, texto) {
  // Limita o texto para não exceder limites
  const textoLimitado = texto.slice(0, 200)

  await sock.sendMessage(jid, {
    text: `🎙️ A gerar voz...\n"${textoLimitado}"\n\n⏳ Aguarda!`
  })

  try {
    const res = await axios.post(
      `https://api-inference.huggingface.co/models/${MODELOS_AUDIO.voz}`,
      { inputs: textoLimitado },
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
    const contentType = res.headers['content-type'] || ''

    if (contentType.includes('audio') || buffer.length > 5000) {
      await sock.sendMessage(jid, {
        audio: buffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true // Aparece como mensagem de voz
      })
    } else {
      await sock.sendMessage(jid, { text: '⏳ Modelo carregando, tenta de novo em 20 segundos!' })
    }

  } catch (err) {
    console.error('Voz erro:', err.message)
    await sock.sendMessage(jid, { text: '❌ Erro ao gerar voz. Tenta novamente!' })
  }
}

async function fraseFamosa(sock, jid) {
  const frase = FRASES_ANIME[Math.floor(Math.random() * FRASES_ANIME.length)]
  await sock.sendMessage(jid, { text: `🎙️ A gerar áudio de frase épica de anime...` })
  await gerarVoz(sock, jid, frase)
}

module.exports = { gerarMusica, gerarVoz, fraseFamosa }