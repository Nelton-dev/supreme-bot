require('dotenv').config()
const { default: makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const readline = require('readline')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

function perguntar(txt) {
  return new Promise(r => rl.question(txt, r))
}

async function iniciar() {
  let num = await perguntar('📱 Número (ex: 841234567): ')
  num = num.replace(/\D/g, '')
  if (!num.startsWith('258')) num = '258' + num
  console.log(`✅ Número: +${num}\n⏳ Conectando...`)

  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    browser: Browsers.ubuntu('Chrome'),
    logger: pino({ level: 'silent' }),
    markOnlineOnConnect: false,
  })

  sock.ev.on('creds.update', saveCreds)

  let codigoGerado = false

  sock.ev.on('connection.update', async ({ connection, qr, lastDisconnect }) => {
    // Gera código quando receber QR (socket pronto)
    if (qr && !codigoGerado) {
      codigoGerado = true
      try {
        const code = await sock.requestPairingCode(num)
        const fmt = code.match(/.{1,4}/g).join('-')
        console.log(`\n╔══════════════════════╗`)
        console.log(`║  🔑 CÓDIGO: ${fmt.padEnd(10)}║`)
        console.log(`╚══════════════════════╝`)
        console.log('\n👉 WhatsApp Business → Dispositivos conectados')
        console.log('👉 Associar com número de telemóvel')
        console.log('👉 Insere o código acima\n')
        console.log('⏳ Aguardando confirmação (60s)...\n')
      } catch (err) {
        console.error('❌ Erro ao gerar código:', err.message)
        process.exit(1)
      }
    }

    if (connection === 'open') {
      console.log('✅ CONECTADO COM SUCESSO!')
      console.log('🚀 Agora corre: pm2 start ecosystem.config.js')
      rl.close()
      process.exit(0)
    }

    if (connection === 'close') {
      const codigo = lastDisconnect?.error?.output?.statusCode
      if (codigo !== DisconnectReason.loggedOut && !codigoGerado) {
        console.log(`⚠️ Desconectado (${codigo}), tentando de novo...`)
        setTimeout(iniciar, 3000)
      }
    }
  })
}

iniciar()
