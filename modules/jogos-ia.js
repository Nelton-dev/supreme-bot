require('dotenv').config()
const axios = require('axios')
const { getUser, saveUser } = require('../db')

// ─── CHAMADA GROQ ────────────────────────────────────────────
async function groq(prompt, json = true) {
  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        max_tokens: 400,
        temperature: 0.9,
        messages: [
          {
            role: 'system',
            content: json
              ? 'Responds ONLY with valid JSON. No explanation, no markdown, no backticks.'
              : 'És um mestre de jogos de anime. Respondes em português, curto e direto.'
          },
          { role: 'user', content: prompt }
        ]
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    )
    const txt = res.data.choices[0].message.content.trim()
    return json ? JSON.parse(txt.replace(/```json|```/g, '').trim()) : txt
  } catch (err) {
    console.error('Groq erro:', err.message)
    return null
  }
}

// ════════════════════════════════════════
//  QUIZ IA
// ════════════════════════════════════════
let quizIAAtivo = null
let quizIATimeout = null

async function quizIAStart(sock, jid, dificuldade = 'medio') {
  if (quizIAAtivo) {
    await sock.sendMessage(jid, { text: '⏳ Já há um quiz ativo! Respondam primeiro.' })
    return
  }

  await sock.sendMessage(jid, { text: `🤖 A IA está a criar uma pergunta *${dificuldade}*... ⏳` })

  const data = await groq(`
    Cria uma pergunta de quiz sobre anime de dificuldade "${dificuldade}" (facil/medio/dificil).
    Retorna JSON: {"pergunta":"...","resposta":"...","dica":"...","anime":"..."}
    A resposta deve ser 1-3 palavras simples em português minúsculo.
  `)

  if (!data) { await sock.sendMessage(jid, { text: '❌ Erro ao gerar pergunta. Tenta novamente!' }); return }

  quizIAAtivo = { ...data, jid, dificuldade }
  const xp = dificuldade === 'facil' ? 15 : dificuldade === 'medio' ? 25 : 40

  await sock.sendMessage(jid, {
    text: `🎮 *QUIZ IA — ${dificuldade.toUpperCase()}!*\n\n❓ ${data.pergunta}\n📺 Anime: ${data.anime}\n💡 Dica: ${data.dica}\n\n⚡ Recompensa: +${xp} XP\n⏱️ 45 segundos!`
  })

  quizIATimeout = setTimeout(async () => {
    if (quizIAAtivo) {
      await sock.sendMessage(jid, { text: `⏰ Tempo esgotado!\nA resposta era: *${quizIAAtivo.resposta.toUpperCase()}*` })
      quizIAAtivo = null
    }
  }, 45000)
}

async function verificarQuizIA(sock, jid, texto, nome) {
  if (!quizIAAtivo || quizIAAtivo.jid !== jid) return false

  const correto = await groq(`
    A resposta correta é "${quizIAAtivo.resposta}".
    O utilizador respondeu "${texto}".
    É correto ou equivalente? Retorna JSON: {"correto":true/false}
  `)

  if (!correto?.correto) return false

  clearTimeout(quizIATimeout)
  const dif = quizIAAtivo.dificuldade || 'medio'
  const xp = dif === 'facil' ? 15 : dif === 'medio' ? 25 : 40
  const pts = dif === 'facil' ? 10 : dif === 'medio' ? 20 : 35

  const { user } = getUser(nome)
  user.xp += xp; user.pontos += pts
  saveUser(nome, user)

  await sock.sendMessage(jid, { text: `✅ *${nome}* acertou!\n+${xp} XP | +${pts} pontos 🎉` })
  quizIAAtivo = null
  return true
}

// ════════════════════════════════════════
//  FORCA IA
// ════════════════════════════════════════
let forcaIAAtiva = null
let forcaIATimeout = null

const FORCA_DESENHO = [
  '  +---+\n  |   |\n      |\n      |\n      |\n=========',
  '  +---+\n  |   |\n  O   |\n      |\n      |\n=========',
  '  +---+\n  |   |\n  O   |\n  |   |\n      |\n=========',
  '  +---+\n  |   |\n  O   |\n /|   |\n      |\n=========',
  '  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n=========',
  '  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n=========',
  '  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n=========',
]

