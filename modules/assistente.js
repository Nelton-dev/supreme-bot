require('dotenv').config()
const axios = require('axios')
const { getUser, saveUser } = require('../db')

// ─── CHAMADA GROQ ────────────────────────────────────────────
async function groq(mensagens, json = false, maxTokens = 500) {
  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        max_tokens: maxTokens,
        temperature: 0.85,
        messages: mensagens
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    )
    const txt = res.data.choices[0].message.content.trim()
    if (json) return JSON.parse(txt.replace(/```json|```/g, '').trim())
    return txt
  } catch (err) {
    console.error('Groq erro:', err.response?.data || err.message)
    return null
  }
}

// ─── CHAMADA MISTRAL (fallback) ──────────────────────────────
async function mistral(mensagens, maxTokens = 500) {
  try {
    const res = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      { model: 'mistral-small-latest', messages: mensagens, max_tokens: maxTokens },
      { headers: { Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`, 'Content-Type': 'application/json' } }
    )
    return res.data.choices[0].message.content.trim()
  } catch (err) {
    console.error('Mistral erro:', err.message)
    return null
  }
}

async function chamarIA(msgs, json = false, maxTokens = 500) {
  const r = await groq(msgs, json, maxTokens)
  if (r) return r
  if (!json) return await mistral(msgs, maxTokens)
  return null
}

// ─── MEMÓRIA DE CONVERSA POR UTILIZADOR ─────────────────────
const memorias = {}

function getMemoria(nome) {
  if (!memorias[nome]) memorias[nome] = []
  return memorias[nome]
}

function addMemoria(nome, role, content) {
  const m = getMemoria(nome)
  m.push({ role, content })
  if (m.length > 12) m.splice(0, 2) // Mantém últimas 12 mensagens
}

// ════════════════════════════════════════
//  CHAT LIVRE COM IA
// ════════════════════════════════════════
async function chatIA(sock, jid, pergunta, nome) {
  await sock.sendMessage(jid, { text: '🤖 Pensando... ⏳' })

  addMemoria(nome, 'user', pergunta)

  const msgs = [
    {
      role: 'system',
      content: `És o AnimeBot, assistente especialista em anime, mangá e cultura otaku.
Respondes sempre em português de Moçambique, de forma animada e divertida.
Usas emojis e referências de anime naturalmente.
Quando não souberes algo, admites mas sugeres alternativas.
Mantém respostas curtas para WhatsApp (máx 4 linhas).
O utilizador chama-se ${nome}.`
    },
    ...getMemoria(nome)
  ]

  const resposta = await chamarIA(msgs)

  if (!resposta) {
    await sock.sendMessage(jid, { text: '❌ Erro na IA. Tenta novamente!' })
    return
  }

  addMemoria(nome, 'assistant', resposta)
  await sock.sendMessage(jid, { text: `🤖 *AnimeBot IA:*\n\n${resposta}` })
}

// ════════════════════════════════════════
//  RESUMO DE ANIME
// ════════════════════════════════════════
async function resumoAnime(sock, jid, nomeAnime) {
  await sock.sendMessage(jid, { text: `📖 A pesquisar sobre *${nomeAnime}*... ⏳` })

  const resposta = await chamarIA([
    {
      role: 'system',
      content: 'És um especialista em anime. Respondes em português, de forma organizada e informativa.'
    },
    {
      role: 'user',
      content: `Dá-me um resumo completo do anime "${nomeAnime}" com:
- 📖 Sinopse (3-4 linhas)
- 🎭 Personagens principais
- 🏆 Pontos fortes
- ⚠️ Pontos fracos
- ⭐ Nota geral (0-10)
- 👥 Para quem é recomendado
Usa emojis e mantém organizado.`
    }
  ], false, 600)

  if (!resposta) {
    await sock.sendMessage(jid, { text: '❌ Não consegui encontrar info sobre esse anime!' })
    return
  }

  await sock.sendMessage(jid, { text: `📺 *${nomeAnime.toUpperCase()}*\n\n${resposta}` })
}

// ════════════════════════════════════════
//  RECOMENDAÇÃO PERSONALIZADA
// ════════════════════════════════════════
async function recomendarAnime(sock, jid, preferencias, nome) {
  await sock.sendMessage(jid, { text: `🎯 A analisar gostos de *${nome}*... ⏳` })

  const resposta = await chamarIA([
    {
      role: 'system',
      content: 'És um especialista em anime que recomenda com base em preferências. Respondes em português.'
    },
    {
      role: 'user',
      content: `O utilizador ${nome} gosta de: "${preferencias}".
Recomenda 5 animes perfeitos para ele/ela com:
- Nome do anime
- Por que vai gostar (1 linha)
- Onde assistir (se souberes)
Usa emojis e numera a lista.`
    }
  ], false, 500)

  if (!resposta) {
    await sock.sendMessage(jid, { text: '❌ Erro ao gerar recomendações!' })
    return
  }

  await sock.sendMessage(jid, { text: `🎯 *Recomendações para ${nome}:*\n\n${resposta}` })
}

// ════════════════════════════════════════
//  ANÁLISE DE PERSONAGEM
// ════════════════════════════════════════
async function analisarPersonagem(sock, jid, personagem) {
  await sock.sendMessage(jid, { text: `🔍 A analisar *${personagem}*... ⏳` })

  const resposta = await chamarIA([
    {
      role: 'system',
      content: 'És um analista de personagens de anime. Respondes em português com análise profunda mas acessível.'
    },
    {
      role: 'user',
      content: `Faz uma análise completa do personagem "${personagem}" de anime:
- 🧠 Personalidade
- 💪 Poderes e habilidades
- 📖 Arco de desenvolvimento
- ❤️ Relações importantes
- 🎭 Momentos icônicos
- 🏆 Por que é memorável
Usa emojis, mantém interessante.`
    }
  ], false, 600)

  if (!resposta) {
    await sock.sendMessage(jid, { text: '❌ Personagem não encontrado!' })
    return
  }

  await sock.sendMessage(jid, { text: `🎭 *${personagem.toUpperCase()}*\n\n${resposta}` })
}

// ════════════════════════════════════════
//  DEBATE DE ANIME (IA modera)
// ════════════════════════════════════════
let debateAtivo = null

async function iniciarDebate(sock, jid, tema) {
  if (debateAtivo) {
    await sock.sendMessage(jid, { text: '🎤 Já há um debate ativo! Usa *!argumento <texto>* para participar.' })
    return
  }

  await sock.sendMessage(jid, { text: '🎤 IA a preparar debate... ⏳' })

  const intro = await chamarIA([
    {
      role: 'system',
      content: 'És um moderador de debates de anime. Respondes em português de forma animada.'
    },
    {
      role: 'user',
      content: `Prepara um debate sobre o tema anime: "${tema}".
Apresenta 2 lados opostos do debate de forma clara e animada.
Finaliza convidando o grupo a participar com argumentos.
Máx 6 linhas.`
    }
  ], false, 400)

  if (!intro) {
    await sock.sendMessage(jid, { text: '❌ Erro ao iniciar debate!' })
    return
  }

  debateAtivo = { jid, tema, argumentos: [], inicio: Date.now() }

  await sock.sendMessage(jid, {
    text: `🎤 *DEBATE DE ANIME!*\n\n${intro}\n\n💬 Usa *!argumento <texto>* para participar!\n⏱️ Debate encerra em 5 minutos.`
  })

  setTimeout(async () => {
    if (!debateAtivo || debateAtivo.jid !== jid) return
    await encerrarDebate(sock, jid)
  }, 300000)
}

async function adicionarArgumento(sock, jid, argumento, nome) {
  if (!debateAtivo || debateAtivo.jid !== jid) {
    await sock.sendMessage(jid, { text: '⚠️ Nenhum debate ativo! Usa *!debate <tema>*' })
    return
  }

  debateAtivo.argumentos.push({ nome, argumento })

  // IA comenta o argumento
  const comentario = await chamarIA([
    {
      role: 'system',
      content: 'És um moderador de debate de anime. Comentas argumentos de forma animada e breve. Respondes em português.'
    },
    {
      role: 'user',
      content: `Tema do debate: "${debateAtivo.tema}".
${nome} argumentou: "${argumento}".
Faz um comentário breve (2 linhas) sobre o argumento, incentivando outros a responder.`
    }
  ], false, 150)

  await sock.sendMessage(jid, {
    text: `💬 *${nome}:* "${argumento}"\n\n🤖 ${comentario || 'Bom argumento! Quem responde?'}`
  })
}

async function encerrarDebate(sock, jid) {
  if (!debateAtivo) return

  const args = debateAtivo.argumentos
  if (args.length === 0) {
    await sock.sendMessage(jid, { text: '🎤 Debate encerrado sem participações.' })
    debateAtivo = null
    return
  }

  const resumo = await chamarIA([
    {
      role: 'system',
      content: 'És um moderador de debate. Fazes resumos imparciais e divertidos. Respondes em português.'
    },
    {
      role: 'user',
      content: `Tema: "${debateAtivo.tema}".
Argumentos: ${args.map(a => `${a.nome}: "${a.argumento}"`).join(' | ')}.
Faz um resumo do debate, destaca os melhores argumentos e declara um vencedor com justificação.
Usa emojis, máx 8 linhas.`
    }
  ], false, 400)

  // Recompensa quem mais participou
  const contagem = {}
  args.forEach(a => { contagem[a.nome] = (contagem[a.nome] || 0) + 1 })
  const mvp = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]

  if (mvp) {
    const { user } = getUser(mvp[0])
    user.xp += 25; user.pontos += 20
    saveUser(mvp[0], user)
  }

  await sock.sendMessage(jid, {
    text: `🎤 *DEBATE ENCERRADO!*\n\n${resumo || 'Debate encerrado!'}\n\n🏆 MVP: *${mvp?.[0]}* (+25 XP | +20 pts)`
  })

  debateAtivo = null
}

// ════════════════════════════════════════
//  COMPARAR DOIS ANIMES/PERSONAGENS
// ════════════════════════════════════════
async function comparar(sock, jid, item1, item2) {
  await sock.sendMessage(jid, { text: `⚖️ A comparar *${item1}* vs *${item2}*... ⏳` })

  const resposta = await chamarIA([
    {
      role: 'system',
      content: 'És um analista de anime. Fazes comparações justas e detalhadas. Respondes em português.'
    },
    {
      role: 'user',
      content: `Compara "${item1}" vs "${item2}" (podem ser animes ou personagens).
Usa uma tabela ou lista com:
- 💪 Pontos fortes de cada um
- ⚠️ Pontos fracos de cada um
- 🏆 Vencedor geral com justificação
Usa emojis, seja imparcial mas divertido.`
    }
  ], false, 500)

  if (!resposta) {
    await sock.sendMessage(jid, { text: '❌ Erro ao comparar!' })
    return
  }

  await sock.sendMessage(jid, { text: `⚖️ *${item1.toUpperCase()} vs ${item2.toUpperCase()}*\n\n${resposta}` })
}

// ════════════════════════════════════════
//  CURIOSIDADES DE ANIME
// ════════════════════════════════════════
async function curiosidade(sock, jid, tema) {
  await sock.sendMessage(jid, { text: '💡 A procurar curiosidade... ⏳' })

  const resposta = await chamarIA([
    {
      role: 'system',
      content: 'És um especialista em curiosidades de anime. Respondes em português de forma surpreendente.'
    },
    {
      role: 'user',
      content: `Conta uma curiosidade surpreendente e pouco conhecida sobre "${tema || 'anime em geral'}".
Máx 4 linhas. Comece com "💡 *Sabia que...*"`
    }
  ], false, 200)

  if (!resposta) {
    await sock.sendMessage(jid, { text: '❌ Erro ao buscar curiosidade!' })
    return
  }

  await sock.sendMessage(jid, { text: resposta })
}

// ════════════════════════════════════════
//  TRADUTOR DE JAPONÊS DE ANIME
// ════════════════════════════════════════
async function traduzirJapones(sock, jid, texto) {
  await sock.sendMessage(jid, { text: '🇯🇵 A traduzir... ⏳' })

  const resposta = await chamarIA([
    {
      role: 'system',
      content: 'És um tradutor de japonês especializado em anime. Respondes em português.'
    },
    {
      role: 'user',
      content: `Traduz "${texto}" do japonês/anime para português.
Inclui:
- 🇵🇹 Tradução literal
- 💬 Contexto de uso em anime
- 📺 Exemplos de onde aparece
Formato curto e direto.`
    }
  ], false, 250)

  if (!resposta) {
    await sock.sendMessage(jid, { text: '❌ Erro ao traduzir!' })
    return
  }

  await sock.sendMessage(jid, { text: `🇯🇵 *Tradução:*\n\n${resposta}` })
}

// ════════════════════════════════════════
//  LIMPAR MEMÓRIA
// ════════════════════════════════════════
async function limparMemoria(sock, jid, nome) {
  delete memorias[nome]
  await sock.sendMessage(jid, { text: `🗑️ Memória de conversa apagada, *${nome}*!` })
}

module.exports = {
  chatIA, resumoAnime, recomendarAnime,
  analisarPersonagem,
  iniciarDebate, adicionarArgumento, encerrarDebate,
  comparar, curiosidade, traduzirJapones,
  limparMemoria
}
