require('dotenv').config()
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const QRCode = require('qrcode')
const http = require('http')
const pino = require('pino')
const fs = require('fs')

const server = http.createServer(async (req, res) => {
  const { qrAtual, botConectado } = global
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  if (!qrAtual) {
    res.end(`<html><body style="background:#000;color:#fff;text-align:center;padding:50px">
      <h2>🤖 AnimeBot</h2>
      <p>${botConectado ? '✅ Bot conectado!' : '⏳ Aguardando QR...'}</p>
      <meta http-equiv="refresh" content="3">
    </body></html>`)
    return
  }
  const img = await QRCode.toDataURL(qrAtual, { width: 300 })
  res.end(`<html><body style="background:#000;color:#fff;text-align:center;padding:30px">
    <h2>🤖 AnimeBot — Escaneia o QR</h2>
    <img src="${img}" style="border-radius:12px"><br><br>
    <p>WhatsApp Business → Dispositivos conectados → Conectar dispositivo</p>
    <meta http-equiv="refresh" content="25">
  </body></html>`)
})

server.listen(3000, () => console.log('🌐 Abre: http://localhost:3000'))

async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    browser: Browsers.ubuntu('Chrome'),
    logger: pino({ level: 'silent' }),
    markOnlineOnConnect: false,
    syncFullHistory: false,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      global.qrAtual = qr
      console.log('\n📱 QR pronto! Abre http://localhost:3000\n')
      qrcode.generate(qr, { small: true })
    }
    if (connection === 'open') {
      global.qrAtual = null
      global.botConectado = true
      global.sockBot = sock
      console.log('\n✅ BOT CONECTADO!\n')
      require('./handler')(sock)
      try { require('./dashboard/server.js') } catch(e) { console.log('Dashboard:', e.message) }
    }
    if (connection === 'close') {
      global.qrAtual = null
      global.botConectado = false
      const codigo = lastDisconnect?.error?.output?.statusCode
      if (codigo === DisconnectReason.loggedOut) {
        console.log('❌ Sessão expirada. Apaga a pasta auth e reinicia.')
        fs.rmSync('./auth', { recursive: true, force: true })
      } else {
        console.log(`⚠️ Desconectado (${codigo}). Reconectando em 5s...`)
        setTimeout(iniciar, 5000)
      }
    }
  })
}

process.on('uncaughtException', err => console.error('Erro:', err.message))
process.on('unhandledRejection', err => console.error('Rejeição:', err?.message || err))
iniciar()
