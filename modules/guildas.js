const fs = require('fs')
const { getUser, saveUser } = require('../db')

const GUILDAS_PATH = './data/guildas.json'

function carregarGuildas() {
  if (!fs.existsSync(GUILDAS_PATH)) {
    fs.writeFileSync(GUILDAS_PATH, JSON.stringify({}, null, 2))
    return {}
  }
  return JSON.parse(fs.readFileSync(GUILDAS_PATH, 'utf8'))
}

function salvarGuildas(data) {
  fs.writeFileSync(GUILDAS_PATH, JSON.stringify(data, null, 2))
}

const EMBLEMAS_GUILDA = ['🛡️','⚔️','🏰','🔮','🗡️','🦅','🐺','🦁','🐉','⭐']

// ════════════════════════════════════════
//  CRIAR GUILDA
// ════════════════════════════════════════
async function criarGuilda(sock, jid, nome, nomeGuilda) {
  const guildas = carregarGuildas()
  const user = getUser(nome)

  if (!user.despertou) {
    await sock.sendMessage(jid, { text: '🌌 Você ainda não despertou no Nexus World!' })
    return
  }

  // Verifica se já pertence a uma guilda
  const guildaAtual = Object.entries(guildas).find(([_, g]) => g.membros.includes(nome))
  if (guildaAtual) {
    await sock.sendMessage(jid, { text: '⚠️ Já te enlaças a uma guilda do Nexus: *' + guildaAtual[1].nome + '*! Sai primeiro com *!sair-guilda* para seguir outro caminho.' })
    return
  }

  if (guildas[nomeGuilda]) {
    await sock.sendMessage(jid, { text: '❌ Já existe uma guilda com o nome *' + nomeGuilda + '* no mapa do Nexus!' })
    return
  }

  if ((user.pontos || 0) < 200) {
    await sock.sendMessage(jid, { text: '❌ Precisas de *200 pontos* para forjar uma guilda!\nTens: ' + (user.pontos || 0) + ' pontos.' })
    return
  }

  user.pontos -= 200
  saveUser(nome, user)

  const emblema = EMBLEMAS_GUILDA[Math.floor(Math.random() * EMBLEMAS_GUILDA.length)]
  guildas[nomeGuilda] = {
    nome: nomeGuilda,
    emblema: emblema,
    lider: nome,
    oficiais: [],
    membros: [nome],
    xp: 0,
    nivel: 1,
    vitoriasGuerra: 0,
    criado: new Date().toLocaleDateString('pt')
  }
  salvarGuildas(guildas)

  await sock.sendMessage(jid, {
    text: emblema + ' *GUILDA FORJADA NO NEXUS!*\n\n🏰 Nome: *' + nomeGuilda + '*\n👑 Líder: ' + nome + '\n📅 Criado em: ' + guildas[nomeGuilda].criado + '\n\n🛡️ Uma aliança nasceu para enfrentar o Vazio.\n💡 Membros podem entrar com:\n*!entrar-guilda ' + nomeGuilda + '*'
  })
}

// ════════════════════════════════════════
//  ENTRAR EM GUILDA
// ════════════════════════════════════════
async function entrarGuilda(sock, jid, nome, nomeGuilda) {
  const guildas = carregarGuildas()
  const user = getUser(nome)

  const guildaAtual = Object.entries(guildas).find(([_, g]) => g.membros.includes(nome))
  if (guildaAtual) {
    await sock.sendMessage(jid, { text: '⚠️ Já pertenceste a uma guilda do Nexus: *' + guildaAtual[1].nome + '*! Sai com *!sair-guilda* para seguir outro destino.' })
    return
  }

  if (!guildas[nomeGuilda]) {
    await sock.sendMessage(jid, { text: '❌ A guilda *' + nomeGuilda + '* não foi encontrada no mapa do Nexus!' })
    return
  }

  guildas[nomeGuilda].membros.push(nome)
  salvarGuildas(guildas)

  await sock.sendMessage(jid, {
    text: guildas[nomeGuilda].emblema + ' *' + nome + '* juntou-se à guilda *' + nomeGuilda + '*!\n🛡️ O Vazio agora terá de medir forças com uma aliança.\n👥 Membros: ' + guildas[nomeGuilda].membros.length
  })
}

