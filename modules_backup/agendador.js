// Agendador de notificações diárias
// Envia mensagens automáticas em horários fixos

const { waifuDoDia } = require('./adivinhar')

const mensagensBomDia = [
  '☀️ *Bom dia, Otakus!*\nO dia começa com anime nas veias! Usem *!quiz* para aquecer o cérebro! 🧠',
  '🌅 *Acordaram, guerreiros?*\nNovo dia, novas batalhas! Usem *!diario* para o desafio de hoje! 🔥',
  '⛅ *Bom dia ao grupo!*\nQue hoje seja épico como um final de arco! Começa com *!waifu* 💖',
  '🌄 *Olha quem acordou!*\nHoje é dia de se destacar no *!ranking*! Vamos nessa! ⚔️',
]

const mensagensBoaNoite = [
  '🌙 *Boa noite, Otakus!*\nAntes de dormir, termina o teu *!diario* do dia! 🌟',
  '😴 *Hora de descansar...*\nMas antes, vê teu *!perfil* e planeia como subir amanhã! 📊',
  '🌃 *Boa noite ao grupo!*\nAmanhã tem novo quiz, nova waifu e novos desafios! Até lá! ✨',
]

const quizAutomatico = [
  '🎮 *HORA DO QUIZ AUTOMÁTICO!*\nUsem *!quiz* agora para ganhar XP! ⚡',
  '⚡ *BOT CHALLENGE!*\nQuem responde primeiro ao *!quiz* ganha pontos duplos (não, mentira, mas é divertido)! 😄',
  '🏆 *QUIZ TIME!*\nDisputa o topo do *!ranking* agora! Usem *!quiz*! 🎯',
]

function aleatorio(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function agendarNotificacoes(sock, jid) {
  // Verifica a cada minuto se é hora de enviar algo
  setInterval(async () => {
    const agora = new Date()
    const h = agora.getHours()
    const m = agora.getMinutes()

    // Bom dia — 08:00
    if (h === 8 && m === 0) {
      await sock.sendMessage(jid, { text: aleatorio(mensagensBomDia) })
    }

    // Waifu do dia — 10:00
    if (h === 10 && m === 0) {
      await waifuDoDia(sock, jid)
    }

    // Quiz automático — 12:00
    if (h === 12 && m === 0) {
      await sock.sendMessage(jid, { text: aleatorio(quizAutomatico) })
    }

    // Lembrete de ranking — 15:00
    if (h === 15 && m === 0) {
      await sock.sendMessage(jid, {
        text: `📊 *ATUALIZAÇÃO DE RANKING!*\nVê onde estás com *!ranking*!\nAinda dá tempo de subir hoje! 🔥`
      })
    }

    // Quiz da tarde — 18:00
    if (h === 18 && m === 0) {
      await sock.sendMessage(jid, { text: aleatorio(quizAutomatico) })
    }

    // Boa noite — 22:00
    if (h === 22 && m === 0) {
      await sock.sendMessage(jid, { text: aleatorio(mensagensBoaNoite) })
    }

  }, 60000) // Verifica a cada 60 segundos

  console.log(`🕐 Agendador ativado para o grupo: ${jid}`)
}

module.exports = { agendarNotificacoes }