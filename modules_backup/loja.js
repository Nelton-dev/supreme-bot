const { getUser, saveUser } = require('../db')

// ════════════════════════════════════════
//  ITENS DA LOJA
// ════════════════════════════════════════
const ITENS = {
  // ─── TÍTULOS ───────────────────────────
  vip:        { nome: '⭐ VIP Otaku',           preco: 100,  tipo: 'titulo',     desc: 'Título de prestígio' },
  espadachim: { nome: '⚔️ Espadachim Lendário', preco: 200,  tipo: 'titulo',     desc: 'Para os mestres da espada' },
  kage:       { nome: '🔥 Kage das Sombras',    preco: 300,  tipo: 'titulo',     desc: 'Líder das trevas' },
  deus:       { nome: '👑 Deus Otaku',          preco: 500,  tipo: 'titulo',     desc: 'O mais raro de todos' },

  // ─── BOOSTS ────────────────────────────
  boost_atk:  { nome: '💪 Boost Ataque +15',   preco: 80,   tipo: 'boost',      desc: 'Aumenta ataque permanentemente', atk: 15 },
  boost_vida: { nome: '❤️ Boost Vida +25',      preco: 80,   tipo: 'boost',      desc: 'Aumenta vida permanentemente', vida: 25 },
  boost_xp:   { nome: '✨ Boost XP x2',        preco: 150,  tipo: 'boost_xp',   desc: 'Dobra XP por 24h' },

  // ─── POÇÕES ────────────────────────────
  pocao_vida: { nome: '🧪 Poção de Vida',      preco: 40,   tipo: 'pocao',      desc: 'Restaura vida na batalha', efeito: 'vida', valor: 50 },
  pocao_atk:  { nome: '⚗️ Poção de Força',     preco: 40,   tipo: 'pocao',      desc: 'Dobra ataque por 1 batalha', efeito: 'ataque_temp' },
  escudo:     { nome: '🛡️ Escudo Ninja',        preco: 60,   tipo: 'pocao',      desc: 'Bloqueia 1 ataque na batalha', efeito: 'escudo' },

  // ─── HABILIDADES ───────────────────────
  sharingan:  { nome: '👁️ Sharingan',           preco: 200,  tipo: 'habilidade', desc: '20% chance de esquivar ataques', efeito: 'esquiva', valor: 20 },
  rasengan:   { nome: '🌀 Rasengan',            preco: 200,  tipo: 'habilidade', desc: '25% chance de dano crítico x2', efeito: 'critico', valor: 25 },
  haki:       { nome: '⚫ Haki Armadura',       preco: 250,  tipo: 'habilidade', desc: 'Reduz dano recebido em 30%', efeito: 'armadura', valor: 30 },
  bankai:     { nome: '🌑 Bankai',              preco: 300,  tipo: 'habilidade', desc: '+50% de ataque em batalhas', efeito: 'ataque_bonus', valor: 50 },
  kamehameha: { nome: '💥 Kamehameha',          preco: 350,  tipo: 'habilidade', desc: '15% chance de knockdown (inimigo perde turno)', efeito: 'knockdown', valor: 15 },
  modo_seis:  { nome: '🔱 Modo Seis Caminhos',  preco: 500,  tipo: 'habilidade', desc: 'Todas as habilidades activas ao mesmo tempo', efeito: 'supremo' },

  // ─── PETS ──────────────────────────────
  kurama:     { nome: '🦊 Kurama',              preco: 300,  tipo: 'pet',        desc: '+30 ataque e regenera 10 vida por turno', atk: 30, regen: 10 },
  akamaru:    { nome: '🐕 Akamaru',             preco: 150,  tipo: 'pet',        desc: '+15 ataque e +20 esquiva', atk: 15, esquiva: 20 },
  happy:      { nome: '🐱 Happy',               preco: 150,  tipo: 'pet',        desc: '+20% XP em todos os jogos', xp_bonus: 20 },
  momo:       { nome: '🐦 Momo',               preco: 200,  tipo: 'pet',        desc: 'Revive 1 vez por batalha com 30% de vida', regen: 30 },
  pakkun:     { nome: '🐾 Pakkun',              preco: 200,  tipo: 'pet',        desc: '+10% pontos em todos os jogos', pts_bonus: 10 },
}