async function forcaIAStart(sock, jid, tema = 'aleatorio') {
  if (forcaIAAtiva) { await sock.sendMessage(jid, { text: '🎭 Já há uma forca ativa! Usa *!letraia X*' }); return }

  await sock.sendMessage(jid, { text: `🤖 IA a escolher palavra sobre *${tema}*... ⏳` })

  const data = await groq(`
    Escolhe uma palavra de anime sobre o tema "${tema}".
    Retorna JSON: {"palavra":"...","dica":"...","categoria":"..."}
    A palavra deve ser 1 palavra simples em português minúsculo, sem espaços nem acentos.
  `)

  if (!data) { await sock.sendMessage(jid, { text: '❌ Erro ao gerar palavra!' }); return }

  forcaIAAtiva = {
    jid,
    palavra: data.palavra.toLowerCase().replace(/\s/g, ''),
    dica: data.dica,
    categoria: data.categoria,
    letrasErradas: [], letrasCorretas: [], erros: 0, maxErros: 6
  }

  const display = forcaIAAtiva.palavra.split('').map(() => '_').join(' ')
  await sock.sendMessage(jid, {
    text: `🎭 *FORCA IA!*\n\n${FORCA_DESENHO[0]}\n\n${display}\n\n💡 Dica: ${data.dica}\n🏷️ Categoria: ${data.categoria}\n\n✍️ *!letraia A* para tentar uma letra\n📝 *!palavraia naruto* para tentar a palavra`
  })

  forcaIATimeout = setTimeout(async () => {
    if (forcaIAAtiva) {
      await sock.sendMessage(jid, { text: `⏰ Tempo!\n${FORCA_DESENHO[6]}\nEra: *${forcaIAAtiva.palavra.toUpperCase()}*` })
      forcaIAAtiva = null
    }
  }, 120000)
}

async function letraForcaIA(sock, jid, letra, nome) {
  if (!forcaIAAtiva || forcaIAAtiva.jid !== jid) return
  letra = letra.toLowerCase()

  if (forcaIAAtiva.letrasErradas.includes(letra) || forcaIAAtiva.letrasCorretas.includes(letra)) {
    await sock.sendMessage(jid, { text: `⚠️ Letra *${letra.toUpperCase()}* já tentada!` }); return
  }

  const getDisplay = () => forcaIAAtiva.palavra.split('').map(l => forcaIAAtiva.letrasCorretas.includes(l) ? l.toUpperCase() : '_').join(' ')

  if (forcaIAAtiva.palavra.includes(letra)) {
    forcaIAAtiva.letrasCorretas.push(letra)
    const d = getDisplay()
    if (!d.includes('_')) {
      clearTimeout(forcaIATimeout)
      const { user } = getUser(nome)
      user.xp += 45; user.pontos += 35
      saveUser(nome, user)
      await sock.sendMessage(jid, { text: `🎉 *${nome}* completou a forca!\nPalavra: *${forcaIAAtiva.palavra.toUpperCase()}*\n+45 XP | +35 pontos` })
      forcaIAAtiva = null
    } else {
      await sock.sendMessage(jid, { text: `✅ Letra *${letra.toUpperCase()}* existe!\n\n${FORCA_DESENHO[forcaIAAtiva.erros]}\n\n${d}\n❌ Erradas: ${forcaIAAtiva.letrasErradas.join(' ').toUpperCase() || 'nenhuma'}` })
    }
  } else {
    forcaIAAtiva.letrasErradas.push(letra)
    forcaIAAtiva.erros++
    const d = getDisplay()
    if (forcaIAAtiva.erros >= forcaIAAtiva.maxErros) {
      clearTimeout(forcaIATimeout)
      await sock.sendMessage(jid, { text: `💀 *GAME OVER!*\n${FORCA_DESENHO[6]}\nEra: *${forcaIAAtiva.palavra.toUpperCase()}*` })
      forcaIAAtiva = null
    } else {
      await sock.sendMessage(jid, { text: `❌ Letra *${letra.toUpperCase()}* não existe!\n\n${FORCA_DESENHO[forcaIAAtiva.erros]}\n\n${d}\n❌ Erradas: ${forcaIAAtiva.letrasErradas.join(' ').toUpperCase()}\n💔 Vidas: ${forcaIAAtiva.maxErros - forcaIAAtiva.erros}` })
    }
  }
}

// ════════════════════════════════════════
//  VERDADE OU DESAFIO IA
// ════════════════════════════════════════
async function vdIA(sock, jid, escolha, nome) {
  await sock.sendMessage(jid, { text: '🤖 IA a criar... ⏳' })

  const data = await groq(
    escolha === 'verdade'
      ? `Cria uma pergunta de "verdade" criativa sobre anime para grupo de WhatsApp. JSON: {"texto":"..."}`
      : `Cria um desafio divertido sobre anime para grupo de WhatsApp. JSON: {"texto":"..."}`
  )

  if (!data) { await sock.sendMessage(jid, { text: '❌ Erro ao gerar!' }); return }
  const emoji = escolha === 'verdade' ? '🔮' : '🎯'
  await sock.sendMessage(jid, { text: `${emoji} *${escolha.toUpperCase()} para ${nome}:*\n\n"${data.texto}"` })
}

// ════════════════════════════════════════
//  SINOPSE IA
// ════════════════════════════════════════
let sinopseAtiva = null
let sinopseTimeout = null

