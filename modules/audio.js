const axios = require('axios')

// ════════════════════════════════════════
//  FRASES ÉPICAS DE ANIME (+100)
// ════════════════════════════════════════
const FRASES_ANIME = [
  // Naruto
  "Eu nunca volto atrás na minha palavra! Esse é o meu nindo, meu caminho ninja!",
  "Eu vou ser o Hokage, acreditem!",
  "O verdadeiro poder nasce quando protegemos quem importa.",
  "A força sem coragem não significa nada.",
  "Cada cicatriz conta uma história de superação.",
  "O destino pode ser mudado pelas nossas escolhas.",                                              "O meu espírito jamais será derrotado.",
  "A escuridão não assusta quem carrega a própria luz.",                                           "O impossível é apenas uma palavra.",
  "Os meus limites existem para serem ultrapassados.",
  "Enquanto eu respirar, continuarei lutando.",
  "Treino duro hoje para vencer amanhã.",
  "Nenhum sonho é grande demais para quem persiste.",
  "A amizade é a arma mais poderosa de todas.",
  "O poder da vontade supera qualquer obstáculo.",
  "Se o mundo inteiro estiver contra mim, eu ainda avançarei.",                                    "A vitória pertence àqueles que nunca desistem.",
  "Hoje é apenas mais um passo rumo ao topo.",
  "Chegou a hora de despertar o meu verdadeiro poder!",
  "Esta luta ainda não acabou!",
  "O meu coração nunca se rende.",
  "Eu transformarei a derrota em força.",                                                          "A coragem é o primeiro passo para a vitória.",
  "O futuro pertence aos que acreditam nos seus sonhos.",
  "Nada pode parar alguém verdadeiramente determinado.",
  "Mesmo sozinho, continuarei em frente.",
  "Vou superar todas as expectativas!",
  "Este é apenas o começo da minha jornada.",
  "Os heróis são forjados nas dificuldades.",
  "A chama da determinação nunca se apaga.",
  "Chegou o momento de mostrar a minha força!",
  "A esperança é mais forte que o medo.",
  "A verdadeira batalha acontece dentro de nós.",
  "Não existe vitória sem sacrifício.",
  "Os sonhos tornam-se realidade para quem não desiste.",
  "A minha história está apenas a começar.",                                                       "Hoje vou ultrapassar os meus próprios limites!",
  "O mundo ainda vai ouvir o meu nome!",
                                                                                                   // One Piece
  "Vou ser o Rei dos Piratas!",                                                                    "O One Piece existe! E eu vou encontrá-lo!",
  "Ninguém pode mudar o que já aconteceu, mas podemos mudar o futuro.",
  "O mar é vasto e cheio de aventuras. Parta comigo!",
  "Prefiro morrer do que perder um amigo.",
  "O poder sem limites é nada sem a liberdade.",
  "Serei o homem mais livre do mundo!",
  "A morte não é o fim, é apenas o começo de uma lenda.",
  "Quando se tem um sonho, não importa o tamanho, lute até o fim.",
  "Não importa quantos inimigos, eu nunca recuarei.",
  "Nakama é mais que amigo, é família.",

  // Dragon Ball
  "Plus Ultra!!",
  "Kamehameha!!",
  "A sua força cresce a cada batalha.",
  "Não me importa se és um Deus, eu vou proteger a Terra!",
  "O verdadeiro guerreiro luta pelo que ama.",
  "Ultrapassarei todos os limites, até me tornar o mais forte do universo!",
  "Evoluir é a essência da vida.",
  "A paz só existe quando os maus são detidos.",
  "Deixe a sua energia explodir!",
  "A luta nunca acaba enquanto houver esperança.",
  // Bleach                                                                                        "Com este poder, vou proteger todos que amo!",
  "A alma de um shinigami nunca desiste.",
  "Mesmo que o mundo me esqueça, eu lutarei.",
  "A verdadeira força é invisível aos olhos.",
  "Bankai! O meu poder máximo!",
  "A morte não é o fim, é o começo de uma nova jornada.",
  "Seja a noite mais escura, eu serei a luz.",
  "O meu destino é proteger os vivos e os mortos.",
  "A espada é a extensão da minha alma.",
  "Nunca abandonarei um amigo em perigo.",

  // Attack on Titan
  "Dedica o teu coração!",                                                                         "Se não lutarmos, não podemos vencer.",
  "A liberdade custa vidas, mas vale a pena.",                                                     "O mundo além das muralhas é cruel, mas belo.",
  "Erwin, avança! A humanidade não pode parar!",
  "Para proteger os meus, eu destruirei o mundo.",
  "A verdade está lá fora, mas também há monstros.",
  "A coragem não é a ausência de medo, é agir apesar dele.",
  "A esperança é a última a morrer.",
  "Os titãs podem ser derrotados, mas o ódio é eterno.",

  // My Hero Academia
  "Ser herói não é sobre poder, é sobre coração.",
  "O meu corpo moveu-se sozinho para salvar alguém!",
  "Medo? Claro que tenho! Mas também tenho sonhos!",
  "Vou ser o maior herói de todos os tempos!",                                                     "Um sorriso pode salvar vidas.",
  "A verdadeira força é proteger quem amamos.",
  "Não importa o quirk, importa o que fazes com ele.",
  "Levanta-te, mesmo que estejas ferido.",
  "A justiça não é cega, é guiada pelo coração.",

  // Jujutsu Kaisen
  "Eu sou o feiticeiro mais forte do mundo.",
  "A morte é só uma parte da vida de um feiticeiro.",
  "Não subestime um humano, mesmo sem poderes.",
  "A verdadeira maldição é o medo que carregamos.",
  "Lutar é a única forma de proteger os vivos.",
  "O caos é apenas o começo da ordem.",
  "Eu não vou deixar ninguém morrer nas minhas costas.",
  "O infinito é o meu domínio.",

  // Demon Slayer
  "Respire! A dança do fogo nunca acaba.",
  "Proteger a minha irmã é a minha razão de viver.",
  "Mesmo que a noite seja infinita, o sol vai nascer.",
  "O som da água corta o mal.",
  "A compaixão pelos demónios não me impede de os matar.",
  "A família é o bem mais precioso.",
  "O meu corpo pode queimar, mas a minha alma nunca.",
  "A chama do trabalho árduo nunca se apaga.",
                                                                                                   // Frases icónicas / genéricas
  "Omae wa mou shindeiru... NANI?!",                                                               "Com grandes poderes vêm grandes responsabilidades.",
  "Acredita no teu coração, mesmo que o mundo diga o contrário.",
  "O impossível é só uma questão de tempo.",
  "A vitória não é para os mais fortes, mas para os que persistem.",
  "O caminho do herói é solitário, mas glorioso.",
  "Cada derrota ensina mais que mil vitórias.",
  "Não chores porque acabou, sorria porque aconteceu.",
  "A vida é um sopro, lute com intensidade.",
  "O meu poder não é para destruir, mas para defender.",
  "Sonhos são a essência da alma humana.",
  "O tempo é o melhor mestre, mas também o mais cruel.",
  "A dor é temporária, a glória é eterna.",
  "Levanta a cabeça, o sol ainda brilha.",
  "Nenhum obstáculo é grande demais quando se tem fé.",
  "O amor é a força mais poderosa do universo.",
  "A determinação transforma o impossível em realidade.",
  "O medo é apenas um sinal de que estás a fazer algo corajoso.",
  "O silêncio também é uma resposta.",
  "O maior guerreiro é aquele que doma a própria raiva.",
  "A aventura começa quando decides dar o primeiro passo.",
  "A felicidade está nas pequenas conquistas.",
  "A gratidão transforma o que temos em suficiente.",
  "O passado é história, o futuro é mistério, o presente é uma dádiva.",
  "O universo conspira a favor dos que lutam.",
  "A luz no fim do túnel és tu mesmo.",
  "Acredita na tua força interior, ela é ilimitada."
];

