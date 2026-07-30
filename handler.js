const { getUser, saveUser, todosUsuarios, adicionarXpRank, penalizarDerrota, comandoPermitido } = require('./db')
const UI = require('./modules/ui')
const {
  enviarCardPerfil,
  enviarRankingComImagem,
  enviarBoasVindasComImagem,
  enviarWaifuComImagem,
  enviarVitoriaTorneio,
  enviarLevelUp,
  enviarVitoriaBatalha,
} = require('./modules/imagens')
const { enviarHumano, digitando, delay } = require('./modules/humano')
const { ajuda } = require('./modules/ajuda')
const { verificarLimite, verUso, resetUso } = require('./modules/limiter')
const { statusAPIs } = require('./modules/fallback')
const { iniciarQuiz, verificarResposta, verPerfil } = require('./modules/quiz')
const { desafiar, aceitar, recusar, atacar } = require('./modules/rpg')
const {
  iniciarAdivinhar, verificarAdivinhar,
  waifuDoDia, desafioDiario, completarDesafio,
} = require('./modules/adivinhar')
const {
  iniciarTorneio,
  inscrever,
  apostar,
  torneioClans,
  agendarTorneioSemanal,
  atacarTorneio,
  verTorneio,
  state
} = require('./modules/torneio')
const { verLoja, verLojaTudo, comprar, equiparHabilidade, equiparPet, usarPocao } = require('./modules/loja')
const { agendarNotificacoes } = require('./modules/agendador')
const { responderIA, limparHistorico } = require('./modules/ia')
const { comandoImagem } = require('./modules/imagem')
const { gerarMusica, gerarVoz, fraseFamosa } = require('./modules/audio')
const { buscarAnime, buscarPersonagem, topAnimes, animeTemporada } = require('./modules/anilist')
const { imagemParaSticker, stickerReacao, verificarGatilho } = require('./modules/sticker')
const {
  criarCla, entrarCla, sairCla, verClans, verCla,
  propor, aceitarCasamento, recusarCasamento, divorcio, verCasal,
  verMissoes, atualizarMissao,
  elegerRepresentante
} = require('./modules/social')
const {
  iniciarForca, tentarLetra, tentarPalavra,
  verdadeOuDesafio,
  iniciarMemoria, tentarPar,
  iniciarAkinator, responderAkinator,
  iniciarFrase, verificarFrase,
} = require('./modules/jogos')
const {
  quizIAStart,
  verificarQuizIA,
  forcaIAStart,
  letraForcaIA,
  vdIA,
  sinopseIA,
  verificarSinopse,
  iniciarHistoria,
  continuarHistoria,
} = require('./modules/jogos-ia')
const {
  chatIA, resumoAnime, recomendarAnime,
  analisarPersonagem,
  iniciarDebate, adicionarArgumento, encerrarDebate,
  comparar, curiosidade, traduzirJapones,
  limparMemoria
} = require('./modules/assistente')
const {
  boasVindasAuto,
  adicionarMembro, removerMembro,
  promoverAdmin, rebaixarAdmin,
  silenciarGrupo, abrirGrupo,
  toggleAntilink, verificarLink,
  adicionarPalavra, verificarPalavrao,
  anuncio, infoGrupo,
  configBoasVindas, toggleBoasVindas,
  menuAdmin
} = require('./modules/admin')
const { verificarDespertar, processarRespostaDespertar, anunciarSubidaRank } = require('./modules/sistema')
const { iniciarMasmorra, atacarMasmorra, defenderMasmorra, curarMasmorra, fugirMasmorra } = require('./modules/masmorra')
const { verAfinidade } = require('./modules/combate')
const { craftar, verReceitas } = require('./modules/crafting')
const { verCodex } = require('./modules/codex')
const { verMapa, viajar } = require('./modules/mapa')
const { verHallFama } = require('./modules/hall_fama')
const { criarGuilda, entrarGuilda, sairGuilda, verGuildas, verGuilda, adicionarXpGuilda } = require('./modules/guildas')
const { inicializarMissoesJogador, verificarProgressoMissao, verMissoesEpicas, notificarMissaoCompleta } = require('./modules/missoes_epicas')
const { iniciarGuerraGuildas, lutarGuerra, statusGuerra } = require('./modules/guerra_guildas')
const { iniciarEventoGlobal, atacarEvento, statusEvento } = require('./modules/evento_global')
const { inicializarConquistas, verificarConquistas, verConquistas, notificarConquista } = require('./modules/conquistas')

