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

// Captura erros globais para evitar crash
process.on('uncaughtException', (err) => {
  console.error('❌ Erro não capturado:', err.message)
  // Não termina o processo — PM2 cuida do restart se necessário
})

process.on('unhandledRejection', (err) => {
  console.error('❌ Rejeição não tratada:', err?.message || err)
})

// Sinal de saúde — PM2 usa isto para saber se o bot está vivo
process.on('SIGINT', () => {
  console.log('⚠️ SIGINT recebido — encerrando com segurança...')
  process.exit(0)
})

module.exports = { iniciarKeepAlive }
