const { getUser, saveUser } = require('../db')

// ════════════════════════════════════════
//  JOGO DA FORCA
// ════════════════════════════════════════
const PALAVRAS_FORCA = [
  { palavra: 'naruto', dica: 'Personagem 🍜' },
  { palavra: 'bleach', dica: 'Anime de Soul Reapers' },
  { palavra: 'sharingan', dica: 'Olho especial do Sasuke' },
  { palavra: 'kamehameha', dica: 'Técnica do Goku' },
  { palavra: 'akatsuki', dica: 'Organização criminosa de Naruto' },
  { palavra: 'bankai', dica: 'Forma final da zanpakutō' },
  { palavra: 'rasengan', dica: 'Técnica do Naruto' },
  { palavra: 'shinigami', dica: 'Ceifador de almas' },
  { palavra: 'hokage', dica: 'Líder da aldeia da folha' },
  { palavra: 'mangekyo', dica: 'Forma avançada do sharingan' },
  { palavra: 'kurama', dica: 'Raposa de nove caudas' },
  { palavra: 'zanpakuto', dica: 'Espada dos Soul Reapers' },
  { palavra: 'gomugomu', dica: 'Devil fruit do Luffy' },
  { palavra: 'espada', dica: 'Arma favorita de Zoro' },
  { palavra: 'explosao', dica: 'Magia favorita da Megumin' },
]

const FORCA_DESENHO = [
  '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```',
]

let forcaAtiva = null
let forcaTimeout = null

async function iniciarForca(sock, jid) {
  if (forcaAtiva) {
    await sock.sendMessage(jid, { text: '🎭 Já há uma forca ativa! Adivinhem com *!letra X*' })
    return
  }

  const item = PALAVRAS_FORCA[Math.floor(Math.random() * PALAVRAS_FORCA.length)]
  forcaAtiva = {
    jid,
    palavra: item.palavra,
    dica: item.dica,
    letrasErradas: [],
    letrasCorretas: [],
    erros: 0,
    maxErros: 6
  }

  const display = gerarDisplay()
  await sock.sendMessage(jid, {
    text: `🎭 *JOGO DA FORCA!*\n\n${FORCA_DESENHO[0]}\n\n${display}\n\n💡 Dica: ${item.dica}\n\n✍️ Tenta uma letra: *!letra A*\nOu a palavra: *!palavra naruto*`
  })

  forcaTimeout = setTimeout(async () => {
    if (forcaAtiva) {
      await sock.sendMessage(jid, { text: `⏰ Tempo esgotado!\n${FORCA_DESENHO[6]}\nA palavra era: *${forcaAtiva.palavra.toUpperCase()}*` })
      forcaAtiva = null
    }
  }, 120000)
}

function gerarDisplay() {
  return forcaAtiva.palavra.split('').map(l => forcaAtiva.letrasCorretas.includes(l) ? l.toUpperCase() : '_').join(' ')
}

async function tentarLetra(sock, jid, letra, nome) {
  if (!forcaAtiva || forcaAtiva.jid !== jid) return
  letra = letra.toLowerCase()

  if (forcaAtiva.letrasErradas.includes(letra) || forcaAtiva.letrasCorretas.includes(letra)) {
    await sock.sendMessage(jid, { text: `⚠️ Letra *${letra.toUpperCase()}* já foi tentada!` })
    return
  }

  if (forcaAtiva.palavra.includes(letra)) {
    forcaAtiva.letrasCorretas.push(letra)
    const display = gerarDisplay()
    const ganhou = !display.includes('_')

    if (ganhou) {
      clearTimeout(forcaTimeout)
      const { user } = getUser(nome)
      user.xp += 40; user.pontos += 30
      saveUser(nome, user)
      await sock.sendMessage(jid, { text: `✅ *${nome}* descobriu a letra *${letra.toUpperCase()}*!\n\n🎉 *GANHOU!* A palavra era *${forcaAtiva.palavra.toUpperCase()}*!\n+40 XP | +30 pontos` })
      forcaAtiva = null
    } else {
      await sock.sendMessage(jid, { text: `✅ Letra *${letra.toUpperCase()}* está na palavra!\n\n${FORCA_DESENHO[forcaAtiva.erros]}\n\n${display}\n\n❌ Erradas: ${forcaAtiva.letrasErradas.join(' ').toUpperCase() || 'nenhuma'}` })
    }
  } else {
    forcaAtiva.letrasErradas.push(letra)
    forcaAtiva.erros++
    const display = gerarDisplay()

    if (forcaAtiva.erros >= forcaAtiva.maxErros) {
      clearTimeout(forcaTimeout)
      await sock.sendMessage(jid, { text: `💀 *GAME OVER!*\n${FORCA_DESENHO[6]}\nA palavra era: *${forcaAtiva.palavra.toUpperCase()}*` })
      forcaAtiva = null
    } else {
      await sock.sendMessage(jid, { text: `❌ Letra *${letra.toUpperCase()}* não existe!\n\n${FORCA_DESENHO[forcaAtiva.erros]}\n\n${display}\n\n❌ Erradas: ${forcaAtiva.letrasErradas.join(' ').toUpperCase()}\n💔 Vidas: ${forcaAtiva.maxErros - forcaAtiva.erros}` })
    }
  }
}

