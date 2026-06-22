require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const path = require('path')
const fs = require('fs')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// ════════════════════════════════════════
//  FUNÇÕES AUXILIARES
// ════════════════════════════════════════

function limparCacheBot() {
  try {
    const db = require('../db')
    if (typeof db.resetarCache === 'function') {
      db.resetarCache()
    } else {
      fs.writeFileSync('./data/users.json', '{}')
      delete require.cache[require.resolve('../db')]
    }
  } catch (err) {
    console.error('Erro ao limpar cache:', err.message)
    if (fs.existsSync('./data/users.json')) fs.unlinkSync('./data/users.json')
  }
}

function limparRituais() {
  try {
    const sistema = require('../modules/sistema')
    if (typeof sistema.resetarRituais === 'function') {
      sistema.resetarRituais()
    }
  } catch (err) {
    console.error('Erro ao limpar rituais:', err.message)
  }
}

function removerJogadorDoCache(nome) {
  try {
    const db = require('../db')
    if (typeof db.removerUsuario === 'function') {
      db.removerUsuario(nome)
    } else {
      const data = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'))
      delete data[nome]
      fs.writeFileSync('./data/users.json', JSON.stringify(data, null, 2))
      delete require.cache[require.resolve('../db')]
    }
  } catch (err) {
    console.error('Erro ao remover jogador:', err.message)
  }
}

// ════════════════════════════════════════
//  API ROUTES
// ════════════════════════════════════════

// Listar todos os utilizadores (filtrado)
app.get('/api/usuarios', (_, res) => {
  try {
    const db = JSON.parse(fs.readFileSync('./data/users.json'))
    const usuarios = Object.entries(db)
      .filter(([_, u]) => u.xp > 0 || u.despertou || u.ultima_atividade)
      .map(([nome, u]) => ({
        nome,
        nivel: u.nivel || 1,
        xp: u.xp || 0,
        pontos: u.pontos || 0,
        titulo: u.titulo || 'Novato',
        vitorias: u.vitorias || 0,
        rank: u.rank || '―',
        nivel_rank: u.nivel_rank || 1,
        despertou: u.despertou || false,
        titulo_rank: u.titulo_rank || '―'
      }))
    res.json(usuarios)
  } catch { res.json([]) }
})

// Apagar um utilizador específico
app.delete('/api/usuarios/:nome', (req, res) => {
  try {
    removerJogadorDoCache(req.params.nome)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message })
  }
})

// Reset total (preserva auth)
app.post('/api/reset', (req, res) => {
  try {
    if (fs.existsSync('./data/users.json')) fs.unlinkSync('./data/users.json')
    if (fs.existsSync('./data/social.json')) fs.unlinkSync('./data/social.json')
    limparCacheBot()
    limparRituais()
    res.json({ success: true, message: 'Todos os dados do jogo foram resetados.' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Stats gerais
app.get('/api/stats', (_, res) => {
  try {
    const db = JSON.parse(fs.readFileSync('./data/users.json'))
    const users = Object.values(db).filter(u => u.xp > 0 || u.despertou)
    res.json({
      totalJogadores: users.length,
      totalXP: users.reduce((s, u) => s + u.xp, 0),
      totalPontos: users.reduce((s, u) => s + u.pontos, 0),
      totalVitorias: users.reduce((s, u) => s + (u.vitorias || 0), 0),
      nivelMedio: users.length ? (users.reduce((s, u) => s + u.nivel, 0) / users.length).toFixed(1) : 0
    })
  } catch { res.json({}) }
})

// Resetar jogador individual
app.post('/api/reset/:nome', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'))
    if (data[req.params.nome]) {
      data[req.params.nome] = {
        xp: 0, nivel: 1, pontos: 0, titulo: 'Novato',
        vida: 100, ataque: 10, inventario: [], vitorias: 0,
        despertou: false, rank: null, nivel_rank: 1, xp_rank: 0, titulo_rank: null
      }
      fs.writeFileSync('./data/users.json', JSON.stringify(data, null, 2))
      delete require.cache[require.resolve('../db')]
      res.json({ ok: true })
    } else res.json({ ok: false, erro: 'Jogador não encontrado' })
  } catch { res.json({ ok: false }) }
})

// Logs do bot
const logs = []
app.get('/api/logs', (_, res) => res.json(logs.slice(-50)))

// Enviar mensagem ao grupo via painel
app.post('/api/mensagem', async (req, res) => {
  const { texto, jid } = req.body
  if (!global.sockBot || !jid || !texto) return res.json({ ok: false })
  try {
    await global.sockBot.sendMessage(jid, { text: texto })
    res.json({ ok: true })
  } catch { res.json({ ok: false }) }
})

// Status do bot
app.get('/api/status', (_, res) => {
  res.json({ online: !!global.sockBot, jid: global.JID_GRUPO || null })
})

// ════════════════════════════════════════
//  SOCKET.IO (logs em tempo real)
// ════════════════════════════════════════
io.on('connection', (socket) => {
  socket.emit('logs', logs.slice(-50))
})

function adicionarLog(msg) {
  const entry = { hora: new Date().toLocaleTimeString('pt'), msg }
  logs.push(entry)
  if (logs.length > 200) logs.shift()
  io.emit('novo-log', entry)
}

// ════════════════════════════════════════
//  SERVIR A INTERFACE (public/index.html)
// ════════════════════════════════════════
app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log('\n🌐 Painel web: http://localhost:' + PORT + '\n')
})

module.exports = { adicionarLog }