// ════════════════════════════════════════
//  VER LOJA
// ════════════════════════════════════════
async function verLoja(sock, jid, categoria = '') {
  const cats = {
    titulo:     '🏅 *TÍTULOS*',
    boost:      '💪 *BOOSTS PERMANENTES*',
    pocao:      '🧪 *POÇÕES E ESCUDOS*',
    habilidade: '⚔️ *HABILIDADES ESPECIAIS*',
    pet:        '🐾 *PETS DE ANIME*',
  }

  if (categoria && cats[categoria]) {
    let txt = `🏪 *LOJA — ${cats[categoria]}*\n\n`
    for (const [id, item] of Object.entries(ITENS)) {
      if (item.tipo.startsWith(categoria)) {
        txt += `*${item.nome}*\n💰 ${item.preco} pts | ID: \`${id}\`\n📝 ${item.desc}\n\n`
      }
    }
    txt += 'Comprar: *!comprar <id>*'
    await sock.sendMessage(jid, { text: txt })
    return
  }

  await sock.sendMessage(jid, {
    text: `🏪 *LOJA DO ANIMEBOT*\n\nEscolhe uma categoria:\n\n🏅 *!loja titulo* — Títulos (100-500 pts)\n💪 *!loja boost* — Boosts permanentes (80-150 pts)\n🧪 *!loja pocao* — Poções e escudos (40-60 pts)\n⚔️ *!loja habilidade* — Habilidades especiais (200-500 pts)\n🐾 *!loja pet* — Pets de anime (150-300 pts)\n\n🏪 *!loja tudo* — Ver tudo\n💰 Comprar: *!comprar <id>*\n\n💡 Usa *!perfil* para ver os teus pontos!`
  })
}

async function verLojaTudo(sock, jid) {
  let txt = '🏪 *LOJA COMPLETA*\n\n'
  const grupos = {
    'titulo': '🏅 TÍTULOS', 'boost': '💪 BOOSTS',
    'boost_xp': '💪 BOOSTS', 'pocao': '🧪 POÇÕES',
    'habilidade': '⚔️ HABILIDADES', 'pet': '🐾 PETS'
  }
  const vistos = new Set()
  for (const [id, item] of Object.entries(ITENS)) {
    const grupo = grupos[item.tipo] || item.tipo
    if (!vistos.has(grupo)) { txt += `\n*${grupo}*\n`; vistos.add(grupo) }
    txt += `• ${item.nome} — ${item.preco} pts (\`${id}\`)\n`
  }
  txt += '\nComprar: *!comprar <id>*'
  await sock.sendMessage(jid, { text: txt })
}

