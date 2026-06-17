require('dotenv').config()
const axios = require('axios')

// Frases épicas de anime
const FRASES_ANIME = [
  "Eu nunca volto atrás na minha palavra! Esse é o meu nindo, meu caminho ninja!",
  "Vou ser o Rei dos Piratas!",
  "Plus Ultra!!",
  "Esse é o poder da minha explosão!!",
  "Serei o melhor espadachim do mundo!",
  "Com este poder, vou proteger todos que amo!",
  "Omae wa mou shindeiru... NANI?!",
  "Eu vou ser o Hokage, acreditem!",

  // Extras
  "O verdadeiro poder nasce quando protegemos quem importa.",
  "Não importa quantas vezes eu caia, sempre vou me levantar.",
  "O destino pode ser mudado pelas nossas escolhas.",
  "A vitória pertence àqueles que nunca desistem.",
  "Hoje é apenas mais um passo rumo ao topo.",
  "Enquanto eu respirar, continuarei lutando.",
  "Os meus limites existem para serem ultrapassados.",
  "A força sem coragem não significa nada.",
  "Cada batalha torna-me mais forte.",
  "O impossível é apenas uma palavra.",
  "Se o mundo inteiro estiver contra mim, eu ainda avançarei.",
  "A amizade é a arma mais poderosa de todas.",
  "O meu espírito jamais será derrotado.",
  "A escuridão não assusta quem carrega a própria luz.",
  "Treino duro hoje para vencer amanhã.",
  "Nenhum sonho é grande demais para quem persiste.",
  "O poder vem da determinação.",
  "Não importa o quão difícil seja, eu continuarei.",
  "Chegou a hora de despertar o meu verdadeiro poder!",
  "Esta luta ainda não acabou!",
  "O meu coração nunca se rende.",
  "Eu transformarei a derrota em força.",
  "A coragem é o primeiro passo para a vitória.",
  "Cada cicatriz conta uma história de superação.",
  "O futuro pertence aos que acreditam nos seus sonhos.",
  "Nada pode parar alguém verdadeiramente determinado.",
  "Mesmo sozinho, continuarei em frente.",
  "Vou superar todas as expectativas!",
  "Este é apenas o começo da minha jornada.",
  "O poder da vontade supera qualquer obstáculo.",
  "Os heróis são forjados nas dificuldades.",
  "A chama da determinação nunca se apaga.",
  "Chegou o momento de mostrar a minha força!",
  "A esperança é mais forte que o medo.",
  "A verdadeira batalha acontece dentro de nós.",
  "Não existe vitória sem sacrifício.",
  "Os sonhos tornam-se realidade para quem não desiste.",
  "A minha história está apenas a começar.",
  "Hoje vou ultrapassar os meus próprios limites!",
  "O mundo ainda vai ouvir o meu nome!"
];
// ─── VOZ via ElevenLabs ──────────────────────────────────────
async function gerarVozElevenLabs(texto) {
  // Voice ID — "Rachel" é uma voz gratuita
  const voiceId = '21m00Tcm4TlvDq8ikWAM'
  const res = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      text: texto,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    },
    {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      responseType: 'arraybuffer',
      timeout: 30000
    }
  )
  return Buffer.from(res.data)
}

// ─── VOZ via VoiceRSS (fallback) ─────────────────────────────
async function gerarVozVoiceRSS(texto) {
  const url = `https://api.voicerss.org/?key=demo&hl=pt-br&src=${encodeURIComponent(texto)}&f=48khz_16bit_mono&c=MP3`
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
  return Buffer.from(res.data)
}

// ─── GERAR VOZ PRINCIPAL ─────────────────────────────────────
async function gerarVoz(sock, jid, texto) {
  const textoLimitado = texto.slice(0, 200)
  await sock.sendMessage(jid, { text: `🎙️ A gerar voz...\n"${textoLimitado}"\n\n⏳ Aguarda!` })

  try {
    // Tenta ElevenLabs primeiro
    let buffer
    if (process.env.ELEVENLABS_API_KEY) {
      buffer = await gerarVozElevenLabs(textoLimitado)
    } else {
      buffer = await gerarVozGoogle(textoLimitado)
    }

    if (buffer.length > 1000) {
      await sock.sendMessage(jid, {
        audio: buffer,
        mimetype: 'audio/mpeg',
        ptt: true
      })
      return
    }
    throw new Error('Buffer inválido')

  } catch (err) {
    console.error('Voz Google erro:', err.message)

    // Fallback — envia texto formatado como voz
    await sock.sendMessage(jid, {
      text: `🎙️ *[VOZ ANIME]*\n\n"${textoLimitado}"\n\n_(Serviço de voz temporariamente indisponível)_`
    })
  }
}

// ─── MÚSICA — usa Pollinations para gerar descrição + texto ──
async function gerarMusica(sock, jid, descricao) {
  await sock.sendMessage(jid, {
    text: `🎵 A compor música...\n"${descricao}"\n\n⏳ Aguarda!`
  })

  try {
    // Gera letra/descrição da música via Groq
    const axios2 = require('axios')
    const res = await axios2.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: 'Crias letras de músicas de anime em português. Respondes apenas com a letra, sem explicações.'
          },
          {
            role: 'user',
            content: `Cria uma letra épica de música de anime sobre: "${descricao}". Máx 8 linhas, com refrão.`
          }
        ]
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    )

    const letra = res.data.choices[0].message.content.trim()
    await sock.sendMessage(jid, {
      text: `🎵 *Música: ${descricao}*\n\n${letra}\n\n🎼 _(Letra gerada por IA — toca a melodia na tua cabeça! 😄)_`
    })

  } catch (err) {
    console.error('Música erro:', err.message)
    await sock.sendMessage(jid, { text: '❌ Erro ao gerar música. Tenta novamente!' })
  }
}

// ─── FRASE ÉPICA ─────────────────────────────────────────────
async function fraseFamosa(sock, jid) {
  const frase = FRASES_ANIME[Math.floor(Math.random() * FRASES_ANIME.length)]
  await sock.sendMessage(jid, { text: `🎙️ A gerar frase épica...` })
  await gerarVoz(sock, jid, frase)
}

module.exports = { gerarMusica, gerarVoz, fraseFamosa }
