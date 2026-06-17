require('dotenv').config()
const axios = require('axios')

// Histórico por utilizador (memória de conversa)
const historicos = {}

// ─── GROQ ────────────────────────────────────────────────────
async function perguntarGroq(mensagem, nome) {
  if (!historicos[nome]) historicos[nome] = []

  historicos[nome].push({ role: 'user', content: mensagem })

  // Manter apenas as últimas 10 mensagens para não estourar o limite
  if (historicos[nome].length > 10) historicos[nome] = historicos[nome].slice(-10)

  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `És o AnimeBot, assistente especialista em anime e mangá. 
Respondes sempre em português de forma animada, com emojis e referências de anime. 
Quando não souberes algo, inventa uma resposta criativa no estilo anime. 
Usas expressões como "Nani?!", "Sugoi!", "Yosh!" naturalmente.
Mantém respostas curtas e diretas para grupos de WhatsApp (máx 3 parágrafos).`
          },
          ...historicos[nome]
        ],
        max_tokens: 300,
        temperature: 0.8
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const resposta = res.data.choices[0].message.content
    historicos[nome].push({ role: 'assistant', content: resposta })
    return resposta

  } catch (err) {
    console.error('Groq erro:', err.response?.data || err.message)
    return null
  }
}

// ─── MISTRAL ─────────────────────────────────────────────────
async function perguntarMistral(mensagem) {
  try {
    const res = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'system',
            content: `És um especialista em anime e mangá. Respondes em português, de forma detalhada e precisa. 
Dás informações sobre personagens, enredos, autores, studios e curiosidades de anime.`
          },
          { role: 'user', content: mensagem }
        ],
        max_tokens: 400
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data.choices[0].message.content
  } catch (err) {
    console.error('Mistral erro:', err.response?.data || err.message)
    return null
  }
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────
async function responderIA(sock, jid, pergunta, nome) {
  await sock.sendMessage(jid, { text: '🤖 Deixa eu pensar... ⏳' })

  // Tenta Groq primeiro, fallback para Mistral
  let resposta = await perguntarGroq(pergunta, nome)

  if (!resposta) {
    resposta = await perguntarMistral(pergunta)
  }

  if (!resposta) {
    await sock.sendMessage(jid, { text: '❌ A IA está com problemas agora. Tenta mais tarde!' })
    return
  }

  await sock.sendMessage(jid, { text: `🤖 *AnimeBot IA:*\n\n${resposta}` })
}

async function limparHistorico(sock, jid, nome) {
  delete historicos[nome]
  await sock.sendMessage(jid, { text: `🗑️ Histórico de conversa apagado, *${nome}*!` })
}

module.exports = { responderIA, limparHistorico }