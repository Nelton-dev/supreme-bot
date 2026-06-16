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

// ─── API ROUTES ──────────────────────────────────────────────

// Ranking
app.get('/api/ranking', (_, res) => {
  try {
    const db = JSON.parse(fs.readFileSync('./data/users.json'))
    const sorted = Object.entries(db)
      .map(([nome, u]) => ({ nome, ...u }))
      .sort((a, b) => b.xp - a.xp)
    res.json(sorted)
  } catch { res.json([]) }
})

// Stats gerais
app.get('/api/stats', (_, res) => {
  try {
    const db = JSON.parse(fs.readFileSync('./data/users.json'))
    const users = Object.values(db)
    res.json({
      totalJogadores: users.length,
      totalXP: users.reduce((s, u) => s + u.xp, 0),
      totalPontos: users.reduce((s, u) => s + u.pontos, 0),
      totalVitorias: users.reduce((s, u) => s + (u.vitorias || 0), 0),
      nivelMedio: users.length ? (users.reduce((s, u) => s + u.nivel, 0) / users.length).toFixed(1) : 0
    })
  } catch { res.json({}) }
})

// Resetar jogador
app.post('/api/reset/:nome', (req, res) => {
  try {
    const db = JSON.parse(fs.readFileSync('./data/users.json'))
    if (db[req.params.nome]) {
      db[req.params.nome] = { xp: 0, nivel: 1, pontos: 0, titulo: 'Novato', vida: 100, ataque: 10, inventario: [], vitorias: 0 }
      fs.writeFileSync('./data/users.json', JSON.stringify(db, null, 2))
      res.json({ ok: true })
    } else res.json({ ok: false, erro: 'Jogador não encontrado' })
  } catch { res.json({ ok: false }) }
})

// Remover jogador
app.delete('/api/jogador/:nome', (req, res) => {
  try {
    const db = JSON.parse(fs.readFileSync('./data/users.json'))
    delete db[req.params.nome]
    fs.writeFileSync('./data/users.json', JSON.stringify(db, null, 2))
    res.json({ ok: true })
  } catch { res.json({ ok: false }) }
})

// Logs do bot
const logs = []
app.get('/api/logs', (_, res) => res.json(logs.slice(-50)))

// Enviar mensagem ao grupo via painel (requer sock global)
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

// ─── SOCKET.IO (logs em tempo real) ──────────────────────────
io.on('connection', (socket) => {
  socket.emit('logs', logs.slice(-50))
})

// Função para adicionar log (chamada pelo handler)
function adicionarLog(msg) {
  const entry = { hora: new Date().toLocaleTimeString('pt'), msg }
  logs.push(entry)
  if (logs.length > 200) logs.shift()
  io.emit('novo-log', entry)
}