async function tentarPalavra(sock, jid, tentativa, nome) {
  if (!forcaAtiva || forcaAtiva.jid !== jid) return
  if (tentativa.toLowerCase() === forcaAtiva.palavra) {
    clearTimeout(forcaTimeout)
    const { user } = getUser(nome)
    user.xp += 50; user.pontos += 40
    saveUser(nome, user)
    await sock.sendMessage(jid, { text: `🎉 *${nome}* adivinhou a palavra *${forcaAtiva.palavra.toUpperCase()}*!\n+50 XP | +40 pontos 🏅` })
    forcaAtiva = null
  } else {
    forcaAtiva.erros++
    if (forcaAtiva.erros >= forcaAtiva.maxErros) {
      clearTimeout(forcaTimeout)
      await sock.sendMessage(jid, { text: `💀 *GAME OVER!* Palavra errada!\n${FORCA_DESENHO[6]}\nEra: *${forcaAtiva.palavra.toUpperCase()}*` })
      forcaAtiva = null
    } else {
      await sock.sendMessage(jid, { text: `❌ *${tentativa.toUpperCase()}* não é a palavra certa!\n💔 Vidas: ${forcaAtiva.maxErros - forcaAtiva.erros}` })
    }
  }
}

// ════════════════════════════════════════
//  VERDADE OU DESAFIO
// ════════════════════════════════════════
const verdades = [
  'Qual anime te fez chorar?',
  'Qual personagem de anime tu te identificas mais?',
  'Já assististe anime escondido da família?',
  'Qual é o pior anime que já assististe?',
  'Tens uma waifu/husbando favorito? Quem é?',
  'Já sonhaste com algum anime?',
  'Qual personagem de anime tu mais odiaste?',
  'Quantas horas por semana assistes anime?',
  'Já choraste com a morte de algum personagem?',
  'Qual intro de anime sabes cantar de cor?',
]

const desafios = [
  'Escreve o nome de 10 animes em 30 segundos!',
  'Imita a voz de um personagem de anime!',
  'Escreve uma frase motivacional no estilo anime!',
  'Menciona 3 pessoas do grupo e diz que personagem cada uma seria!',
  'Canta a intro de um anime!',
  'Descreve um anime sem dizer o nome e deixa o grupo adivinhar!',
  'Diz 5 técnicas de anime sem parar!',
  'Faz uma cena dramática de anime em texto!',
  'Escolhe: ser o vilão mais poderoso ou o herói mais fraco?',
  'Recomenda um anime e convence o grupo em 3 frases!',
]

async function verdadeOuDesafio(sock, jid, escolha, nome) {
  if (escolha === 'verdade') {
    const v = verdades[Math.floor(Math.random() * verdades.length)]
    await sock.sendMessage(jid, { text: `🔮 *VERDADE para ${nome}:*\n\n"${v}"` })
  } else if (escolha === 'desafio') {
    const d = desafios[Math.floor(Math.random() * desafios.length)]
    await sock.sendMessage(jid, { text: `🎯 *DESAFIO para ${nome}:*\n\n"${d}"` })
  } else {
    await sock.sendMessage(jid, { text: '🎮 Escolhe:\n*!vd verdade* — receber uma verdade\n*!vd desafio* — receber um desafio' })
  }
}