// ════════════════════════════════════════                                                      //  MAPEAMENTO DE VOZES (ElevenLabs)
// ════════════════════════════════════════
const VOZES_GENERO = {
  feminina:    'EXAVITQu4vr4xnSDxMaL',   // Bella (doce, natural)
  feminino:    'EXAVITQu4vr4xnSDxMaL',
  f:           'EXAVITQu4vr4xnSDxMaL',
  female:      'EXAVITQu4vr4xnSDxMaL',
  masculina:   'ErXwobaYiN019PkySvjV',   // Antoni (grave, épico)
  masculino:   'ErXwobaYiN019PkySvjV',                                                             m:           'ErXwobaYiN019PkySvjV',
  male:        'ErXwobaYiN019PkySvjV'
};

const VOZ_PADRAO = 'feminina';   // se não especificar

// ════════════════════════════════════════
//  EXTRAI VOZ DO TEXTO (ex: "texto [m]")
// ════════════════════════════════════════
function extrairVozETexto(raw) {
  const match = raw.match(/^(.*?)\s*\[(feminina|feminino|f|female|masculina|masculino|m|male)\]\s*$/i);
  if (match) {
    return {
      texto: match[1].trim(),
      voz: match[2].toLowerCase()                                                                    };
  }
  return { texto: raw.trim(), voz: VOZ_PADRAO };                                                 }

