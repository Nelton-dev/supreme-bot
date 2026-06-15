const fs = require('fs')
const PATH = './data/users.json'

function carregar() {
  if (!fs.existsSync(PATH)) fs.writeFileSync(PATH, '{}')
  return JSON.parse(fs.readFileSync(PATH))
}

function salvar(db) {
  fs.writeFileSync(PATH, JSON.stringify(db, null, 2))
}

function getUser(nome) {
  const db = carregar()
  if (!db[nome]) {
    db[nome] = {
      xp: 0, nivel: 1, pontos: 0,
      titulo: 'Novato', vida: 100, ataque: 10,
      inventario: [], ultimoDiario: null, vitorias: 0
    }
    salvar(db)
  }
  return { db, user: db[nome] }
}

function saveUser(nome, user) {
  const db = carregar()
  db[nome] = user
  salvar(db)
}

function todosUsuarios() {
  return carregar()
}

module.exports = { getUser, saveUser, todosUsuarios }