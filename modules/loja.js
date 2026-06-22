const { getUser, saveUser } = require('../db')

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

  // ─── POÇÕES DE RANK (MUITO CARAS) ──────
  pocao_rank_d: { nome: '🧪 Poção Rank D', preco: 500,  tipo: 'pocao_rank', desc: 'Sobe diretamente para Rank D (precisa ser Rank E)', rank: 'D', requer: 'E' },
  pocao_rank_c: { nome: '🧪 Poção Rank C', preco: 1200, tipo: 'pocao_rank', desc: 'Sobe diretamente para Rank C (precisa ser Rank D)', rank: 'C', requer: 'D' },
  pocao_rank_b: { nome: '🧪 Poção Rank B', preco: 2500, tipo: 'pocao_rank', desc: 'Sobe diretamente para Rank B (precisa ser Rank C)', rank: 'B', requer: 'C' },

  // ─── HABILIDADES CLÁSSICAS ─────────────
  sharingan:  { nome: '👁️ Sharingan',           preco: 200,  tipo: 'habilidade', desc: '20% chance de esquivar ataques', efeito: 'esquiva', valor: 20 },
  rasengan:   { nome: '🌀 Rasengan',            preco: 200,  tipo: 'habilidade', desc: '25% chance de dano crítico x2', efeito: 'critico', valor: 25 },
  haki:       { nome: '⚫ Haki Armadura',       preco: 250,  tipo: 'habilidade', desc: 'Reduz dano recebido em 30%', efeito: 'armadura', valor: 30 },
  bankai:     { nome: '🌑 Bankai',              preco: 300,  tipo: 'habilidade', desc: '+50% de ataque em batalhas', efeito: 'ataque_bonus', valor: 50 },
  kamehameha: { nome: '💥 Kamehameha',          preco: 350,  tipo: 'habilidade', desc: '15% chance de knockdown (inimigo perde turno)', efeito: 'knockdown', valor: 15 },
  modo_seis:  { nome: '🔱 Modo Seis Caminhos',  preco: 500,  tipo: 'habilidade', desc: 'Todas as habilidades activas ao mesmo tempo', efeito: 'supremo' },

  // ─── PODERES DO NEXUS (ATAQUE) ──────────
  onda_espiritual:     { nome: '🌊 Onda Espiritual', preco: 350, tipo: 'habilidade', desc: '30% chance de dano em área', efeito: 'area', valor: 30 },
  golpe_do_vazio:      { nome: '🕳️ Golpe do Vazio', preco: 400, tipo: 'habilidade', desc: '20% chance de ignorar defesa', efeito: 'ignorar_defesa', valor: 20 },
  lamina_nexus:        { nome: '⚔️ Lâmina do Nexus', preco: 450, tipo: 'habilidade', desc: '+40% dano, 10% chance de sangramento', efeito: 'sangramento', valor: 40 },
  colera_dos_pilares:  { nome: '🔥 Cólera dos Pilares', preco: 500, tipo: 'habilidade', desc: '15% chance de ataque duplo', efeito: 'ataque_duplo', valor: 15 },
  rugido_do_dragao:    { nome: '🐉 Rugido do Dragão', preco: 550, tipo: 'habilidade', desc: '+50% dano, 25% chance de atordoar', efeito: 'atordoar', valor: 50 },

  // ─── PODERES DO NEXUS (DEFESA) ──────────
  manto_espiritual:    { nome: '🌀 Manto Espiritual', preco: 350, tipo: 'habilidade', desc: 'Reduz dano em 40% por 2 turnos', efeito: 'reduzir_dano', valor: 40 },
  barreira_do_vazio:   { nome: '🌑 Barreira do Vazio', preco: 400, tipo: 'habilidade', desc: '30% chance de anular ataque', efeito: 'anular', valor: 30 },
  escudo_dos_pilares:  { nome: '🛡️ Escudo dos Pilares', preco: 450, tipo: 'habilidade', desc: 'Bloqueia e reflete 25% do dano', efeito: 'refletir', valor: 25 },
  regeneracao_nexus:   { nome: '💚 Regeneração do Nexus', preco: 500, tipo: 'habilidade', desc: 'Regenera 15% da vida por 3 turnos', efeito: 'regenerar', valor: 15 },
  armadura_do_criador: { nome: '⚜️ Armadura do Criador', preco: 600, tipo: 'habilidade', desc: 'Reduz dano em 50% por 3 turnos', efeito: 'armadura_suprema', valor: 50 },

  // ─── PODERES DO NEXUS (ESPECIAIS) ───────
  visao_do_vazio:      { nome: '👁️ Visão do Vazio', preco: 400, tipo: 'habilidade', desc: 'Revela fraqueza (+25% dano no próximo ataque)', efeito: 'revelar_fraqueza', valor: 25 },
  bencao_dos_pilares:  { nome: '🌟 Benção dos Pilares', preco: 450, tipo: 'habilidade', desc: 'Cura 30% da vida e remove efeitos', efeito: 'purificar', valor: 30 },
  toque_do_criador:    { nome: '🖐️ Toque do Criador', preco: 500, tipo: 'habilidade', desc: '10% chance de insta-kill (masmorra)', efeito: 'insta_kill', valor: 10 },
  danca_das_sombras:   { nome: '🌑 Dança das Sombras', preco: 350, tipo: 'habilidade', desc: 'Aumenta esquiva em 40% por 2 turnos', efeito: 'esquiva_boost', valor: 40 },
  furor_do_nexus:      { nome: '⚡ Furor do Nexus', preco: 550, tipo: 'habilidade', desc: '+100% ataque por 1 turno, -50% defesa', efeito: 'furor', valor: 100 },

  // ─── PETS ──────────────────────────────
  kurama:     { nome: '🦊 Kurama',              preco: 300,  tipo: 'pet',        desc: '+30 ataque e regenera 10 vida por turno', atk: 30, regen: 10 },
  akamaru:    { nome: '🐕 Akamaru',             preco: 150,  tipo: 'pet',        desc: '+15 ataque e +20 esquiva', atk: 15, esquiva: 20 },
  happy:      { nome: '🐱 Happy',               preco: 150,  tipo: 'pet',        desc: '+20% XP em todos os jogos', xp_bonus: 20 },
  momo:       { nome: '🐦 Momo',               preco: 200,  tipo: 'pet',        desc: 'Revive 1 vez por batalha com 30% de vida', regen: 30 },
  pakkun:     { nome: '🐾 Pakkun',              preco: 200,  tipo: 'pet',        desc: '+10% pontos em todos os jogos', pts_bonus: 10 },

  // ─── FRAGMENTOS (apenas recompensas) ────
  fragmento_sabedoria: { nome: '📜 Fragmento de Sabedoria', preco: 0, tipo: 'fragmento', desc: 'Concede 50 XP ao ser usado.', xp: 50, compravel: false },
  fragmento_poder:     { nome: '💎 Fragmento de Poder', preco: 0, tipo: 'fragmento', desc: 'Aumenta o ataque em +5 permanentemente.', atk: 5, compravel: false },
  fragmento_gloria:    { nome: '🏆 Fragmento de Glória', preco: 0, tipo: 'fragmento', desc: 'Concede 100 pontos.', pontos: 100, compravel: false },
  fragmento_cacador:   { nome: '💀 Fragmento do Caçador', preco: 0, tipo: 'fragmento', desc: 'Regenera vida total na próxima masmorra.', vida: 999, compravel: false },
  fragmento_riqueza:   { nome: '💰 Fragmento de Riqueza', preco: 0, tipo: 'fragmento', desc: 'Dobra os pontos ganhos por 24h.', boost_pontos: true, compravel: false },
  fragmento_elite:     { nome: '🌟 Fragmento da Elite', preco: 0, tipo: 'fragmento', desc: 'Aumenta o nível do rank em 1.', nivel_rank: 1, compravel: false },
  fragmento_lider:     { nome: '🛡️ Fragmento do Líder', preco: 0, tipo: 'fragmento', desc: 'Concede +10 de vida permanente.', vida: 10, compravel: false },
  fragmento_lore:      { nome: '📖 Fragmento da Lore', preco: 0, tipo: 'fragmento', desc: 'Desbloqueia uma habilidade especial.', habilidade: 'visao_do_vazio', compravel: false },
  coroa_do_nexus:      { nome: '👑 Coroa do Nexus', preco: 0, tipo: 'lendario', desc: 'O item mais raro do Nexus World. Concede +50 ataque e +100 vida.', atk: 50, vida: 100, compravel: false },

  // ─── PEDRAS ELEMENTAIS ────────────────
  pedra_fogo:     { nome: '🔥 Pedra de Fogo', preco: 200, tipo: 'elemental', desc: 'Aumenta a afinidade com Fogo em +2.', elemento: 'fogo', afinidade: 2 },
  pedra_agua:     { nome: '💧 Pedra de Água', preco: 200, tipo: 'elemental', desc: 'Aumenta a afinidade com Água em +2.', elemento: 'agua', afinidade: 2 },
  pedra_natureza: { nome: '🌿 Pedra de Natureza', preco: 200, tipo: 'elemental', desc: 'Aumenta a afinidade com Natureza em +2.', elemento: 'natureza', afinidade: 2 },
  pedra_trovao:   { nome: '⚡ Pedra de Trovão', preco: 200, tipo: 'elemental', desc: 'Aumenta a afinidade com Trovão em +2.', elemento: 'trovão', afinidade: 2 },
  pedra_terra:    { nome: '🪨 Pedra de Terra', preco: 200, tipo: 'elemental', desc: 'Aumenta a afinidade com Terra em +2.', elemento: 'terra', afinidade: 2 },
  pedra_trevas:   { nome: '🌑 Pedra de Trevas', preco: 200, tipo: 'elemental', desc: 'Aumenta a afinidade com Trevas em +2.', elemento: 'trevas', afinidade: 2 },
  pedra_luz:      { nome: '✨ Pedra de Luz', preco: 200, tipo: 'elemental', desc: 'Aumenta a afinidade com Luz em +2.', elemento: 'luz', afinidade: 2 },
}