// ════════════════════════════════════════
//  VOZ ELEVENLABS
// ════════════════════════════════════════
async function gerarVozElevenLabs(texto, voiceId) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY não definida no .env')

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`

  const response = await axios.post(
    url,
    {
      text: texto,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.3,
        similarity_boost: 0.9,
        use_speaker_boost: true
      }
    },
    {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      responseType: 'arraybuffer',
      timeout: 30000
    }
  )

  return Buffer.from(response.data)                                                              }
                                                                                                 // ════════════════════════════════════════
//  FALLBACK: Google TTS (sem chave)
// ════════════════════════════════════════
async function gerarVozGoogle(texto) {
  const googleTTS = require('google-tts-api')
  const url = googleTTS.getAudioUrl(texto, {
    lang: 'pt-BR',
    slow: false,
    host: 'https://translate.google.com',
  })
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 })
  return Buffer.from(res.data)
}

// ════════════════════════════════════════
//  GERAR VOZ PRINCIPAL
// ════════════════════════════════════════
async function gerarVoz(sock, jid, rawTexto) {
  // Extrai voz do final do texto, se presente
  const { texto, voz } = extrairVozETexto(rawTexto);
  if (!texto || texto.trim().length === 0) {
    await sock.sendMessage(jid, { text: '❌ Escreve algo para eu falar! Ex: *!voz Eu sou o melhor!*' });
    return;
  }                                                                                                const textoLimitado = texto.slice(0, 200);
  const voiceId = VOZES_GENERO[voz] || VOZES_GENERO[VOZ_PADRAO];                                   const nomeGenero = voz.includes('masc') ? 'masculina' : 'feminina';

  await sock.sendMessage(jid, {
    text: `🎙️ A gerar voz ${nomeGenero}...\n"${textoLimitado}"\n\n⏳ Aguarda!`
  })

  // 1ª tentativa: ElevenLabs
  try {
    const buffer = await gerarVozElevenLabs(textoLimitado, voiceId)
    if (buffer.length > 500) {
      await sock.sendMessage(jid, {
        audio: buffer,
        mimetype: 'audio/mpeg',
        ptt: false
      })
      return
    }
  } catch (err) {
    console.error('ElevenLabs erro:', err.message)
  }

  // 2ª tentativa: Google TTS
  try {
    const buffer = await gerarVozGoogle(textoLimitado)
    if (buffer.length > 500) {
      await sock.sendMessage(jid, {
        audio: buffer,
        mimetype: 'audio/mpeg',                                                                          ptt: false
      })
      return
    }                                                                                              } catch (err) {
    console.error('Fallback Google erro:', err.message)
  }

  // Fallback final: texto
  await sock.sendMessage(jid, {
    text: `🎙️ *[VOZ]*\n\n"${textoLimitado}"\n\n_(Serviço de voz indisponível)_`
  })
}

// ════════════════════════════════════════
//  MÚSICA
// ════════════════════════════════════════
async function gerarMusica(sock, jid, descricao) {
  await sock.sendMessage(jid, { text: `🎵 A compor música...` })
  try {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.1-8b-instant',
      max_tokens: 300,
      messages: [
        { role: 'system', content: 'Crias letras de músicas de anime em português. Apenas a letra, sem explicações.' },
        { role: 'user', content: `Cria uma letra épica de música de anime sobre: "${descricao}". Máx 8 linhas, com refrão.` }
      ]                                                                                              }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } })
    const letra = res.data.choices[0].message.content.trim()
    await sock.sendMessage(jid, { text: `🎵 *Música: ${descricao}*\n\n${letra}\n\n🎼 _(Letra gerada por IA)_` })
  } catch (err) {
    console.error('Música erro:', err.message)
    await sock.sendMessage(jid, { text: '❌ Erro ao gerar música.' })
  }
}

// ════════════════════════════════════════
//  FRASE ÉPICA (género aleatório)
// ════════════════════════════════════════
async function fraseFamosa(sock, jid) {
  const frase = FRASES_ANIME[Math.floor(Math.random() * FRASES_ANIME.length)]
  const genero = Math.random() < 0.5 ? 'feminina' : 'masculina'
  await gerarVoz(sock, jid, `${frase} [${genero}]`)
}

module.exports = { gerarMusica, gerarVoz, fraseFamosa }
