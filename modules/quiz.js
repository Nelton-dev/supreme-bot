const { getUser, saveUser } = require('../db')

const perguntas = [
  // ── Naruto ──
  { q: "Qual é o nome completo do Naruto?", r: "naruto uzumaki", dica: "Clã Uzumaki..." },
  { q: "Quem é o sensei do time 7?", r: "kakashi", dica: "Kakashi H..." },
  { q: "Qual é o olho especial do Sasuke?", r: "sharingan", dica: "É um dojutsu..." },
  { q: "Qual técnica proibida Itachi usa para aprisionar a mente?", r: "izanami", dica: "Genjutsu eterno..." },
  { q: "Qual é o nome da raposa de 9 caudas dentro de Naruto?", r: "kurama", dica: "Kyuubi..." },
  { q: "Qual aldeia Naruto protege?", r: "folha", dica: "Konohagakure..." },
  { q: "Qual é o nome do pai de Naruto?", r: "minato", dica: "Quarto Hokage..." },

  // ── One Piece ──
  { q: "Quem é o rei dos piratas em One Piece?", r: "roger", dica: "Gold D. ..." },
  { q: "Qual devil fruit o Luffy comeu?", r: "gomu gomu", dica: "Fruta da borracha..." },
  { q: "Quem matou Ace em One Piece?", r: "akainu", dica: "Um almirante da marinha..." },
  { q: "Qual é o sonho de Zoro?", r: "melhor espadachim", dica: "Quer ser o número 1..." },
  { q: "Como se chama o navio da tripulação de Luffy?", r: "thousand sunny", dica: "Sol de mil..." },
  { q: "Qual é o apelido de Luffy?", r: "chapéu de palha", dica: "Straw Hat..." },
  { q: "Quem é o médico da tripulação de Luffy?", r: "chopper", dica: "É um rena..." },

  // ── Dragon Ball ──
  { q: "Qual é o poder do Goku?", r: "ki", dica: "É uma energia interna..." },
  { q: "Qual é o nome da transformação dourada do Goku?", r: "super saiyajin", dica: "Cabelo fica loiro..." },
  { q: "Quem treinou Goku quando criança?", r: "mestre kame", dica: "Velhinho pervertido..." },
  { q: "Qual é a técnica mais famosa do Goku?", r: "kamehameha", dica: "Ka-me-ha-me..." },
  { q: "Qual é o nome do filho mais velho do Goku?", r: "gohan", dica: "Estuda muito..." },

  // ── Attack on Titan ──
  { q: "Qual anime tem o personagem Levi Ackerman?", r: "attack on titan", dica: "Shingeki no..." },
  { q: "Qual é o sobrenome de Eren?", r: "yeager", dica: "Eren Y..." },
  { q: "O que há dentro das paredes em AoT?", r: "titãs", dica: "Grandes criaturas..." },
  { q: "Qual é o nome do titã colossal no início?", r: "bertholdt", dica: "Um dos guerreiros..." },
  { q: "Qual é a habilidade especial de Eren?", r: "titã ataque", dica: "Attack Titan..." },

  // ── Bleach ──
  { q: "Qual anime tem espadas chamadas Zanpakutō?", r: "bleach", dica: "Soul Reaper..." },
  { q: "Qual é o nome do protagonista de Bleach?", r: "ichigo", dica: "Laranja..." },
  { q: "Como se chama a forma final da zanpakutō?", r: "bankai", dica: "Ban..." },
  { q: "Qual é o poder do Aizen?", r: "ilusão completa", dica: "Kyōka Suigetsu..." },

  // ── Death Note ──
  { q: "Qual é o codinome de Light Yagami?", r: "kira", dica: "Deus em japonês..." },
  { q: "Quem é o detetive que persegue Kira?", r: "l", dica: "Usa poucas letras..." },
  { q: "Como se chama o shinigami de Light?", r: "ryuk", dica: "Ama maçãs..." },

  // ── Hunter x Hunter ──
  { q: "Qual anime tem o Nen como sistema de poderes?", r: "hunter x hunter", dica: "HxH..." },
  { q: "Qual é o nome completo de Gon?", r: "gon freecss", dica: "Filho de Ging..." },
  { q: "Qual é o poder de Killua?", r: "eletricidade", dica: "Godspeed..." },
  { q: "Quem é o vilão mais poderoso de HxH?", r: "meruem", dica: "Rei das formigas..." },

  // ── Demon Slayer ──
  { q: "Qual é o nome do protagonista de Demon Slayer?", r: "tanjiro", dica: "Tanjiro K..." },
  { q: "O que Nezuko se tornou?", r: "demônio", dica: "Kimetsu no Yaiba..." },
  { q: "Qual é a respiração mais rara em Demon Slayer?", r: "sol", dica: "Hinokami..." },

  // ── My Hero Academia ──
  { q: "Qual é o apelido de Izuku Midoriya?", r: "deku", dica: "Significa inútil..." },
  { q: "Qual é o quirk de All Might?", r: "one for all", dica: "Passado de geração..." },
  { q: "Quem é o vilão principal de MHA?", r: "all for one", dica: "Rouba quirks..." },

  // ── Outros ──
  { q: "Em qual anime aparece a Megumin?", r: "konosuba", dica: "Kono Subarashii..." },
  { q: "Qual é o poder de Saitama?", r: "soco supremo", dica: "One Punch..." },
  { q: "Qual anime tem o personagem Satoru Gojo?", r: "jujutsu kaisen", dica: "JJK..." },
  { q: "Qual é o poder de Gojo?", r: "infinito", dica: "Limitless..." },
  { q: "Qual anime tem espadachins que lutam contra demônios com respiração?", r: "demon slayer", dica: "Kimetsu no..." },
  { q: "Qual é o nome do titan de Eren que tem poderes do futuro?", r: "titan ataque", dica: "Attack Titan..." },
  { q: "Qual é a organização criminosa em Naruto?", r: "akatsuki", dica: "Capas pretas com nuvens..." },
  { q: "Qual anime é ambientado em Tartarus?", r: "fairy tail", dica: "Magia e guildas..." },
]

