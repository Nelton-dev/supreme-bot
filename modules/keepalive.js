// ─── KEEP ALIVE — Mantém o bot sempre conectado ──────────────

let sock = null
let tentativas = 0
let ultimoPing = Date.now()

function iniciarKeepAlive(sockInstance, reconectarFn) {
  sock = sockInstance
  tentativas = 0

  // Ping a cada 30 segundos — mantém a conexão viva
  const pingInterval = setInterval(async () => {
    if (!sock) return

    try {
      // Envia presença para manter conexão ativa
      await sock.sendPresenceUpdate('available')
      ultimoPing = Date.now()
      tentativas = 0
    } catch (err) {
      tentativas++
      console.warn(`⚠️ Ping falhou (${tentativas}x):`, err.message)

      // Se falhar 3 vezes seguidas, força reconexão
      if (tentativas >= 3) {
        console.log('🔄 Forçando reconexão...')
        clearInterval(pingInterval)
        clearInterval(watchdogInterval)
        try { sock.end() } catch {}
        setTimeout(reconectarFn, 2000)
      }
    }
  }, 30000)

  // Watchdog — verifica se o bot está vivo a cada 2 minutos
  const watchdogInterval = setInterval(() => {
    const tempoSemPing = Date.now() - ultimoPing
    if (tempoSemPing > 120000) { // 2 minutos sem ping
      console.log('💀 Watchdog: bot inativo! Reconectando...')
      clearInterval(pingInterval)
      clearInterval(watchdogInterval)
      try { sock.end() } catch {}
      setTimeout(reconectarFn, 2000)
    }
  }, 120000)

  console.log('💓 Keep-alive ativado!')
  return { pingInterval, watchdogInterval }
}

// Teardown ordenado em caso de erro fatal — loga, fecha o socket e sai com código 1
function fatalTeardown(reason, err) {
  try {
    console.error(`\n💥 ${reason}:`, err?.stack || err?.message || err)
  } catch {}
  try {
    if (sock) {
      try { sock.end() } catch {}
    }
  } catch {}
  // Pequena janela para flush de logs antes de sair
  setTimeout(() => process.exit(1), 250)
}

process.on('uncaughtException', (err) => fatalTeardown('Erro não capturado', err))
process.on('unhandledRejection', (err) => fatalTeardown('Rejeição não tratada', err))

// Sinal de saúde — PM2 usa isto para saber se o bot está vivo
process.on('SIGINT', () => {
  console.log('⚠️ SIGINT recebido — encerrando com segurança...')
  process.exit(0)
})

module.exports = { iniciarKeepAlive }
