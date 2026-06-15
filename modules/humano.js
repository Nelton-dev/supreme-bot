// ─── SIMULAR HUMANIDADE ──────────────────────────────────────

// Delay aleatório entre min e max ms
function delay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise(r => setTimeout(r, ms))
}

// Simula "digitando..." antes de responder
async function digitando(sock, jid, duracaoMs = 1500) {
  await sock.sendPresenceUpdate('composing', jid)
  await delay(duracaoMs, duracaoMs + 1000)
  await sock.sendPresenceUpdate('paused', jid)
}

// Simula "gravando áudio..." para respostas de voz
async function gravando(sock, jid, duracaoMs = 2000) {
  await sock.sendPresenceUpdate('recording', jid)
  await delay(duracaoMs, duracaoMs + 1000)
  await sock.sendPresenceUpdate('paused', jid)
}

// Envia mensagem com delay humanizado baseado no tamanho do texto
async function enviarHumano(sock, jid, texto, opcoes = {}) {
  // Calcula delay baseado no tamanho — texto maior = mais tempo "digitando"
  const tamanho = texto.length
  const duracao = Math.min(Math.max(tamanho * 15, 800), 4000)

  await digitando(sock, jid, duracao)
  await sock.sendMessage(jid, { text: texto, ...opcoes })
}

// Envia múltiplas mensagens com delay entre elas
async function enviarSequencia(sock, jid, mensagens) {
  for (const msg of mensagens) {
    await delay(500, 1200)
    await digitando(sock, jid, 800 + msg.length * 10)
    await sock.sendMessage(jid, { text: msg })
  }
}

module.exports = { delay, digitando, gravando, enviarHumano, enviarSequencia }