// ════════════════════════════════════════
//  SAIR DE GUILDA
// ════════════════════════════════════════
async function sairGuilda(sock, jid, nome) {
  const guildas = carregarGuildas()
  const entrada = Object.entries(guildas).find(([_, g]) => g.membros.includes(nome))

  if (!entrada) {
    await sock.sendMessage(jid, { text: '⚠️ Ainda não te enlaças a nenhuma guilda do Nexus!' })
    return
  }

  const [nomeGuilda, guilda] = entrada

  if (guilda.lider === nome && guilda.membros.length > 1) {
    await sock.sendMessage(jid, { text: '👑 És o líder! Transfere a liderança primeiro para não deixar a aliança em ruínas.' })
    return
  }

  guilda.membros = guilda.membros.filter(m => m !== nome)
  if (guilda.oficiais.includes(nome)) guilda.oficiais = guilda.oficiais.filter(o => o !== nome)

  if (guilda.membros.length === 0) {
    delete guildas[nomeGuilda]
    await sock.sendMessage(jid, { text: '🏚️ A guilda *' + nomeGuilda + '* foi dissolvida por falta de membros.' })
  } else {
    if (guilda.lider === nome) guilda.lider = guilda.membros[0]
    salvarGuildas(guildas)
    await sock.sendMessage(jid, { text: '👋 *' + nome + '* abandonou a guilda *' + nomeGuilda + '*.' })
  }

  salvarGuildas(guildas)
}

// ════════════════════════════════════════
//  VER GUILDAS
// ════════════════════════════════════════
async function verGuildas(sock, jid) {
  const guildas = carregarGuildas()
  const lista = Object.values(guildas)

  if (!lista.length) {
    await sock.sendMessage(jid, { text: '🏚️ Nenhuma guilda foi forjada ainda no Nexus!\nCria a tua com *!criar-guilda <nome>* (200 pontos)' })
    return
  }

  const sorted = lista.sort((a, b) => b.xp - a.xp)
  let txt = '⚔️ *GUILDAS DO NEXUS WORLD* ⚔️\n\nAs alianças mais fortes carregam o peso da era.\n\n'
  sorted.forEach((g, i) => {
    txt += (i + 1) + '. ' + g.emblema + ' *' + g.nome + '*\n   👑 ' + g.lider + ' | 👥 ' + g.membros.length + ' membros | ⭐ ' + g.xp + ' XP | 🏆 ' + (g.vitoriasGuerra || 0) + ' vitórias\n\n'
  })
  txt += '💡 *!guilda <nome>* para ver detalhes'
  await sock.sendMessage(jid, { text: txt })
}

// ════════════════════════════════════════
//  VER GUILDA
// ════════════════════════════════════════
async function verGuilda(sock, jid, nomeGuilda) {
  const guildas = carregarGuildas()
  const g = guildas[nomeGuilda]

  if (!g) {
    await sock.sendMessage(jid, { text: '❌ A guilda *' + nomeGuilda + '* não foi encontrada no mapa do Nexus!' })
    return
  }

  await sock.sendMessage(jid, {
    text: g.emblema + ' *GUILDA ' + g.nome.toUpperCase() + '*\n\n👑 Líder: ' + g.lider + '\n👥 Membros (' + g.membros.length + '):\n' + g.membros.map(m => '  • ' + m).join('\n') + '\n⭐ XP da Guilda: ' + g.xp + '\n🏅 Nível: ' + g.nivel + '\n🏆 Vitórias em Guerra: ' + (g.vitoriasGuerra || 0) + '\n📅 Criado: ' + g.criado
  })
}

// ════════════════════════════════════════
//  ADICIONAR XP À GUILDA
// ════════════════════════════════════════
function adicionarXpGuilda(nome, xp) {
  const guildas = carregarGuildas()
  const entrada = Object.entries(guildas).find(([_, g]) => g.membros.includes(nome))
  if (!entrada) return

  const guilda = entrada[1]
  guilda.xp = (guilda.xp || 0) + xp

  // Sobe de nível a cada 500 XP
  const novoNivel = Math.floor(guilda.xp / 500) + 1
  if (novoNivel > guilda.nivel) {
    guilda.nivel = novoNivel
  }

  salvarGuildas(guildas)
}

module.exports = {
  criarGuilda,
  entrarGuilda,
  sairGuilda,
  verGuildas,
  verGuilda,
  adicionarXpGuilda
}
