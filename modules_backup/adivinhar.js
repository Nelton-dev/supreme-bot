// ============================================================
// adivinhar.js — Adivinhar personagem pela descrição
// ============================================================
const { getUser, saveUser } = require('../db')

const personagens = [
  { nome: 'naruto', descricao: 'Loiro, tem marcas de bigode no rosto, sonha em ser Hokage e tem uma raposa de 9 caudas dentro de si.' },
  { nome: 'luffy', descricao: 'Usa chapéu de palha, tem corpo de borracha, come muito e quer ser o Rei dos Piratas.' },
  { nome: 'goku', descricao: 'Saiyajin criado na Terra, transforma o cabelo em dourado quando fica forte, ama comer e lutar.' },
  { nome: 'deku', descricao: 'Cabelo verde, nasceu sem poder em um mundo de heróis, herdou o poder do maior herói.' },
  { nome: 'levi', descricao: 'Baixo, cara sisuda, o soldado mais forte da humanidade, limpa tudo compulsivamente.' },
  { nome: 'light', descricao: 'Estudante gênio que encontrou um caderno capaz de matar qualquer pessoa cujo nome escrever.' },
  { nome: 'itachi', descricao: 'Matou o próprio clã, tem olhos que lançam fogo negro eterno e amava o irmão mais novo.' },
  { nome: 'saitama', descricao: 'Careca, derrota qualquer inimigo com um soco só, entrou em depressão por ser forte demais.' },
  { nome: 'killua', descricao: 'Cabelo branco, herdeiro de uma família de assassinos, melhor amigo de Gon.' },
  { nome: 'zoro', descricao: 'Luta com três espadas, uma na boca, se perde sempre, quer ser o melhor espadachim do mundo.' },
]

let adivAtivo = null
let adivTimeout = null

async function iniciarAdivinhar(sock, jid) {
  if (adivAtivo) {
    await sock.sendMessage(jid, { text: '🤔 Já há um personagem para adivinhar! Tentem descobrir.' })
    return
  }
  const p = personagens[Math.floor(Math.random() * personagens.length)]
  adivAtivo = { ...p, jid }

  await sock.sendMessage(jid, {
    text: `🕵️ *QUEM SOU EU?*\n\n"${p.descricao}"\n\n🎯 Descobre o nome do personagem!\n⏱️ Tens 60 segundos!`
  })

  adivTimeout = setTimeout(async () => {
    if (adivAtivo) {
      await sock.sendMessage(jid, { text: `⏰ Ninguém adivinhou!\nEra: *${p.nome.toUpperCase()}*` })
      adivAtivo = null
    }
  }, 60000)
}

async function verificarAdivinhar(sock, jid, texto, nome) {
  if (!adivAtivo || adivAtivo.jid !== jid) return false
  if (texto !== adivAtivo.nome) return false

  clearTimeout(adivTimeout)
  const user = getUser(nome)
  user.xp += 25
  user.pontos += 20
  saveUser(nome, user)

  await sock.sendMessage(jid, {
    text: `🎉 *${nome}* adivinhou! Era *${adivAtivo.nome.toUpperCase()}*!\n+25 XP | +20 pontos 🏅`
  })
  adivAtivo = null
  return true
}

// ============================================================
// waifu.js — Waifu/Husbando do dia
// ============================================================
const waifus = [
  { nome: 'Rem', anime: 'Re:Zero', descricao: 'Demônio de chifres azuis, leal e dedicada.' },
  { nome: 'Zero Two', anime: 'Darling in the FranXX', descricao: 'Híbrida de klaxossauro, ousada e apaixonada.' },
  { nome: 'Asuna', anime: 'Sword Art Online', descricao: 'Espadachim habilidosa e corajosa.' },
  { nome: 'Mikasa', anime: 'Attack on Titan', descricao: 'Guerreira implacável, protetora de Eren.' },
  { nome: 'Hinata', anime: 'Naruto', descricao: 'Tímida mas determinada, apaixonada por Naruto.' },
  { nome: 'Megumin', anime: 'KonoSuba', descricao: 'Maga obcecada com explosões.' },
  { nome: 'Nezuko', anime: 'Demon Slayer', descricao: 'Demônio gentil que protege o irmão.' },
  { nome: 'Erza', anime: 'Fairy Tail', descricao: 'Cavaleira que troca de armaduras no combate.' },
]

const husbandos = [
  { nome: 'Levi Ackerman', anime: 'Attack on Titan', descricao: 'Soldado mais forte da humanidade.' },
  { nome: 'Itachi Uchiha', anime: 'Naruto', descricao: 'Gênio sacrificado por amor ao irmão.' },
  { nome: 'Killua', anime: 'Hunter x Hunter', descricao: 'Assassino de família nobre com coração bom.' },
  { nome: 'Roronoa Zoro', anime: 'One Piece', descricao: 'Espadachim que luta com três espadas.' },
  { nome: 'Satoru Gojo', anime: 'Jujutsu Kaisen', descricao: 'O feiticeiro mais forte, com olhos infinitos.' },
  { nome: 'Yato', anime: 'Noragami', descricao: 'Deus menor que sonha em ter um templo.' },
]

let ultimaWaifu = { data: null, waifu: null, husbando: null }

