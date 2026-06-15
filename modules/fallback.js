require('dotenv').config()
const axios = require('axios')

// ─── ESTADO DAS APIS ─────────────────────────────────────────
const estadoAPIs = {
  groq: { ok: true, falhas: 0, ultimaFalha: null },
  mistral: { ok: true, falhas: 0, ultimaFalha: null },
  huggingface: { ok: true, falhas: 0, ultimaFalha: null },
}

function marcarFalha(api) {
  estadoAPIs[api].falhas++
  estadoAPIs[api].ultimaFalha = Date.now()
  if (estadoAPIs[api].falhas >= 3) {
    estadoAPIs[api].ok = false
    // Tenta recuperar após 10 minutos
    setTimeout(() => {
      estadoAPIs[api].ok = true
      estadoAPIs[api].falhas = 0
      console.log(`✅ API ${api} recuperada!`)
    }, 10 * 60 * 1000)
    console.warn(`⚠️ API ${api} marcada como indisponível!`)
  }
}

function marcarSucesso(api) {
  estadoAPIs[api].ok = true
  estadoAPIs[api].falhas = 0
}

// ─── GROQ ────────────────────────────────────────────────────
async function chamarGroq(mensagens, json = false, maxTokens = 500) {
  if (!estadoAPIs.groq.ok) return null
  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model: 'llama3-8b-8192', max_tokens: maxTokens, temperature: 0.85, messages: mensagens },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }
    )
    marcarSucesso('groq')
    const txt = res.data.choices[0].message.content.trim()
    if (json) return JSON.parse(txt.replace(/```json|```/g, '').trim())
    return txt
  } catch (err) {
    marcarFalha('groq')
    console.error('Groq falhou:', err.message)
    return null
  }
}

// ─── MISTRAL ─────────────────────────────────────────────────
async function chamarMistral(mensagens, json = false, maxTokens = 500) {
  if (!estadoAPIs.mistral.ok) return null
  try {
    const res = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      { model: 'mistral-small-latest', messages: mensagens, max_tokens: maxTokens },
      { headers: { Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }
    )
    marcarSucesso('mistral')
    const txt = res.data.choices[0].message.content.trim()
    if (json) return JSON.parse(txt.replace(/```json|```/g, '').trim())
    return txt
  } catch (err) {
    marcarFalha('mistral')
    console.error('Mistral falhou:', err.message)
    return null
  }
}

// ─── HUGGING FACE ────────────────────────────────────────────
async function chamarHuggingFace(modelo, payload, tipo = 'json') {
  if (!estadoAPIs.huggingface.ok) return null
  try {
    const res = await axios.post(
      `https://api-inference.huggingface.co/models/${modelo}`,
      payload,
      {
        headers: { Authorization: `Bearer ${process.env.HF_API_KEY}`, 'Content-Type': 'application/json' },
        responseType: tipo === 'buffer' ? 'arraybuffer' : 'json',
        timeout: 60000
      }
    )
    marcarSucesso('huggingface')
    return res.data
  } catch (err) {
    marcarFalha('huggingface')
    console.error('HuggingFace falhou:', err.message)
    return null
  }
}

// ─── CHAMADA PRINCIPAL COM FALLBACK ──────────────────────────
// Tenta Groq → se falhar tenta Mistral → se falhar retorna null
async function chamarIA(mensagens, json = false, maxTokens = 500) {
  // Tenta Groq primeiro
  let resultado = await chamarGroq(mensagens, json, maxTokens)
  if (resultado) return resultado

  // Fallback para Mistral
  console.log('🔄 Groq indisponível, tentando Mistral...')
  resultado = await chamarMistral(mensagens, json, maxTokens)
  if (resultado) return resultado

  // Sem fallback disponível
  console.error('❌ Todas as APIs de IA indisponíveis!')
  return null
}

// ─── STATUS DAS APIS ─────────────────────────────────────────
function statusAPIs() {
  return Object.entries(estadoAPIs).map(([nome, estado]) => {
    return `${estado.ok ? '✅' : '❌'} *${nome}*: ${estado.ok ? 'Online' : `Offline (${estado.falhas} falhas)`}`
  }).join('\n')
}

module.exports = { chamarIA, chamarGroq, chamarMistral, chamarHuggingFace, statusAPIs }