// ════════════════════════════════════════
//  VER LOJA
// ════════════════════════════════════════
async function verLoja(sock, jid, categoria) {
  if (!categoria) categoria = ''

  const cats = {
    titulo:     '🏅 *TÍTULOS*',
    boost:      '💪 *BOOSTS PERMANENTES*',
    pocao:      '🧪 *POÇÕES E ESCUDOS*',
    pocao_rank: '⚗️ *POÇÕES DE RANK*',
    habilidade: '⚔️ *HABILIDADES ESPECIAIS*',
    pet:        '🐾 *PETS DE ANIME*',
    elemental:  '🔮 *PEDRAS ELEMENTAIS*',
  }

  if (categoria && cats[categoria]) {
    let txt = '🏪 *LOJA — ' + cats[categoria] + '*\n\n'
    for (const [id, item] of Object.entries(ITENS)) {
      if (item.tipo === categoria || (categoria === 'pocao' && item.tipo === 'pocao_rank')) {
        if (item.compravel === false) continue
        txt += '*' + item.nome + '*\n💰 ' + item.preco + ' pts | ID: `' + id + '`\n📝 ' + item.desc + '\n\n'
      }
    }
    txt += 'Comprar: *!comprar <id>*'
    await sock.sendMessage(jid, { text: txt })
    return
  }

  await sock.sendMessage(jid, {
    text: '🏪 *LOJA DO NEXUS WORLD*\n\nEscolhe uma categoria:\n\n🏅 *!loja titulo* — Títulos (100-500 pts)\n💪 *!loja boost* — Boosts permanentes (80-150 pts)\n🧪 *!loja pocao* — Poções e escudos (40-2500 pts)\n⚗️ *!loja pocao_rank* — Poções de Rank (500-2500 pts)\n⚔️ *!loja habilidade* — Habilidades e Poderes (200-600 pts)\n🐾 *!loja pet* — Pets de anime (150-300 pts)\n🔮 *!loja elemental* — Pedras elementais (200 pts)\n\n🏪 *!loja tudo* — Ver tudo\n💰 Comprar: *!comprar <id>*\n\n💡 Usa *!perfil* para ver os teus pontos!'
  })
}