async function sinopseIA(sock, jid) {
  if (sinopseAtiva) { await sock.sendMessage(jid, { text: '🎬 Já há uma sinopse ativa! Adivinhem!' }); return }

  await sock.sendMessage(jid, { text: '🤖 IA a preparar sinopse misteriosa... ⏳' })

  const data = await groq(`
    Escolhe um anime famoso aleatório e escreve uma sinopse misteriosa SEM mencionar o nome do anime nem personagens pelo nome.
    JSON: {"anime":"nome em minúsculo","sinopse":"sinopse misteriosa em português"}
  `)

  if (!data) { await sock.sendMessage(jid, { text: '❌ Erro ao gerar sinopse!' }); return }

  sinopseAtiva = { ...data, jid }

  await sock.sendMessage(jid, {
    text: `🎬 *ADIVINHE O ANIME!*\n\n📖 "${data.sinopse}"\n\n🎯 Qual anime é este?\n⏱️ 60 segundos!`
  })

  sinopseTimeout = setTimeout(async () => {
    if (sinopseAtiva) {
      await sock.sendMessage(jid, { text: `⏰ Tempo!\nEra: *${sinopseAtiva.anime.toUpperCase()}*` })
      sinopseAtiva = null
    }
  }, 60000)
}

async function verificarSinopse(sock, jid, texto, nome) {
  if (!sinopseAtiva || sinopseAtiva.jid !== jid) return false

  const correto = await groq(`
    O anime correto é "${sinopseAtiva.anime}".
    O utilizador respondeu "${texto}".
    É correto ou equivalente? JSON: {"correto":true/false}
  `)

  if (!correto?.correto) return false

  clearTimeout(sinopseTimeout)
  const { user } = getUser(nome)
  user.xp += 35; user.pontos += 30
  saveUser(nome, user)

  await sock.sendMessage(jid, {
    text: `🎬 *${nome}* adivinhou!\nEra *${sinopseAtiva.anime.toUpperCase()}*!\n+35 XP | +30 pontos 🎉`
  })
  sinopseAtiva = null
  return true
}

// ════════════════════════════════════════
//  HISTÓRIA COLABORATIVA
// ════════════════════════════════════════
let historiaAtiva = null

async function iniciarHistoria(sock, jid, tema) {
  if (historiaAtiva) { await sock.sendMessage(jid, { text: '📖 Já há uma história ativa! Usa *!continuar <texto>*' }); return }

  await sock.sendMessage(jid, { text: '✍️ IA a iniciar história... ⏳' })

  const inicio = await groq(`
    Inicia uma história de anime colaborativa sobre o tema "${tema || 'aventura ninja'}".
    Escreve apenas o início (3-4 linhas) e termina num momento de tensão.
    Responde apenas com o texto da história.
  `, false)

  if (!inicio) { await sock.sendMessage(jid, { text: '❌ Erro ao iniciar história!' }); return }

  historiaAtiva = { jid, historia: inicio, contribuicoes: 0 }

  await sock.sendMessage(jid, {
    text: `📖 *HISTÓRIA COLABORATIVA!*\n\n${inicio}\n\n✍️ Continue com *!continuar <texto>*`
  })
}

async function continuarHistoria(sock, jid, contribuicao, nome) {
  if (!historiaAtiva || historiaAtiva.jid !== jid) {
    await sock.sendMessage(jid, { text: '📖 Inicia uma história com *!historia <tema>*' }); return
  }

  await sock.sendMessage(jid, { text: '✍️ IA a integrar...' })

  const continuacao = await groq(`
    História: "${historiaAtiva.historia}"
    ${nome} contribuiu: "${contribuicao}"
    Continua (3-4 linhas) integrando a contribuição. Termina em suspense.
    Responde apenas com o texto.
  `, false)

  if (!continuacao) { await sock.sendMessage(jid, { text: '❌ Erro ao continuar!' }); return }

  historiaAtiva.historia += '\n' + continuacao
  historiaAtiva.contribuicoes++

  const { user } = getUser(nome)
  user.xp += 10; user.pontos += 8
  saveUser(nome, user)

  if (historiaAtiva.contribuicoes >= 5) {
    await sock.sendMessage(jid, {
      text: `📖 *${nome}:*\n\n${continuacao}\n\n🎬 *FIM!* Usa *!historia <tema>* para uma nova!`
    })
    historiaAtiva = null
  } else {
    await sock.sendMessage(jid, {
      text: `📖 *${nome}:*\n\n${continuacao}\n\n✍️ Quem continua? (${5 - historiaAtiva.contribuicoes} partes restantes)`
    })
  }
}

// ════════════════════════════════════════
//  EXPORTS
// ════════════════════════════════════════
module.exports = {
  quizIAStart,
  verificarQuizIA,
  forcaIAStart,
  letraForcaIA,
  vdIA,
  sinopseIA,
  verificarSinopse,
  iniciarHistoria,
  continuarHistoria,
}
