const { getUser } = require('../db')

// ════════════════════════════════════════
//  ENTRADAS DO CODEX
// ════════════════════════════════════════

const ENTRADAS_CODEX = [
  {
    id: 'criador',
    titulo: 'Nelton, o Criador Incriado',
    categoria: 'Origens',
    desbloqueio: 'despertar',
    conteudo: 'No princípio, antes de todos os mundos, existia apenas uma consciência: Nelton, o Criador Incriado. Ele não foi gerado — ele simplesmente sempre foi. Do seu primeiro sonho, nasceu o Nexus. Do seu primeiro suspiro, surgiram os Pilares. Dizem os antigos que ele ainda sonha, e cada sonho seu cria um novo universo.\n\n"Eu vi o vazio e sonhei com a luz. E a luz obedeceu." — Nelton, O Sonhador'
  },
  {
    id: 'vazio',
    titulo: 'O Vazio Infinito',
    categoria: 'Origens',
    desbloqueio: 'despertar',
    conteudo: 'Antes do Nexus, existia o Vazio — uma dimensão de pura energia caótica onde a existência e a inexistência dançavam juntas. O Vazio não é maligno nem benigno: ele simplesmente é. É a tela em branco sobre a qual Nelton pintou a realidade.\n\nMas o Vazio também tem fome. Ele constantemente tenta consumir o que foi criado. E cabe aos Caçadores mantê-lo sob controle.'
  },
  {
    id: 'pilares',
    titulo: 'Os Sete Pilares Primordiais',
    categoria: 'Origens',
    desbloqueio: 'rank_d',
    conteudo: 'Para estabilizar o Nexus, Nelton criou os Sete Pilares Primordiais: Ignis (Fogo), Aquor (Água), Terra (Natureza), Fulgor (Trovão), Petra (Terra), Umbra (Trevas) e Lux (Luz). Cada Pilar representa um elemento fundamental e mantém o equilíbrio do universo.\n\nQuando um Caçador desperta, um dos Pilares o abençoa com seu elemento. Esta ligação é eterna e define o destino do Caçador.'
  },
  {
    id: 'nexus',
    titulo: 'A Criação do Nexus',
    categoria: 'História',
    desbloqueio: 'rank_c',
    conteudo: 'O Nexus World foi criado como um ponto de convergência entre todos os mundos sonhados por Nelton. Aqui, as almas dos guerreiros caídos renascem como Caçadores, destinados a proteger a criação contra as forças do Vazio.\n\nO Nexus é ao mesmo tempo um campo de batalha e um refúgio. Suas paisagens mudam constantemente, refletindo o estado dos Pilares.'
  },
  {
    id: 'cacadores',
    titulo: 'A Ordem dos Caçadores',
    categoria: 'Sociedade',
    desbloqueio: 'rank_b',
    conteudo: 'Os Caçadores são guerreiros despertados pelo Sistema para proteger o Nexus. Cada um carrega a centelha de um Pilar e luta para evoluir, subindo de rank e desbloqueando novos poderes.\n\nA Ordem não tem líderes — apenas o Sistema e o próprio Nelton guiam os Caçadores. Mas entre eles, surgem lendas que inspiram gerações.'
  },
  {
    id: 'elementos',
    titulo: 'A Guerra Elemental',
    categoria: 'História',
    desbloqueio: 'missao_pilar',
    conteudo: 'Houve um tempo em que os próprios Pilares entraram em conflito. A Guerra Elemental devastou o Nexus primitivo, e apenas a intervenção direta de Nelton restaurou a paz.\n\nDesde então, os elementos coexistem em equilíbrio, mas a rivalidade nunca desapareceu completamente. Nos torneios e masmorras, os Caçadores revivem essa guerra ancestral.'
  },
  {
    id: 'guildas',
    titulo: 'As Primeiras Guildas',
    categoria: 'Sociedade',
    desbloqueio: 'entrar_guilda',
    conteudo: 'Quando o Vazio começou a lançar ataques coordenados, os Caçadores perceberam que sozinhos não sobreviveriam. Assim nasceram as Guildas: alianças de guerreiros unidos por um propósito comum.\n\nA primeira Guilda foi fundada por um Caçador cujo nome se perdeu no tempo, mas seu legado vive em cada Guilda que existe hoje.'
  },
  {
    id: 'torneios',
    titulo: 'As Arenas Sagradas',
    categoria: 'Cultura',
    desbloqueio: 'vencer_torneio',
    conteudo: 'As Arenas do Nexus são mais do que campos de batalha — são templos onde os Pilares testam a força dos Caçadores. Cada arena é consagrada a um elemento, e aqueles que lutam em sintonia com a arena recebem bênçãos divinas.\n\nDiz a lenda que o próprio Nelton já desceu às arenas para lutar ao lado dos Caçadores em tempos de grande necessidade.'
  },
  {
    id: 'masmorra',
    titulo: 'As Masmorras do Vazio',
    categoria: 'Ameaças',
    desbloqueio: 'derrotar_bosses',
    conteudo: 'As Masmorras são portais para o Vazio que aparecem aleatoriamente no Nexus. Dentro delas, criaturas corrompidas guardam tesouros e fragmentos de poder.\n\nCada Caçador pode enfrentar uma Masmorra por dia. Os que sobrevivem voltam mais fortes. Os que falham... bem, o Vazio sempre tem fome.'
  },
  {
    id: 'corrupcao',
    titulo: 'A Corrupção dos Pilares',
    categoria: 'Ameaças',
    desbloqueio: 'rank_a',
    conteudo: 'Algo sombrio está a acontecer. Os Pilares, que deveriam ser eternos, começam a mostrar sinais de corrupção. O Vazio está a encontrar brechas na criação de Nelton.\n\nApenas os Caçadores mais poderosos podem perceber essa corrupção e lutar contra ela. O destino do Nexus depende disso.'
  },
  {
    id: 'esperanca',
    titulo: 'A Profecia do Escolhido',
    categoria: 'Profecia',
    desbloqueio: 'rank_s',
    conteudo: '"Quando o Vazio ameaçar consumir tudo, um Caçador ascenderá além dos Pilares. Ele carregará a luz de todos os elementos e o sonho do Criador. Ele será o Escolhido, e sob seu comando, o Nexus renascerá."\n\n— Fragmento da Profecia dos Pilares, encontrado nas ruínas do primeiro Templo.'
  },
  {
    id: 'legado',
    titulo: 'O Sonho de Nelton',
    categoria: 'Profecia',
    desbloqueio: 'todas_missoes',
    conteudo: '"Eu sonhei com um mundo onde guerreiros de todas as eras lutassem juntos. Onde a força não viesse do poder bruto, mas da vontade de proteger. O Nexus é esse sonho. E cada Caçador é uma peça dele.\n\nSe um dia eu desaparecer, o Nexus continuará — enquanto houver Caçadores dispostos a lutar."\n\n— Últimas palavras registradas de Nelton, O Sonhador'
  },
  {
    id: 'guerra_guildas',
    titulo: 'Guerra entre Guildas',
    categoria: 'Sociedade',
    desbloqueio: 'rank_c',
    conteudo: 'A história das Guildas é marcada por alianças e disputas. Nas Grandes Guerras de Guildas, facções lutaram pelo controle de territórios sagrados, arenas e recursos do Nexus. A vitória não dependia apenas da força, mas da inteligência, da união e da estratégia.\n\nAinda hoje, as Guildas mais antigas são reverenciadas como guardiãs do equilíbrio e como as responsáveis pela paz entre as facções.'
  },
  {
    id: 'fragmentos',
    titulo: 'Fragmentos da Lore',
    categoria: 'Arcanum',
    desbloqueio: 'rank_b',
    conteudo: 'Fragmentos da Lore são pedaços de memória gravados no próprio tecido do Nexus. Eles aparecem como itens raros e podem conter visões dos mundos anteriores, segredos sobre as arenas e dicas sobre a corrupção dos Pilares.\n\nDizem que quem reúne fragmentos suficientes pode desvendar o passado de Nelton e ganhar acesso a habilidades escondidas.'
  },
  {
    id: 'agentes',
    titulo: 'Os Agentes do Sistema',
    categoria: 'Sociedade',
    desbloqueio: 'rank_d',
    conteudo: 'O Sistema do Nexus não age sozinho. Ele possui agentes — espíritos de dados e entidades etéreas — que observam os Caçadores, gerenciam eventos, distribuem missões e restauram o equilíbrio quando as eras se desequilibram.\n\nOs agentes sussurram através de mensagens enviadas pelos Pilares, guiam aventureiros e, às vezes, testam a coragem dos mais audaciosos.'
  }
]