let JID_GRUPO = null

module.exports = function iniciarHandler(sock) {

  // ─── ENTRADA / SAÍDA DE MEMBROS ────────────────────────────
  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    // Converte participantes para array de strings JID (garante que split funcione)
    const participantesJids = participants.map(p => typeof p === 'string' ? p : p.id);
    if (action === 'add') await boasVindasAuto(sock, id, participantesJids, 'add')
    if (action === 'remove') await boasVindasAuto(sock, id, participantesJids, 'remove')
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const raw = (
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text || ''
    ).trim()

    const texto = raw.toLowerCase()
    const jid = msg.key.remoteJid
    const sender = msg.key.participant || jid
    const nome = msg.pushName || 'Anônimo'

    // Ignorar mensagens privadas
    if (!jid.endsWith('@g.us')) return

    // Detectar grupo automaticamente
    if (!JID_GRUPO && jid.endsWith('@g.us')) {
      JID_GRUPO = jid
      agendarNotificacoes(sock, JID_GRUPO)
      agendarTorneioSemanal(sock, JID_GRUPO)
      console.log('📌 Grupo detectado: ' + JID_GRUPO)
    }

    // ─── SISTEMA (DESPERTAR) ─────────────────────────────────
    const despertou = await verificarDespertar(sock, jid, nome, sender)
    if (!despertou) {
      const respondeu = await processarRespostaDespertar(sock, jid, nome, raw, sender)
      if (!respondeu) return
      return
    }

    // ─── MASMORRA DIÁRIA ────────────────────────────────────
    if (texto === '!masmorra') return iniciarMasmorra(sock, jid, nome)
    if (texto.startsWith('!masmorra ')) {
      const { masmorras } = require('./modules/masmorra')
      if (!masmorras || !masmorras[nome]) {
        await sock.sendMessage(jid, { text: '⚠️ Você não está em uma masmorra ativa! Use *!masmorra* para iniciar.' })
        return
      }
      const acao = texto.split(' ')[1]
      if (acao === 'atacar') return atacarMasmorra(sock, jid, nome)
      if (acao === 'defender') return defenderMasmorra(sock, jid, nome)
      if (acao === 'curar') return curarMasmorra(sock, jid, nome)
      if (acao === 'fugir') return fugirMasmorra(sock, jid, nome)
      await sock.sendMessage(jid, { text: '❌ Ação inválida. Use: *!masmorra atacar*, *defender*, *curar*, *fugir*.' })
      return
    }

    // ─── BLOQUEIO DE COMANDOS POR RANK ──────────────────────
    const usuario = getUser(nome)
    if (usuario.despertou) {
      const comandosRestritos = {
        '!batalha': 'batalha', '!criar-cla': 'criar-cla', '!entrar-cla': 'entrar-cla',
        '!loja': 'loja', '!comprar': 'comprar', '!torneio': 'torneio', '!inscrever': 'inscrever',
        '!apostar': 'apostar', '!atacar': 'atacar', '!voz': 'voz', '!frase': 'frase',
        '!ia': 'ia', '!resumo': 'resumo', '!recomendar': 'recomendar', '!analisar': 'analisar',
        '!img': 'img', '!musica': 'musica', '!torneio clans': 'torneio clans',
        '!criar-guilda': 'criar-guilda', '!entrar-guilda': 'entrar-guilda'
      }
      for (const cmd in comandosRestritos) {
        if (texto.startsWith(cmd)) {
          if (!comandoPermitido(nome, comandosRestritos[cmd])) {
            await sock.sendMessage(jid, { text: '🔒 Rank insuficiente! Continue a evoluir no Nexus World para desbloquear este comando.', mentions: [sender] })
            return
          }
          break
        }
      }
    }

    // ─── COMANDOS GERAIS ────────────────────────────────────
    if (texto === '!jid') {
      await sock.sendMessage(jid, { text: '📌 JID:\n' + jid })
      return
    }

    // ─── QUIZ ────────────────────────────────────────────────
    if (texto === '!quiz') return iniciarQuiz(sock, jid)
    if (await verificarResposta(sock, jid, texto, nome)) {
      if (adicionarXpRank(nome, 5)) await anunciarSubidaRank(sock, jid, nome, sender, getUser(nome).rank)
      adicionarXpGuilda(nome, 2)
      const notif = atualizarMissao(nome, 'quiz')
      if (notif) await sock.sendMessage(jid, { text: '🎉 *MISSÃO COMPLETA!*\n' + notif.missao.nome + '\n+' + notif.missao.xp + ' XP | +' + notif.missao.pontos + ' pts' })
      // Conquistas
      const conquistasQuiz = verificarConquistas(nome, 'quiz_mestre', 1)
      for (const c of conquistasQuiz) {
        await notificarConquista(sock, jid, nome, c)
      }
      // Verificação geral
      const conquistasGerais = verificarConquistas(nome, 'todas', 0)
      for (const c of conquistasGerais) {
        await notificarConquista(sock, jid, nome, c)
      }
      return
    }
    if (await verificarAdivinhar(sock, jid, texto, nome)) {
      if (adicionarXpRank(nome, 5)) await anunciarSubidaRank(sock, jid, nome, sender, getUser(nome).rank)
      adicionarXpGuilda(nome, 2)
      const notif = atualizarMissao(nome, 'adivinhar')
      if (notif) await sock.sendMessage(jid, { text: '🎉 *MISSÃO COMPLETA!*\n' + notif.missao.nome + '\n+' + notif.missao.xp + ' XP | +' + notif.missao.pontos + ' pts' })
      return
    }

    // ─── ADIVINHAR ───────────────────────────────────────────
    if (texto === '!adivinhar') return iniciarAdivinhar(sock, jid)

    // ─── RPG ─────────────────────────────────────────────────
    if (texto.startsWith('!batalha ')) return desafiar(sock, jid, nome, raw.split(' ').slice(1).join(' '))
    if (texto === '!aceitar') return aceitar(sock, jid, nome)
    if (texto === '!recusar') return recusar(sock, jid, nome)
   // ─── CRAFTING ────────────────────────────────────────────
if (texto === '!receitas') return verReceitas(sock, jid)
if (texto.startsWith('!craftar ')) return craftar(sock, jid, nome, texto.split(' ')[1])
// ─── CODEX ───────────────────────────────────────────────
if (texto === '!codex') return verCodex(sock, jid)
if (texto.startsWith('!codex ')) return verCodex(sock, jid, texto.split(' ')[1])

// ─── MAPA ────────────────────────────────────────────────
if (texto === '!mapa') return verMapa(sock, jid, nome)
if (texto.startsWith('!viajar ')) return viajar(sock, jid, nome, texto.split(' ')[1])
// ─── HALL DA FAMA ───────────────────────────────────────
if (texto === '!hall') return verHallFama(sock, jid)
    // ─── TORNEIO (interativo + comandos gerais) ──────────────
    if (texto === '!torneio') return iniciarTorneio(sock, jid)
    if (texto === '!inscrever') return inscrever(sock, jid, nome)
    if (texto.startsWith('!apostar ')) {
      const partes = raw.split(' ')
      if (partes.length >= 3) return apostar(sock, jid, nome, partes[1], partes[2])
      else await sock.sendMessage(jid, { text: '❌ Uso: !apostar <nome> <pontos>' })
      return
    }
    if (texto === '!vertorneio' || texto === '!torneio status') return verTorneio(sock, jid)
    if (texto === '!torneio clans') return torneioClans(sock, jid)

    // ─── ATACAR (RPG ou TORNEIO) ─────────────────────────────
    if (texto === '!atacar') {
      const torneioAtivo = state.torneio
      if (
        torneioAtivo?.batalhaAtual &&
        (nome === torneioAtivo.batalhaAtual.j1 || nome === torneioAtivo.batalhaAtual.j2)
      ) {
        return atacarTorneio(sock, jid, nome)
      }
      return atacar(sock, jid, nome)
    }

    // ─── WAIFU / DIÁRIO ──────────────────────────────────────
    if (texto === '!waifu') return waifuDoDia(sock, jid)
    if (texto === '!diario') return desafioDiario(sock, jid, nome)
    if (texto === '!completar') {
      await completarDesafio(sock, jid, nome)
      if (adicionarXpRank(nome, 10)) await anunciarSubidaRank(sock, jid, nome, sender, getUser(nome).rank)
      return
    }

    // ─── LOJA ────────────────────────────────────────────────
    if (texto === '!loja') return verLoja(sock, jid)
    if (texto === '!loja tudo') return verLojaTudo(sock, jid)
    if (texto.startsWith('!loja ')) {
      const categoria = texto.split(' ')[1]
      if (categoria) return verLoja(sock, jid, categoria)
    }
    if (texto.startsWith('!comprar ')) return comprar(sock, jid, nome, texto.split(' ')[1])

    // ─── PERFIL / RANKING / AFINIDADE ────────────────────────
    if (texto === '!perfil') return UI.mostrarPerfil(sock, jid, nome)

    if (texto === '!ranking') {
      const db = todosUsuarios()
      const sorted = Object.entries(db)
        .sort((a, b) => b[1].xp - a[1].xp)
        .slice(0, 10)
      if (!sorted.length) {
        return sock.sendMessage(jid, { text: '📊 Nenhum dado ainda!' })
      }
      const top3 = sorted.slice(0, 3)
      return enviarRankingComImagem(sock, jid, sorted, top3)
    }

    if (texto === '!afinidade') return verAfinidade(sock, jid, nome)

    // ─── MISSÕES ÉPICAS ──────────────────────────────────────
    if (texto === '!missoes-epicas') return verMissoesEpicas(sock, jid, nome)

    // ─── CONQUISTAS ──────────────────────────────────────────
    if (texto === '!conquistas') return verConquistas(sock, jid, nome)

    // ─── MENÇÃO INTELIGENTE ──────────────────────────────────
    const mencoes = ['animebot', '@animebot', 'bot,', 'bot ']
    const foiMencionado = mencoes.some(m => texto.startsWith(m))
    if (foiMencionado) {
      let pergunta = raw
      mencoes.forEach(m => { pergunta = pergunta.replace(new RegExp('^' + m, 'i'), '').trim() })
      if (pergunta.length > 1) return chatIA(sock, jid, pergunta, nome)
    }

    // ─── ADMIN ───────────────────────────────────────────────
    if (texto === '!admin') return menuAdmin(sock, jid, msg)
    if (texto.startsWith('!add ')) return adicionarMembro(sock, jid, texto.split(' ')[1], msg)
    if (texto.startsWith('!kick ')) return removerMembro(sock, jid, texto.split(' ')[1], msg)
    if (texto.startsWith('!promover ')) return promoverAdmin(sock, jid, texto.split(' ')[1], msg)
    if (texto.startsWith('!rebaixar ')) return rebaixarAdmin(sock, jid, texto.split(' ')[1], msg)
    if (texto === '!silenciar') return silenciarGrupo(sock, jid, msg)
    if (texto === '!abrir') return abrirGrupo(sock, jid, msg)
    if (texto === '!antilink on') return toggleAntilink(sock, jid, msg, true)
    if (texto === '!antilink off') return toggleAntilink(sock, jid, msg, false)
    if (texto.startsWith('!filtro ')) return adicionarPalavra(sock, jid, texto.split(' ')[1], msg)
    if (texto.startsWith('!anuncio ')) return anuncio(sock, jid, raw.split(' ').slice(1).join(' '), msg)
    if (texto === '!infogrupo') return infoGrupo(sock, jid)
    if (texto === '!boasvindas on') return toggleBoasVindas(sock, jid, msg, true)
    if (texto === '!boasvindas off') return toggleBoasVindas(sock, jid, msg, false)
    if (texto.startsWith('!setboasvindas ')) return configBoasVindas(sock, jid, raw.split(' ').slice(1).join(' '), msg)

    // ─── ASSISTENTE IA ───────────────────────────────────────
    if (texto.startsWith('!ia ') || texto.startsWith('!ask ') || foiMencionado) {
      const { permitido, restante } = verificarLimite(nome, 'ia')
      if (!permitido) {
        await enviarHumano(sock, jid, '⚠️ *' + nome + '*, atingiste o limite diário de IA (20 mensagens)!\nReinicia amanhã. 😅\nUsa *!meuuso* para ver os teus limites.')
        return
      }
      const pergunta = foiMencionado
        ? (() => { let p = raw; mencoes.forEach(m => { p = p.replace(new RegExp('^' + m, 'i'), '').trim() }); return p })()
        : raw.split(' ').slice(1).join(' ')
      return chatIA(sock, jid, pergunta, nome)
    }
    if (texto === '!limpar') return limparMemoria(sock, jid, nome)
    if (texto.startsWith('!resumo ')) {
      const { permitido } = verificarLimite(nome, 'resumo')
      if (!permitido) { await enviarHumano(sock, jid, '⚠️ Limite de resumos atingido hoje! (10/dia)'); return }
      return resumoAnime(sock, jid, raw.split(' ').slice(1).join(' '))
    }
    if (texto.startsWith('!recomendar ')) {
      const { permitido } = verificarLimite(nome, 'resumo')
      if (!permitido) { await enviarHumano(sock, jid, '⚠️ Limite atingido hoje!'); return }
      return recomendarAnime(sock, jid, raw.split(' ').slice(1).join(' '), nome)
    }
    if (texto.startsWith('!analisar ')) {
      const { permitido } = verificarLimite(nome, 'resumo')
      if (!permitido) { await enviarHumano(sock, jid, '⚠️ Limite atingido hoje!'); return }
      return analisarPersonagem(sock, jid, raw.split(' ').slice(1).join(' '))
    }
    if (texto.startsWith('!debate ')) return iniciarDebate(sock, jid, raw.split(' ').slice(1).join(' '))
    if (texto.startsWith('!argumento ')) return adicionarArgumento(sock, jid, raw.split(' ').slice(1).join(' '), nome)
    if (texto === '!encerrar') return encerrarDebate(sock, jid)
    if (texto.startsWith('!comparar ')) {
      const { permitido } = verificarLimite(nome, 'resumo')
      if (!permitido) { await enviarHumano(sock, jid, '⚠️ Limite atingido hoje!'); return }
      const partes = raw.split(' vs ')
      return comparar(sock, jid, partes[0].replace('!comparar ', '').trim(), partes[1]?.trim() || '?')
    }
    if (texto.startsWith('!curiosidade')) return curiosidade(sock, jid, raw.split(' ').slice(1).join(' '))
    if (texto.startsWith('!traduzir ')) return traduzirJapones(sock, jid, raw.split(' ').slice(1).join(' '))

    // Ver uso de IA
    if (texto === '!meuuso') {
      const uso = verUso(nome)
      if (!uso) { await enviarHumano(sock, jid, '📊 *' + nome + '*, ainda não usaste nenhum recurso de IA hoje!'); return }
      let txt = '📊 *Uso de IA hoje — ' + nome + '*\n\n'
      const emojis = { ia: '🤖', img: '🎨', musica: '🎵', voz: '🎙️', quizia: '🎮', resumo: '📖', historia: '📝' }
      for (const [tipo, dados] of Object.entries(uso)) {
        const barra = '█'.repeat(Math.round((dados.uso / dados.limite) * 10)) + '░'.repeat(10 - Math.round((dados.uso / dados.limite) * 10))
        txt += (emojis[tipo] || '▪️') + ' *' + tipo + '*: ' + dados.uso + '/' + dados.limite + ' [' + barra + ']\n'
      }
      txt += '\n⏰ Limites reiniciam à meia-noite!'
      await enviarHumano(sock, jid, txt)
      return
    }

    // Status das APIs (admin)
    if (texto === '!statusapi') {
      await enviarHumano(sock, jid, '🔌 *Estado das APIs*\n\n' + statusAPIs())
      return
    }

    // ─── IMAGEM ──────────────────────────────────────────────
    if (texto.startsWith('!img ')) return comandoImagem(sock, jid, raw.split(' ').slice(1).join(' '))

    // ─── ÁUDIO ───────────────────────────────────────────────
    if (texto.startsWith('!musica ')) return gerarMusica(sock, jid, raw.split(' ').slice(1).join(' '))
    if (texto.startsWith('!voz ')) {
      const textoFala = raw.slice(5).trim()
      return gerarVoz(sock, jid, textoFala)
    }
    if (texto === '!frase') return fraseFamosa(sock, jid)

    // ─── ANILIST ─────────────────────────────────────────────
    if (texto.startsWith('!anime ')) return buscarAnime(sock, jid, raw.split(' ').slice(1).join(' '))
    if (texto.startsWith('!personagem ')) return buscarPersonagem(sock, jid, raw.split(' ').slice(1).join(' '))
    if (texto === '!top') return topAnimes(sock, jid)
    if (texto === '!temporada') return animeTemporada(sock, jid)

    // ─── JOGOS COM IA ────────────────────────────────────────
    if (texto === '!quizia') return quizIAStart(sock, jid, 'medio')
    if (texto === '!quizia facil') return quizIAStart(sock, jid, 'facil')
    if (texto === '!quizia dificil') return quizIAStart(sock, jid, 'dificil')
    if (await verificarQuizIA(sock, jid, texto, nome)) return

    if (texto === '!forcaia') return forcaIAStart(sock, jid, 'aleatorio')
    if (texto.startsWith('!forcaia ')) return forcaIAStart(sock, jid, raw.split(' ').slice(1).join(' '))
    if (texto.startsWith('!letraia ')) return letraForcaIA(sock, jid, texto.split(' ')[1], nome)

    if (texto === '!vdia verdade') return vdIA(sock, jid, 'verdade', nome)
    if (texto === '!vdia desafio') return vdIA(sock, jid, 'desafio', nome)

    if (texto === '!sinopse') return sinopseIA(sock, jid)
    if (await verificarSinopse(sock, jid, texto, nome)) return

    if (texto.startsWith('!historia ')) return iniciarHistoria(sock, jid, raw.split(' ').slice(1).join(' '))
    if (texto === '!historia') return iniciarHistoria(sock, jid, '')
    if (texto.startsWith('!continuar ')) return continuarHistoria(sock, jid, raw.split(' ').slice(1).join(' '), nome)

    // ─── JOGOS EXTRAS ────────────────────────────────────────
    if (texto === '!forca') return iniciarForca(sock, jid)
    if (texto.startsWith('!letra ')) return tentarLetra(sock, jid, texto.split(' ')[1], nome)
    if (texto.startsWith('!palavra ')) return tentarPalavra(sock, jid, raw.split(' ').slice(1).join(' '), nome)

    if (texto.startsWith('!vd ')) return verdadeOuDesafio(sock, jid, texto.split(' ')[1], nome)

    if (texto === '!memoria') return iniciarMemoria(sock, jid)
    if (texto.startsWith('!par ')) return tentarPar(sock, jid, texto.split(' ')[1], texto.split(' ')[2], nome)

    if (texto === '!akinator') return iniciarAkinator(sock, jid)
    if (texto === '!sim' || texto === '!nao') return responderAkinator(sock, jid, texto.replace('!', ''), nome)

    if (texto === '!frase') return iniciarFrase(sock, jid)
    if (await verificarFrase(sock, jid, texto, nome)) return

    // ─── CLÃS ────────────────────────────────────────────────
    if (texto.startsWith('!criar-cla ')) return criarCla(sock, jid, nome, raw.split(' ').slice(1).join(' '))
    if (texto.startsWith('!entrar-cla ')) return entrarCla(sock, jid, nome, raw.split(' ').slice(1).join(' '))
    if (texto === '!sair-cla') return sairCla(sock, jid, nome)
    if (texto === '!clans') return verClans(sock, jid)
    if (texto.startsWith('!cla representante ')) {
      const alvo = texto.split(' ').slice(2).join(' ').replace('@', '').trim()
      return elegerRepresentante(sock, jid, nome, alvo)
    }
    if (texto.startsWith('!cla ')) return verCla(sock, jid, raw.split(' ').slice(1).join(' '))

    // ─── GUILDAS ─────────────────────────────────────────────
    if (texto.startsWith('!criar-guilda ')) return criarGuilda(sock, jid, nome, raw.split(' ').slice(1).join(' '))
    if (texto.startsWith('!entrar-guilda ')) return entrarGuilda(sock, jid, nome, raw.split(' ').slice(1).join(' '))
    if (texto === '!sair-guilda') return sairGuilda(sock, jid, nome)
    if (texto === '!guildas') return verGuildas(sock, jid)
    if (texto.startsWith('!guilda ')) return verGuilda(sock, jid, raw.split(' ').slice(1).join(' '))
    // ─── GUERRA DE GUILDAS ──────────────────────────────────
if (texto === '!guerra') return iniciarGuerraGuildas(sock, jid, nome)
if (texto === '!guerra lutar') return lutarGuerra(sock, jid, nome)
if (texto === '!guerra status') return statusGuerra(sock, jid)

// ─── EVENTO GLOBAL ─────────────────────────────────────
if (texto === '!evento') return iniciarEventoGlobal(sock, jid, nome)
if (texto === '!evento atacar') return atacarEvento(sock, jid, nome)
if (texto === '!evento status') return statusEvento(sock, jid)
    // ─── CASAMENTO ───────────────────────────────────────────
    if (texto.startsWith('!propor ')) return propor(sock, jid, nome, raw.split(' ').slice(1).join(' '))
    if (texto === '!aceitar-casamento') return aceitarCasamento(sock, jid, nome)
    if (texto === '!recusar-casamento') return recusarCasamento(sock, jid, nome)
    if (texto === '!divorcio') return divorcio(sock, jid, nome)
    if (texto === '!casal') return verCasal(sock, jid, nome)

    // ─── MISSÕES ─────────────────────────────────────────────
    if (texto === '!missoes') return verMissoes(sock, jid, nome)

    // ─── STICKERS ────────────────────────────────────────────
    if (texto === '!sticker') return imagemParaSticker(sock, jid, msg)
    if (texto.startsWith('!reacao ')) return stickerReacao(sock, jid, texto.split(' ')[1])

    // ─── GATILHOS AUTO ───────────────────────────────────────
    const gatilho = verificarGatilho(texto)
    if (gatilho) { await sock.sendMessage(jid, { text: gatilho }); return }

    // ─── AJUDA ───────────────────────────────────────────────
    if (texto === '!ajuda' || texto.startsWith('!ajuda ')) {
      const cat = texto.split(' ')[1] || ''
      return ajuda(sock, jid, cat)
    }

    // ─── DELAY HUMANIZADO em todos os comandos ────────────────
    await digitando(sock, jid, 800)
  })
}