// ─── PÁGINA HTML DO PAINEL ───────────────────────────────────
app.get('/', (_, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AnimeBot Dashboard</title>
<script src="/socket.io/socket.io.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',sans-serif;background:#0d0d1a;color:#e0e0ff;min-height:100vh}
  header{background:linear-gradient(135deg,#1a0533,#0d1f4d);padding:20px 30px;display:flex;align-items:center;gap:15px;border-bottom:2px solid #7c3aed}
  header h1{font-size:1.5rem;color:#a78bfa}
  .status{width:12px;height:12px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e;animation:pulse 2s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  .status.off{background:#ef4444;box-shadow:0 0 8px #ef4444}
  main{padding:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
  .card{background:#12122a;border:1px solid #2d2d5e;border-radius:12px;padding:20px}
  .card h2{color:#a78bfa;margin-bottom:15px;font-size:1rem;text-transform:uppercase;letter-spacing:1px}
  .stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .stat{background:#1a1a3e;border-radius:8px;padding:12px;text-align:center}
  .stat .num{font-size:1.8rem;font-weight:700;color:#7c3aed}
  .stat .label{font-size:.75rem;color:#888;margin-top:4px}
  table{width:100%;border-collapse:collapse;font-size:.85rem}
  th{background:#1a1a3e;color:#a78bfa;padding:8px;text-align:left}
  td{padding:8px;border-bottom:1px solid #1a1a3e}
  tr:hover td{background:#1a1a3e55}
  .badge{background:#7c3aed22;color:#a78bfa;padding:2px 8px;border-radius:20px;font-size:.75rem}
  .btn{padding:6px 12px;border:none;border-radius:6px;cursor:pointer;font-size:.8rem;transition:.2s}
  .btn-red{background:#7f1d1d;color:#fca5a5}.btn-red:hover{background:#991b1b}
  .btn-blue{background:#1e3a8a;color:#93c5fd}.btn-blue:hover{background:#1d4ed8}
  .btn-green{background:#14532d;color:#86efac}.btn-green:hover{background:#166534}
  #logs{background:#050510;border-radius:8px;padding:12px;height:200px;overflow-y:auto;font-family:monospace;font-size:.8rem;color:#4ade80}
  .log-entry{padding:2px 0;border-bottom:1px solid #0a0a2a}
  .log-hora{color:#7c3aed;margin-right:8px}
  input,textarea{background:#1a1a3e;border:1px solid #2d2d5e;color:#e0e0ff;padding:8px 12px;border-radius:6px;width:100%;margin-bottom:8px;font-size:.85rem}
  .full{grid-column:1/-1}
  .medals{font-size:1.1rem}
</style>
</head>
<body>
<header>
  <div class="status off" id="statusDot"></div>
  <h1>🤖 AnimeBot Dashboard</h1>
  <span id="statusText" style="color:#888;font-size:.85rem;margin-left:auto">A verificar...</span>
</header>
<main>

  <!-- Stats -->
  <div class="card">
    <h2>📊 Estatísticas</h2>
    <div class="stats-grid" id="stats">
      <div class="stat"><div class="num">-</div><div class="label">Jogadores</div></div>
      <div class="stat"><div class="num">-</div><div class="label">XP Total</div></div>
      <div class="stat"><div class="num">-</div><div class="label">Vitórias</div></div>
      <div class="stat"><div class="num">-</div><div class="label">Nível Médio</div></div>
    </div>
  </div>

  <!-- Enviar mensagem -->
  <div class="card">
    <h2>📤 Enviar Mensagem ao Grupo</h2>
    <input id="msgJid" placeholder="JID do grupo (ex: 120363xxx@g.us)">
    <textarea id="msgTexto" rows="3" placeholder="Mensagem..."></textarea>
    <button class="btn btn-green" onclick="enviarMsg()">Enviar ✈️</button>
    <p id="msgStatus" style="font-size:.8rem;margin-top:6px;color:#4ade80"></p>
  </div>

  <!-- Ranking -->
  <div class="card full">
    <h2>🏆 Ranking de Jogadores</h2>
    <table>
      <thead><tr><th>#</th><th>Nome</th><th>Nível</th><th>XP</th><th>Pontos</th><th>Título</th><th>Vitórias</th><th>Ações</th></tr></thead>
      <tbody id="rankingBody"></tbody>
    </table>
  </div>

  <!-- Logs -->
  <div class="card full">
    <h2>📜 Logs em Tempo Real</h2>
    <div id="logs"></div>
  </div>

</main>

<script>
const socket = io()
const medals = ['🥇','🥈','🥉']

async function carregar() {
  // Status
  const s = await fetch('/api/status').then(r=>r.json())
  document.getElementById('statusDot').className = 'status ' + (s.online ? '' : 'off')
  document.getElementById('statusText').textContent = s.online ? '✅ Bot Online' : '❌ Bot Offline'
  if (s.jid) document.getElementById('msgJid').value = s.jid

  // Stats
  const st = await fetch('/api/stats').then(r=>r.json())
  const nums = [st.totalJogadores, st.totalXP, st.totalVitorias, st.nivelMedio]
  const labels = ['Jogadores','XP Total','Vitórias','Nível Médio']
  document.getElementById('stats').innerHTML = nums.map((n,i)=>
    \`<div class="stat"><div class="num">\${n||0}</div><div class="label">\${labels[i]}</div></div>\`
  ).join('')

  // Ranking
  const rank = await fetch('/api/ranking').then(r=>r.json())
  document.getElementById('rankingBody').innerHTML = rank.map((u,i)=> \`
    <tr>
      <td class="medals">\${medals[i]||i+1}</td>
      <td><strong>\${u.nome}</strong></td>
      <td>\${u.nivel}</td>
      <td>\${u.xp}</td>
      <td>\${u.pontos}</td>
      <td><span class="badge">\${u.titulo}</span></td>
      <td>\${u.vitorias||0}</td>
      <td>
        <button class="btn btn-blue" onclick="resetar('\${u.nome}')">Reset</button>
        <button class="btn btn-red" onclick="remover('\${u.nome}')">🗑️</button>
      </td>
    </tr>
  \`).join('')
}

async function resetar(nome) {
  if (!confirm('Resetar ' + nome + '?')) return
  await fetch('/api/reset/' + encodeURIComponent(nome), { method:'POST' })
  carregar()
}

async function remover(nome) {
  if (!confirm('Remover ' + nome + ' permanentemente?')) return
  await fetch('/api/jogador/' + encodeURIComponent(nome), { method:'DELETE' })
  carregar()
}

async function enviarMsg() {
  const jid = document.getElementById('msgJid').value.trim()
  const texto = document.getElementById('msgTexto').value.trim()
  if (!jid || !texto) return
  const r = await fetch('/api/mensagem', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ jid, texto })
  }).then(r=>r.json())
  document.getElementById('msgStatus').textContent = r.ok ? '✅ Enviado!' : '❌ Erro ao enviar'
}

// Logs
socket.on('logs', (lista) => {
  lista.forEach(adicionarLog)
})
socket.on('novo-log', adicionarLog)

function adicionarLog({ hora, msg }) {
  const div = document.getElementById('logs')
  div.innerHTML += \`<div class="log-entry"><span class="log-hora">[\${hora}]</span>\${msg}</div>\`
  div.scrollTop = div.scrollHeight
}

carregar()
setInterval(carregar, 10000)
</script>
</body>
</html>`)
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`\n🌐 Painel web: http://localhost:${PORT}\n`)
})

module.exports = { adicionarLog }