// ════════════════════════════════════════
//  JOGO DA MEMÓRIA (par de personagens)
// ════════════════════════════════════════
const pares = [
  ['Naruto', 'Sasuke'], ['Luffy', 'Zoro'], ['Goku', 'Vegeta'],
  ['Deku', 'Bakugo'], ['Ichigo', 'Rukia'], ['Light', 'L'],
]

let memoriaAtiva = null

async function iniciarMemoria(sock, jid) {
  if (memoriaAtiva) {
    await sock.sendMessage(jid, { text: '🧠 Já há um jogo ativo! Usa *!par A B*' })
    return
  }

  const parEscolhido = pares[Math.floor(Math.random() * pares.length)]
  const cartas = [...parEscolhido, ...parEscolhido].sort(() => Math.random() - 0.5)
  const letras = ['A','B','C','D']

  memoriaAtiva = { jid, cartas, letras, reveladas: [], acertos: 0 }

  let tabuleiro = '🧠 *JOGO DA MEMÓRIA!*\n\nEncontra o par de personagens!\n\n'
  letras.forEach((l, i) => { tabuleiro += `[${l}] ❓  ` })
  tabuleiro += '\n\nUsa *!par A C* para revelar duas cartas!'

  await sock.sendMessage(jid, { text: tabuleiro })
}

async function tentarPar(sock, jid, l1, l2, nome) {
  if (!memoriaAtiva || memoriaAtiva.jid !== jid) return
  const idx1 = memoriaAtiva.letras.indexOf(l1.toUpperCase())
  const idx2 = memoriaAtiva.letras.indexOf(l2.toUpperCase())

  if (idx1 === -1 || idx2 === -1 || idx1 === idx2) {
    await sock.sendMessage(jid, { text: '⚠️ Letras inválidas! Ex: *!par A C*' })
    return
  }

  const c1 = memoriaAtiva.cartas[idx1]
  const c2 = memoriaAtiva.cartas[idx2]

  if (c1 === c2) {
    memoriaAtiva.acertos++
    memoriaAtiva.reveladas.push(idx1, idx2)

    if (memoriaAtiva.acertos === 2) {
      const { user } = getUser(nome)
      user.xp += 35; user.pontos += 25
      saveUser(nome, user)
      await sock.sendMessage(jid, { text: `✅ Par correto: *${c1}* & *${c2}*!\n\n🎉 *${nome}* completou o jogo!\n+35 XP | +25 pontos` })
      memoriaAtiva = null
    } else {
      await sock.sendMessage(jid, { text: `✅ Par encontrado: *${c1}* & *${c2}*!\n🔍 Ainda falta 1 par! Continua com *!par X Y*` })
    }
  } else {
    await sock.sendMessage(jid, { text: `❌ *${c1}* e *${c2}* não são par! Tenta de novo com *!par X Y*` })
  }
}

// ════════════════════════════════════════
//  AKINATOR DE ANIME
// ════════════════════════════════════════
const akiPersonagens = [
  { nome: 'Naruto', respostas: { masculino: true, cabelo: 'loiro', poder: 'chakra', aldeia: true, vilao: false } },
  { nome: 'Luffy', respostas: { masculino: true, cabelo: 'preto', poder: 'borracha', aldeia: false, vilao: false } },
  { nome: 'Light Yagami', respostas: { masculino: true, cabelo: 'castanho', poder: 'caderno', aldeia: false, vilao: true } },
  { nome: 'Rem', respostas: { masculino: false, cabelo: 'azul', poder: 'magia', aldeia: false, vilao: false } },
  { nome: 'Goku', respostas: { masculino: true, cabelo: 'preto', poder: 'ki', aldeia: false, vilao: false } },
]

let akiAtivo = null
const akiPerguntas = [
  { texto: 'O personagem é masculino?', chave: 'masculino' },
  { texto: 'O personagem tem cabelo loiro?', chave: 'cabelo', valor: 'loiro' },
  { texto: 'O personagem usa chakra ou energia espiritual?', chave: 'poder', valor: 'chakra' },
  { texto: 'O personagem pertence a uma aldeia ninja?', chave: 'aldeia' },
  { texto: 'O personagem é vilão?', chave: 'vilao' },
]