// ════════════════════════════════════════
//  VER CODEX
// ════════════════════════════════════════
async function verCodex(sock, jid, entradaId) {
  const user = getUser(jid.split('@')[0]) || {}

  if (entradaId) {
    const entrada = ENTRADAS_CODEX.find(e => e.id === entradaId)
    if (!entrada) {
      await sock.sendMessage(jid, { text: '📖 Entrada do Codex não encontrada!' })
      return
    }

    const desbloqueada = verificarDesbloqueio(entrada.desbloqueio, user)
    if (!desbloqueada) {
      await sock.sendMessage(jid, { text: '🔒 Esta entrada ainda está escondida nas ruínas do Nexus. Continue a sua jornada e os Pilares revelarão o seu segredo.' })
      return
    }

    const txt = '📖 *CODEX DO NEXUS*\n\n*' + entrada.titulo + '*\n📂 ' + entrada.categoria + '\n\nAs páginas do Nexus foram preservadas para os Caçadores que ainda procuram a verdade.\n\n' + entrada.conteudo
    await sock.sendMessage(jid, { text: txt })
    return
  }

  // Mostrar todas as entradas
  const categorias = {}
  ENTRADAS_CODEX.forEach(e => {
    if (!categorias[e.categoria]) categorias[e.categoria] = []
    categorias[e.categoria].push(e)
  })

  let txt = '📖 *CODEX DO NEXUS WORLD*\n\nAs páginas abaixo foram preservadas pelo Sistema para os escolhidos que ousam lembrar.\n\n'
  for (const [cat, entradas] of Object.entries(categorias)) {
    txt += '*── ' + cat + ' ──*\n'
    entradas.forEach(e => {
      const desbloqueada = verificarDesbloqueio(e.desbloqueio, user)
      txt += (desbloqueada ? '✅' : '🔒') + ' *' + e.titulo + '* (`' + e.id + '`)\n'
    })
    txt += '\n'
  }
  txt += 'Use *!codex <id>* para ler uma entrada!'

  await sock.sendMessage(jid, { text: txt })
}

// ════════════════════════════════════════
//  VERIFICAR DESBLOQUEIO
// ════════════════════════════════════════
function verificarDesbloqueio(tipo, user) {
  if (tipo === 'despertar') return user.despertou === true
  if (tipo === 'rank_d') return ['D','C','B','A','S','SS','Nacional','Monarca','Divino'].includes(user.rank)
  if (tipo === 'rank_c') return ['C','B','A','S','SS','Nacional','Monarca','Divino'].includes(user.rank)
  if (tipo === 'rank_b') return ['B','A','S','SS','Nacional','Monarca','Divino'].includes(user.rank)
  if (tipo === 'rank_a') return ['A','S','SS','Nacional','Monarca','Divino'].includes(user.rank)
  if (tipo === 'rank_s') return ['S','SS','Nacional','Monarca','Divino'].includes(user.rank)
  if (tipo === 'missao_pilar') return true // Simplificado
  if (tipo === 'entrar_guilda') return true // Simplificado
  if (tipo === 'vencer_torneio') return (user.vitorias || 0) > 0
  if (tipo === 'derrotar_bosses') return true // Simplificado
  if (tipo === 'todas_missoes') return true // Simplificado
  return false
}

module.exports = {
  verCodex
}
