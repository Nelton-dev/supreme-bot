const fs = require('fs')

const PATH = './data/users.json'

if (!fs.existsSync(PATH)) {
  fs.writeFileSync(PATH, '{}')
}

let cache = JSON.parse(fs.readFileSync(PATH, 'utf8'))
let dirty = false

function salvar() {
  fs.writeFileSync(PATH, JSON.stringify(cache, null, 2))
  dirty = false
}

function getUser(nome) {
  if (!cache[nome]) {
    cache[nome] = {
      xp: 0,
      nivel: 1,
      pontos: 0,
      titulo: 'Novato',
      vida: 100,
      ataque: 10,
      inventario: [],
      ultimoDiario: null,
      vitorias: 0
    }

    dirty = true
  }

  return cache[nome]
}

function saveUser(nome, user) {
  cache[nome] = user
  dirty = true
}

function todosUsuarios() {
  return cache
}

// Salva a cada 30 segundos se houver mudanças
setInterval(() => {
  if (dirty) salvar()
}, 30000)

// Salva ao encerrar
process.on('SIGINT', () => {
  salvar()
  process.exit()
})

process.on('SIGTERM', () => {
  salvar()
  process.exit()
})

module.exports = {
  getUser,
  saveUser,
  todosUsuarios
}
