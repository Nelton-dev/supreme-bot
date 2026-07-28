const { todosUsuarios } = require('../db')

// ════════════════════════════════════════
//  HALL DA FAMA
// ════════════════════════════════════════

async function verHallFama(sock, jid) {
  const db = todosUsuarios()
  const sorted = Object.entries(db)
    .filter(([_, u]) => u.despertou)
    .sort((a, b) => b[1].xp - a[1].xp)
    .slice(0, 10)

  if (sorted.length === 0) {
    await sock.sendMessage(jid, { text: '🏅 Nenhum Caçador no Hall da Fama ainda!' })
    return
  }

  const medals = ['👑', '🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']
  const titulosHall = [
    'Lenda Suprema do Nexus',
    'Guardião Imortal',
    'Herói Lendário',
    'Mestre Caçador',
    'Veterano de Guerra',
    'Estrategista',
    'Sentinela',
    'Protetor',
    'Defensor',
    'Iniciado'
  ]

  let txt = '🏅 *HALL DA FAMA DO NEXUS WORLD* 🏅\n\nOs maiores Caçadores do ciclo são lembrados pelas eras.\n\n'
  txt += '═══ *Os Maiores Caçadores* ═══\n\n'

  sorted.forEach(([nome, dados], i) => {
    const rank = dados.rank || 'E'
    const titulo = dados.titulo || 'Sem título'
    const xp = dados.xp || 0

    txt += medals[i] + ' *' + nome + '*\n'
    txt += '   🌌 Rank: ' + rank + ' | ⭐ XP: ' + xp.toLocaleString() + '\n'
    txt += '   🏅 ' + titulo + '\n'
    txt += '   💫 ' + titulosHall[i] + '\n\n'
  })

  txt += '═══ *Lendas Eternas* ═══\n\n'
  txt += 'Continue a sua jornada para entrar no Hall da Fama!'

  await sock.sendMessage(jid, { text: txt })
}

module.exports = {
  verHallFama
}