// ════════════════════════════════════════
//  COMPRAR
// ════════════════════════════════════════
async function comprar(sock, jid, nome, itemId) {
  const item = ITENS[itemId]
  if (!item) {
    await sock.sendMessage(jid, { text: `❌ Item *${itemId}* não encontrado!\nUsa *!loja* para ver os itens disponíveis.` })
    return
  }

  const { user } = getUser(nome)

  if (user.pontos < item.preco) {
    await sock.sendMessage(jid, { text: `❌ Pontos insuficientes!\nTens *${user.pontos}* pts, precisas de *${item.preco}* pts.\n\n💡 Joga *!quiz* e *!diario* para ganhar pontos!` })
    return
  }

  // Verifica duplicados para habilidades e pets
  if ((item.tipo === 'habilidade' || item.tipo === 'pet') && user.inventario?.includes(item.nome)) {
    await sock.sendMessage(jid, { text: `⚠️ Já tens *${item.nome}*!` })
    return
  }

  user.pontos -= item.preco
  if (!user.inventario) user.inventario = []

  // Aplica efeito
  switch (item.tipo) {
    case 'titulo':
      user.titulo = item.nome
      break
    case 'boost':
      if (item.atk) user.ataque = (user.ataque || 10) + item.atk
      if (item.vida) user.vida = (user.vida || 100) + item.vida
      break
    case 'boost_xp':
      user.boost_xp_ate = Date.now() + 24 * 60 * 60 * 1000
      break
    case 'pocao':
      user.inventario.push(item.nome)
      break
    case 'habilidade':
      if (!user.habilidades) user.habilidades = []
      user.habilidades.push({ id: itemId, ...item })
      user.habilidade_ativa = itemId
      user.inventario.push(item.nome)
      break
    case 'pet':
      if (!user.pets) user.pets = []
      user.pets.push({ id: itemId, ...item })
      user.pet_ativo = itemId
      if (item.atk) user.ataque = (user.ataque || 10) + item.atk
      user.inventario.push(item.nome)
      break
  }

  saveUser(nome, user)

  await sock.sendMessage(jid, {
    text: `✅ *${nome}* comprou *${item.nome}*!\n💰 Pontos restantes: ${user.pontos}\n📝 ${item.desc}`
  })
}

// ════════════════════════════════════════
//  EQUIPAR HABILIDADE
// ════════════════════════════════════════
async function equiparHabilidade(sock, jid, nome, habId) {
  const { user } = getUser(nome)
  const habs = user.habilidades || []
  const hab = habs.find(h => h.id === habId)

  if (!hab) {
    await sock.sendMessage(jid, { text: `❌ Não tens a habilidade *${habId}*!\nCompra em *!loja habilidade*` })
    return
  }

  user.habilidade_ativa = habId
  saveUser(nome, user)
  await sock.sendMessage(jid, { text: `✅ Habilidade *${hab.nome}* equipada!\n📝 ${hab.desc}` })
}

async function equiparPet(sock, jid, nome, petId) {
  const { user } = getUser(nome)
  const pets = user.pets || []
  const pet = pets.find(p => p.id === petId)

  if (!pet) {
    await sock.sendMessage(jid, { text: `❌ Não tens o pet *${petId}*!\nCompra em *!loja pet*` })
    return
  }

  user.pet_ativo = petId
  saveUser(nome, user)
  await sock.sendMessage(jid, { text: `✅ Pet *${pet.nome}* equipado!\n📝 ${pet.desc}` })
}

// ════════════════════════════════════════
//  USAR POÇÃO
// ════════════════════════════════════════
async function usarPocao(sock, jid, nome, pocaoNome) {
  const { user } = getUser(nome)
  const idx = user.inventario?.findIndex(i => i.toLowerCase().includes(pocaoNome.toLowerCase()))

  if (idx === -1 || idx === undefined) {
    await sock.sendMessage(jid, { text: `❌ Não tens essa poção! Compra em *!loja pocao*` })
    return
  }

  const nomeItem = user.inventario[idx]
  user.inventario.splice(idx, 1)

  if (nomeItem.includes('Vida')) {
    user.vida = Math.min((user.vida || 100) + 50, 200)
    await sock.sendMessage(jid, { text: `🧪 *${nome}* usou Poção de Vida!\n❤️ Vida: ${user.vida}` })
  } else if (nomeItem.includes('Força')) {
    user.ataque_temp = (user.ataque || 10) * 2
    user.ataque_temp_ate = Date.now() + 3600000
    await sock.sendMessage(jid, { text: `⚗️ *${nome}* usou Poção de Força!\n💪 Ataque dobrado por 1 hora!` })
  } else if (nomeItem.includes('Escudo')) {
    user.escudo = true
    await sock.sendMessage(jid, { text: `🛡️ *${nome}* ativou o Escudo Ninja!\n🛡️ Próximo ataque será bloqueado!` })
  }

  saveUser(nome, user)
}

module.exports = {
  verLoja, verLojaTudo, comprar,
  equiparHabilidade, equiparPet,
  usarPocao, ITENS
}