const NIVEIS = [
  { nivel: 1, titulo: 'Novato', xpMin: 0 },
  { nivel: 2, titulo: 'Iniciante', xpMin: 50 },
  { nivel: 3, titulo: 'Genin do Anime', xpMin: 150 },
  { nivel: 4, titulo: 'Chunin Otaku', xpMin: 300 },
  { nivel: 5, titulo: 'Jonin Nerd', xpMin: 500 },
  { nivel: 6, titulo: 'Sannin do Grupo', xpMin: 800 },
  { nivel: 7, titulo: 'Kage Supremo', xpMin: 1200 },
  { nivel: 8, titulo: 'Hokage Otaku', xpMin: 1800 },
  { nivel: 9, titulo: 'Deus do Anime', xpMin: 2500 },
]

let ativo = null
let timeout = null
const usadas = new Set()

function proxPergunta() {
  if (usadas.size >= perguntas.length) usadas.clear()
  let p
  do { p = perguntas[Math.floor(Math.random() * perguntas.length)] } while (usadas.has(p.r))
  usadas.add(p.r)
  return p
}

function calcularNivel(xp) {
  let atual = NIVEIS[0]
  for (const n of NIVEIS) { if (xp >= n.xpMin) atual = n }
  return atual
}

async function iniciarQuiz(sock, jid) {
  if (ativo) {
    await sock.sendMessage(jid, { text: '⏳ Já há um quiz ativo! Respondam primeiro.' })
    return
  }
  const p = proxPergunta()
  ativo = { ...p, jid }
  await sock.sendMessage(jid, {
    text: `🎮 *QUIZ DE ANIME!*\n\n❓ ${p.q}\n\n💡 Dica: ${p.dica}\n\n⏱️ Tens 30 segundos!`
  })
  timeout = setTimeout(async () => {
    if (ativo) {
      await sock.sendMessage(jid, { text: `⏰ Tempo esgotado!\nA resposta era: *${p.r.toUpperCase()}*` })
      ativo = null
    }
  }, 30000)
}

async function verificarResposta(sock, jid, texto, nome) {
  if (!ativo || ativo.jid !== jid) return false
  if (texto !== ativo.r) return false
  clearTimeout(timeout)
  const { user } = getUser(nome)
  const xpGanho = 20, ptosGanho = 15
  user.xp += xpGanho
  user.pontos += ptosGanho
  const novoNivel = calcularNivel(user.xp)
  let subiu = ''
  if (novoNivel.nivel > user.nivel) {
    user.nivel = novoNivel.nivel
    user.titulo = novoNivel.titulo
    subiu = `\n🆙 *SUBIU DE NÍVEL!* Agora és *${novoNivel.titulo}* (Nível ${novoNivel.nivel})`
  }
  saveUser(nome, user)
  await sock.sendMessage(jid, {
    text: `✅ *${nome}* acertou!\n+${xpGanho} XP | +${ptosGanho} pontos 🎉${subiu}\n\n📊 XP: ${user.xp} | Nível ${user.nivel}`
  })
  ativo = null
  return true
}

async function verPerfil(sock, jid, nome) {
  const { user } = getUser(nome)
  const barra = '█'.repeat(Math.min(user.nivel, 10)) + '░'.repeat(10 - Math.min(user.nivel, 10))
  await sock.sendMessage(jid, {
    text: `👤 *Perfil de ${nome}*\n\n🏅 Título: ${user.titulo}\n⭐ Nível: ${user.nivel}\n✨ XP: ${user.xp}\n💰 Pontos: ${user.pontos}\n⚔️ Ataque: ${user.ataque}\n❤️ Vida: ${user.vida}\n🏆 Vitórias: ${user.vitorias}\n🎒 Itens: ${user.inventario.length > 0 ? user.inventario.join(', ') : 'Nenhum'}\n\nNível: [${barra}]`
  })
}

module.exports = { iniciarQuiz, verificarResposta, verPerfil }