async function iniciarAkinator(sock, jid) {
  if (akiAtivo) {
    await sock.sendMessage(jid, { text: '🧞 Já há um Akinator ativo! Responde *!sim* ou *!nao*' })
    return
  }

  akiAtivo = {
    jid,
    personagens: [...akiPersonagens],
    perguntaIdx: 0,
  }

  await sock.sendMessage(jid, {
    text: `🧞 *AKINATOR DE ANIME!*\n\nPensa num personagem de anime...\n\nPergunta 1/${akiPerguntas.length}:\n❓ ${akiPerguntas[0].texto}\n\nResponde *!sim* ou *!nao*`
  })
}

async function responderAkinator(sock, jid, resposta, nome) {
  if (!akiAtivo || akiAtivo.jid !== jid) return
  const sim = resposta === 'sim'
  const perg = akiPerguntas[akiAtivo.perguntaIdx]

  // Filtra personagens
  akiAtivo.personagens = akiAtivo.personagens.filter(p => {
    const val = p.respostas[perg.chave]
    if (typeof val === 'boolean') return val === sim
    if (perg.valor) return (val === perg.valor) === sim
    return true
  })

  akiAtivo.perguntaIdx++

  if (akiAtivo.personagens.length === 1 || akiAtivo.perguntaIdx >= akiPerguntas.length) {
    const chute = akiAtivo.personagens[0]?.nome || 'Desconhecido'
    await sock.sendMessage(jid, { text: `🧞 *Acho que é... ${chute}!*\n\nEstou certo? 😄\nUsa *!akinator* para jogar de novo!` })
    akiAtivo = null
    return
  }

  const prox = akiPerguntas[akiAtivo.perguntaIdx]
  await sock.sendMessage(jid, {
    text: `Pergunta ${akiAtivo.perguntaIdx + 1}/${akiPerguntas.length}:\n❓ ${prox.texto}\n\nResponde *!sim* ou *!nao*`
  })
}

// ════════════════════════════════════════
//  COMPLETAR A FRASE
// ════════════════════════════════════════
const frases = [
  { frase: 'Eu nunca vou voltar atrás na minha palavra, esse é o meu...', resposta: 'nindo', dica: 'Caminho ninja...' },
  { frase: 'Vou ser o rei dos...', resposta: 'piratas', dica: 'One Piece...' },
  { frase: 'Omae wa mou...', resposta: 'shindeiru', dica: 'Já estás...' },
  { frase: 'Plus...', resposta: 'ultra', dica: 'Grito do All Might...' },
  { frase: 'Eu vou ser o melhor espadachim do mundo, esse é o meu...', resposta: 'sonho', dica: 'Zoro...' },
  { frase: 'Ka me ha me...', resposta: 'ha', dica: 'Técnica do Goku...' },
  { frase: 'Datte...', resposta: 'bayo', dica: 'Bordão do Naruto...' },
  { frase: 'Sono chi no sadame...', resposta: 'jojo', dica: 'Abertura de JoJo...' },
]

let fraseAtiva = null
let fraseTimeout = null

async function iniciarFrase(sock, jid) {
  if (fraseAtiva) {
    await sock.sendMessage(jid, { text: '💬 Já há uma frase ativa! Completem-na!' })
    return
  }

  const f = frases[Math.floor(Math.random() * frases.length)]
  fraseAtiva = { ...f, jid }

  await sock.sendMessage(jid, {
    text: `💬 *COMPLETA A FRASE!*\n\n"${f.frase} ___"\n\n💡 Dica: ${f.dica}\n⏱️ 30 segundos!`
  })

  fraseTimeout = setTimeout(async () => {
    if (fraseAtiva) {
      await sock.sendMessage(jid, { text: `⏰ Tempo esgotado!\nA resposta era: *${fraseAtiva.resposta.toUpperCase()}*` })
      fraseAtiva = null
    }
  }, 30000)
}

async function verificarFrase(sock, jid, texto, nome) {
  if (!fraseAtiva || fraseAtiva.jid !== jid) return false
  if (texto !== fraseAtiva.resposta) return false

  clearTimeout(fraseTimeout)
  const { user } = getUser(nome)
  user.xp += 15; user.pontos += 10
  saveUser(nome, user)
  await sock.sendMessage(jid, { text: `✅ *${nome}* completou a frase!\n+15 XP | +10 pontos 🎉` })
  fraseAtiva = null
  return true
}

module.exports = {
  iniciarForca, tentarLetra, tentarPalavra,
  verdadeOuDesafio,
  iniciarMemoria, tentarPar,
  iniciarAkinator, responderAkinator,
  iniciarFrase, verificarFrase,
}
