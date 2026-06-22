const { getUser, saveUser } = require('../db')

// ════════════════════════════════════════
//  RECEITAS DE CRAFTING
// ════════════════════════════════════════

const RECEITAS = {
  espada_nexus: {
    nome: '⚔️ Espada do Nexus',
    desc: 'Uma lâmina forjada com o poder dos Pilares.',
    materiais: { fragmento_poder: 3 },
    efeito: { atk: 25 }
  },
  escudo_pilares: {
    nome: '🛡️ Escudo dos Pilares',
    desc: 'Proteção ancestral dos guardiões do Nexus.',
    materiais: { fragmento_lider: 3 },
    efeito: { vida: 30 }
  },
  anel_vazio: {
    nome: '💍 Anel do Vazio',
    desc: 'Contém a essência do próprio Vazio.',
    materiais: { fragmento_sabedoria: 3 },
    efeito: { xp: 100 }
  },
  coroa_elemental: {
    nome: '👑 Coroa Elemental',
    desc: 'Harmoniza os elementos Fogo e Água.',
    materiais: { pedra_fogo: 2, pedra_agua: 1 },
    efeito: { afinidade_fogo: 5, afinidade_agua: 5 }
  },
  colar_eternidade: {
    nome: '📿 Colar da Eternidade',
    desc: 'Concede regeneração contínua em batalha.',
    materiais: { fragmento_cacador: 3 },
    efeito: { regen: 5 }
  },
  medalha_criador: {
    nome: '⚜️ Medalha do Criador',
    desc: 'A honraria máxima do Nexus World.',
    materiais: { coroa_do_nexus: 1, fragmento_elite: 2 },
    efeito: { atk: 50, vida: 100, nivel_rank: 2 }
  }
}

// ════════════════════════════════════════
//  CRAFTAR ARTEFATO
// ════════════════════════════════════════
async function craftar(sock, jid, nome, artefatoId) {
  const receita = RECEITAS[artefatoId]
  if (!receita) {
    const lista = Object.entries(RECEITAS).map(([id, r]) => '• `' + id + '` - ' + r.nome).join('\n')
    await sock.sendMessage(jid, { text: '❌ Receita não encontrada!\n\nReceitas disponíveis:\n' + lista + '\n\nUse *!craftar <id>* para criar.' })
    return
  }

  const user = getUser(nome)
  if (!user.despertou) {
    await sock.sendMessage(jid, { text: '🌌 Você ainda não despertou no Nexus World!' })
    return
  }

  // Verifica se tem os materiais
  const inventario = user.inventario || []
  const materiaisFaltantes = []

  for (const [material, quantidade] of Object.entries(receita.materiais)) {
    const tem = inventario.filter(i => i === material).length
    if (tem < quantidade) {
      materiaisFaltantes.push(material + ' (' + (quantidade - tem) + ' faltando)')
    }
  }

  if (materiaisFaltantes.length > 0) {
    await sock.sendMessage(jid, { text: '❌ Materiais insuficientes!\n\nFaltando:\n' + materiaisFaltantes.join('\n') })
    return
  }

  // Remove os materiais do inventário
  for (const [material, quantidade] of Object.entries(receita.materiais)) {
    for (let i = 0; i < quantidade; i++) {
      const idx = inventario.indexOf(material)
      if (idx !== -1) inventario.splice(idx, 1)
    }
  }

  // Adiciona o artefato
  if (!user.artefatos) user.artefatos = []
  user.artefatos.push({ id: artefatoId, nome: receita.nome, desc: receita.desc })

  // Aplica os efeitos
  const efeitos = receita.efeito
  if (efeitos.atk) user.ataque = (user.ataque || 10) + efeitos.atk
  if (efeitos.vida) user.vida = (user.vida || 100) + efeitos.vida
  if (efeitos.xp) user.xp = (user.xp || 0) + efeitos.xp
  if (efeitos.afinidade_fogo) {
    if (!user.afinidade) user.afinidade = {}
    user.afinidade['fogo'] = (user.afinidade['fogo'] || 0) + efeitos.afinidade_fogo
  }
  if (efeitos.afinidade_agua) {
    if (!user.afinidade) user.afinidade = {}
    user.afinidade['agua'] = (user.afinidade['agua'] || 0) + efeitos.afinidade_agua
  }
  if (efeitos.nivel_rank) {
    user.nivel_rank = (user.nivel_rank || 1) + efeitos.nivel_rank
  }
  if (efeitos.regen) {
    user.regen = efeitos.regen
  }

  user.inventario = inventario
  saveUser(nome, user)

  await sock.sendMessage(jid, {
    text: '💎 *CRAFTING CONCLUÍDO!*\n\n' + receita.nome + '\n📝 ' + receita.desc + '\n\n' + 'Efeitos aplicados permanentemente! Use *!perfil* para ver as mudanças.'
  })
}

// ════════════════════════════════════════
//  VER RECEITAS
// ════════════════════════════════════════
async function verReceitas(sock, jid) {
  let txt = '💎 *RECEITAS DE CRAFTING*\n\n'
  for (const [id, receita] of Object.entries(RECEITAS)) {
    txt += '*' + receita.nome + '*\n'
    txt += '📝 ' + receita.desc + '\n'
    txt += '🧱 Materiais:\n'
    for (const [mat, qtd] of Object.entries(receita.materiais)) {
      txt += '   • ' + qtd + 'x ' + mat + '\n'
    }
    txt += '🔑 ID: `' + id + '`\n\n'
  }
  txt += 'Use *!craftar <id>* para criar um artefato!'

  await sock.sendMessage(jid, { text: txt })
}

module.exports = {
  craftar,
  verReceitas
}