async function verLojaTudo(sock, jid) {
  let txt = '🏪 *LOJA COMPLETA DO NEXUS WORLD*\n\n'
  const grupos = {
    'titulo': '🏅 TÍTULOS', 'boost': '💪 BOOSTS',
    'boost_xp': '💪 BOOSTS', 'pocao': '🧪 POÇÕES',
    'pocao_rank': '⚗️ POÇÕES DE RANK', 'habilidade': '⚔️ HABILIDADES E PODERES',
    'pet': '🐾 PETS', 'elemental': '🔮 PEDRAS ELEMENTAIS'
  }
  const vistos = new Set()
  for (const [id, item] of Object.entries(ITENS)) {
    if (item.compravel === false) continue
    const grupo = grupos[item.tipo] || item.tipo
    if (!vistos.has(grupo)) { txt += '\n*' + grupo + '*\n'; vistos.add(grupo) }
    txt += '• ' + item.nome + ' — ' + item.preco + ' pts (`' + id + '`)\n'
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
    await sock.sendMessage(jid, { text: '❌ Item *' + itemId + '* não encontrado!\nUsa *!loja* para ver os itens disponíveis.' })
    return
  }

  if (item.compravel === false) {
    await sock.sendMessage(jid, { text: '🔒 Este item não pode ser comprado! É obtido através de conquistas.' })
    return
  }

  const user = getUser(nome)

  if ((user.pontos || 0) < item.preco) {
    await sock.sendMessage(jid, { text: '❌ Pontos insuficientes!\nTens *' + (user.pontos || 0) + '* pts, precisas de *' + item.preco + '* pts.\n\n💡 Joga *!quiz* e *!diario* para ganhar pontos!' })
    return
  }

  if (item.tipo === 'pocao_rank') {
    if (user.rank !== item.requer) {
      await sock.sendMessage(jid, { text: '❌ Precisas ser Rank *' + item.requer + '* para usar esta poção! Seu rank atual: *' + (user.rank || 'E') + '*' })
      return
    }
  }

  if ((item.tipo === 'habilidade' || item.tipo === 'pet') && user.inventario && user.inventario.includes(item.nome)) {
    await sock.sendMessage(jid, { text: '⚠️ Já tens *' + item.nome + '*!' })
    return
  }

  if (item.tipo === 'elemental') {
    const afinidadeAtual = user.afinidade && user.afinidade[item.elemento] ? user.afinidade[item.elemento] : 0
    if (afinidadeAtual >= 10) {
      await sock.sendMessage(jid, { text: '❌ Já atingiste o nível máximo de afinidade (10) com *' + item.elemento + '*!' })
      return
    }
  }

  user.pontos = (user.pontos || 0) - item.preco
  if (!user.inventario) user.inventario = []

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
    case 'pocao_rank':
      const xpNecessario = { D: 200, C: 500, B: 1000 }
      user.xp_rank = xpNecessario[item.rank] || 200
      user.rank = item.rank
      user.titulo_rank = 'Caçador Rank ' + item.rank
      user.nivel_rank = 1
      break
    case 'habilidade':
      if (!user.habilidades) user.habilidades = []
      user.habilidades.push({ id: itemId, nome: item.nome, desc: item.desc })
      user.habilidade_ativa = itemId
      user.inventario.push(item.nome)
      break
    case 'pet':
      if (!user.pets) user.pets = []
      user.pets.push({ id: itemId, nome: item.nome, desc: item.desc })
      user.pet_ativo = itemId
      if (item.atk) user.ataque = (user.ataque || 10) + item.atk
      user.inventario.push(item.nome)
      break
    case 'elemental':
      if (!user.afinidade) user.afinidade = {}
      user.afinidade[item.elemento] = (user.afinidade[item.elemento] || 0) + item.afinidade
      user.inventario.push(item.nome)
      break
  }

  saveUser(nome, user)

  await sock.sendMessage(jid, {
    text: '✅ *' + nome + '* comprou *' + item.nome + '*!\n💰 Pontos restantes: ' + (user.pontos || 0) + '\n📝 ' + item.desc
  })
}

