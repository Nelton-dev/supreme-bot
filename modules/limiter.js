const fs = require('fs')

const LIMITER_PATH = './data/limiter.json'

// Limites diários por utilizador
const LIMITES = {
  ia: 20,        // !ia, chat, menção
  img: 5,        // !img
  musica: 3,     // !musica
  voz: 5,        // !voz
  quizia: 15,    // !quizia
  resumo: 10,    // !resumo, !analisar, !comparar
  historia: 5,   // !historia, !continuar
}

function carregar() {
  if (!fs.existsSync(LIMITER_PATH)) fs.writeFileSync(LIMITER_PATH, '{}')
  return JSON.parse(fs.readFileSync(LIMITER_PATH))
}

function salvar(data) {
  fs.writeFileSync(LIMITER_PATH, JSON.stringify(data, null, 2))
}

function hoje() {
  return new Date().toDateString()
}

// Verifica e incrementa uso
function verificarLimite(nome, tipo) {
  const db = carregar()
  if (!db[nome]) db[nome] = {}
  if (!db[nome][tipo] || db[nome][tipo].dia !== hoje()) {
    db[nome][tipo] = { dia: hoje(), uso: 0 }
  }

  const limite = LIMITES[tipo] || 10
  const uso = db[nome][tipo].uso

  if (uso >= limite) {
    salvar(db)
    return { permitido: false, uso, limite, restante: 0 }
  }

  db[nome][tipo].uso++
  salvar(db)
  return { permitido: true, uso: db[nome][tipo].uso, limite, restante: limite - db[nome][tipo].uso }
}

// Ver uso do utilizador
function verUso(nome) {
  const db = carregar()
  if (!db[nome]) return null

  const resultado = {}
  for (const [tipo, limite] of Object.entries(LIMITES)) {
    const entry = db[nome][tipo]
    if (!entry || entry.dia !== hoje()) {
      resultado[tipo] = { uso: 0, limite, restante: limite }
    } else {
      resultado[tipo] = { uso: entry.uso, limite, restante: Math.max(0, limite - entry.uso) }
    }
  }
  return resultado
}

// Reset manual (admin)
function resetUso(nome) {
  const db = carregar()
  if (db[nome]) delete db[nome]
  salvar(db)
}

module.exports = { verificarLimite, verUso, resetUso, LIMITES }