async function waifuDoDia(sock, jid) {
  const hoje = new Date().toDateString()
  if (ultimaWaifu.data !== hoje) {
    ultimaWaifu = {
      data: hoje,
      waifu: waifus[Math.floor(Math.random() * waifus.length)],
      husbando: husbandos[Math.floor(Math.random() * husbandos.length)]
    }
  }
  const { waifu, husbando } = ultimaWaifu
  await sock.sendMessage(jid, {
    text: `💖 *WAIFU & HUSBANDO DO DIA* 💖\n\n🌸 *Waifu:* ${waifu.nome}\n📺 Anime: ${waifu.anime}\n💬 "${waifu.descricao}"\n\n💪 *Husbando:* ${husbando.nome}\n📺 Anime: ${husbando.anime}\n💬 "${husbando.descricao}"`
  })
}

// ============================================================
// diario.js — Desafio diário com recompensa
// ============================================================
const desafios = [
  'Mande o nome do teu anime favorito e o motivo!',
  'Qual personagem tu mais te identificas? Por quê?',
  'Se pudesses ter um poder de anime, qual seria?',
  'Qual é o momento mais épico de anime que já viste?',
  'Recomenda um anime e convença o grupo a assistir!',
  'Qual é a melhor frase de motivação de um personagem de anime?',
  'Qual vilão de anime tu achas que tinha razão?',
  'Se existisse uma escola de anime, em qual entrarias?',
]

let desafioHoje = { data: null, texto: null }

async function desafioDiario(sock, jid, nome) {
  const hoje = new Date().toDateString()
  if (desafioHoje.data !== hoje) {
    desafioHoje = {
      data: hoje,
      texto: desafios[Math.floor(Math.random() * desafios.length)],
      responderam: []
    }
  }

  if (desafioHoje.responderam?.includes(nome)) {
    await sock.sendMessage(jid, { text: `✅ *${nome}*, já completaste o desafio de hoje! Volta amanhã.` })
    return
  }

  await sock.sendMessage(jid, {
    text: `🌟 *DESAFIO DIÁRIO!*\n\n📋 ${desafioHoje.texto}\n\nResponde aqui no grupo para ganhar *+30 XP e +25 pontos!*\nUsa *!completar* depois de responder.`
  })
}

async function completarDesafio(sock, jid, nome) {
  const hoje = new Date().toDateString()
  if (!desafioHoje.data || desafioHoje.data !== hoje) {
    await sock.sendMessage(jid, { text: '📋 Usa *!diario* primeiro para ver o desafio de hoje!' })
    return
  }
  if (!desafioHoje.responderam) desafioHoje.responderam = []
  if (desafioHoje.responderam.includes(nome)) {
    await sock.sendMessage(jid, { text: `✅ *${nome}*, já recebeste a recompensa hoje!` })
    return
  }
  desafioHoje.responderam.push(nome)
  const { user } = getUser(nome)
  user.xp += 30
  user.pontos += 25
  saveUser(nome, user)
  await sock.sendMessage(jid, {
    text: `🎁 *${nome}* completou o desafio diário!\n+30 XP | +25 pontos 🌟\n\nTotal de pontos: ${user.pontos}`
  })
}

// ============================================================
// loja.js — Loja de pontos e títulos
// ============================================================
const itens = [
  { id: 'vip', nome: '⭐ Título VIP Otaku', preco: 100, tipo: 'titulo' },
  { id: 'espadachim', nome: '⚔️ Título Espadachim Lendário', preco: 200, tipo: 'titulo' },
  { id: 'kage', nome: '🔥 Título Kage das Sombras', preco: 300, tipo: 'titulo' },
  { id: 'deus', nome: '👑 Título Deus Otaku', preco: 500, tipo: 'titulo' },
  { id: 'boost_ataque', nome: '💪 Boost de Ataque (+10)', preco: 80, tipo: 'item' },
  { id: 'boost_vida', nome: '❤️ Boost de Vida (+20)', preco: 80, tipo: 'item' },
]

async function verLoja(sock, jid) {
  let txt = '🏪 *LOJA DE PONTOS*\n\n'
  itens.forEach(i => {
    txt += `• *${i.nome}*\n  💰 ${i.preco} pontos | ID: \`${i.id}\`\n\n`
  })
  txt += 'Para comprar: *!comprar <id>*\nEx: !comprar vip'
  await sock.sendMessage(jid, { text: txt })
}

async function comprar(sock, jid, nome, itemId) {
  const item = itens.find(i => i.id === itemId)
  if (!item) {
    await sock.sendMessage(jid, { text: `❌ Item *${itemId}* não encontrado. Usa *!loja* para ver os itens.` })
    return
  }
  const { user } = getUser(nome)
  if (user.pontos < item.preco) {
    await sock.sendMessage(jid, { text: `❌ Pontos insuficientes!\nTens *${user.pontos}* pontos, precisas de *${item.preco}*.` })
    return
  }
  user.pontos -= item.preco
  if (item.tipo === 'titulo') user.titulo = item.nome
  if (item.id === 'boost_ataque') user.ataque = (user.ataque || 10) + 10
  if (item.id === 'boost_vida') user.vida = (user.vida || 100) + 20
  if (!user.inventario.includes(item.nome)) user.inventario.push(item.nome)
  saveUser(nome, user)
  await sock.sendMessage(jid, {
    text: `✅ *${nome}* comprou *${item.nome}*!\n💰 Pontos restantes: ${user.pontos}`
  })
}

module.exports = {
  iniciarAdivinhar, verificarAdivinhar,
  waifuDoDia,
  desafioDiario, completarDesafio,
}