async function equiparHabilidade(sock, jid, nome, habId) {
  const user = getUser(nome)
  const habs = user.habilidades || []
  const hab = habs.find(h => h.id === habId)

  if (!hab) {
    await sock.sendMessage(jid, { text: '❌ Não tens a habilidade *' + habId + '*!\nCompra em *!loja habilidade*' })
    return
  }

  user.habilidade_ativa = habId
  saveUser(nome, user)
  await sock.sendMessage(jid, { text: '✅ Habilidade *' + hab.nome + '* equipada!\n📝 ' + hab.desc })
}

async function equiparPet(sock, jid, nome, petId) {
  const user = getUser(nome)
  const pets = user.pets || []
  const pet = pets.find(p => p.id === petId)

  if (!pet) {
    await sock.sendMessage(jid, { text: '❌ Não tens o pet *' + petId + '*!\nCompra em *!loja pet*' })
    return
  }

  user.pet_ativo = petId
  saveUser(nome, user)
  await sock.sendMessage(jid, { text: '✅ Pet *' + pet.nome + '* equipado!\n📝 ' + pet.desc })
}

async function usarPocao(sock, jid, nome, pocaoNome) {
  const user = getUser(nome)
  const idx = user.inventario ? user.inventario.findIndex(i => i.toLowerCase().includes(pocaoNome.toLowerCase())) : -1

  if (idx === -1 || idx === undefined) {
    await sock.sendMessage(jid, { text: '❌ Não tens essa poção! Compra em *!loja pocao*' })
    return
  }

  const nomeItem = user.inventario[idx]
  user.inventario.splice(idx, 1)

  if (nomeItem.includes('Vida')) {
    user.vida = Math.min((user.vida || 100) + 50, 200)
    await sock.sendMessage(jid, { text: '🧪 *' + nome + '* usou Poção de Vida!\n❤️ Vida: ' + user.vida })
  } else if (nomeItem.includes('Força')) {
    user.ataque_temp = (user.ataque || 10) * 2
    user.ataque_temp_ate = Date.now() + 3600000
    await sock.sendMessage(jid, { text: '⚗️ *' + nome + '* usou Poção de Força!\n💪 Ataque dobrado por 1 hora!' })
  } else if (nomeItem.includes('Escudo')) {
    user.escudo = true
    await sock.sendMessage(jid, { text: '🛡️ *' + nome + '* ativou o Escudo Ninja!\n🛡️ Próximo ataque será bloqueado!' })
  }

  saveUser(nome, user)
}

module.exports = {
  verLoja, verLojaTudo, comprar,
  equiparHabilidade, equiparPet,
  usarPocao, ITENS
}
