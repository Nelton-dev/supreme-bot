const { enviarHumano, enviarSequencia } = require('./humano')

// ─── MENUS POR CATEGORIA ─────────────────────────────────────

const menus = {

  principal: `🤖 *Nexus Guide — Menu do Caçador*

Olá! Sou o teu guia no Nexus World, aqui para orientar os escolhidos na sua jornada. 🌌
Escolhe uma categoria para ver os comandos:

🎮 *!ajuda jogos* — Todos os jogos disponíveis
🏆 *!ajuda torneio* — Como funcionam os torneios
👥 *!ajuda social* — Clãs, casamentos e missões
🤖 *!ajuda ia* — Comandos de inteligência artificial
🎨 *!ajuda media* — Imagens, áudio e stickers
🔍 *!ajuda anime* — Pesquisar animes e personagens
📊 *!ajuda perfil* — Perfil, ranking e loja
👑 *!ajuda admin* — Comandos exclusivos de admin
📖 *!ajuda tudo* — Ver absolutamente tudo

💡 *Dica:* Usa o nome do comando seguido de *!ajuda*
Ex: *!quiz* → não sabes usar? Digita *!ajuda jogos*`,

  jogos: `🎮 *JOGOS — Como jogar*

━━━━ 📝 QUIZ ━━━━
*!quiz*
Responde a uma pergunta de anime. O primeiro a responder certo ganha XP e pontos! Tens 30 segundos.

*!quizia* / *!quizia facil* / *!quizia dificil*
Quiz criado pela IA — nunca repete perguntas! Escolhe a dificuldade.

━━━━ 🕵️ ADIVINHAR ━━━━
*!adivinhar*
O bot descreve um personagem sem dizer o nome. Adivinha quem é! Tens 60 segundos.

*!sinopse*
A IA cria uma sinopse misteriosa de um anime. Adivinha qual é!

━━━━ 🎭 FORCA ━━━━
*!forca*
Jogo da forca com palavras de anime. Usa *!letra A* para tentar letras ou *!palavra naruto* para tentar a palavra completa.

*!forcaia personagem*
Forca com palavra gerada pela IA sobre um tema. Ex: *!forcaia técnica*, *!forcaia lugar*

*!letra A*
Tenta uma letra no jogo da forca ativo.

*!palavra naruto*
Tenta adivinhar a palavra completa de uma vez.

━━━━ 🧠 MEMÓRIA ━━━━
*!memoria*
Aparecem 4 cartas (A, B, C, D) com personagens escondidos. Encontra os pares!

*!par A C*
Revela as cartas A e C para ver se são par.

━━━━ 🧞 AKINATOR ━━━━
*!akinator*
Pensa num personagem de anime — a IA vai adivinhar quem é fazendo perguntas de sim ou não!

*!sim* / *!nao*
Responde às perguntas do Akinator.

━━━━ 💬 OUTROS ━━━━
*!frase*
Completa uma frase famosa de anime. Rápido!

*!vd verdade* / *!vd desafio*
Verdade ou desafio temático de anime para ti.

*!vdia verdade* / *!vdia desafio*
Versão com IA — cada verdade/desafio é único!

📖 *!historia aventura ninja*
Inicia uma história colaborativa. Todos contribuem!

*!continuar e então ele atacou...*
Continua a história ativa.`,

  torneio: `🏟️ *TORNEIO INTERATIVO — Como funciona*

*!torneio*
Abre as inscrições por 90 segundos. Mínimo 2 participantes.

*!inscrever*
Inscreve-te no torneio aberto.

*!apostar <nome> <pontos>*
Aposta os teus pontos num lutador. Se ele vencer, recebes o dobro!

*!vertorneio* ou *!torneio status*
Vê o estado atual do torneio (inscrições ou batalha em curso).

*!torneio clans*
Inicia um torneio de clãs (interativo). Os representantes de cada clã lutam entre si. O clã vencedor ganha recompensas coletivas.

⚔️ *BATALHAS POR TURNOS:*
1️⃣ Após as inscrições, o bracket é gerado.
2️⃣ Cada batalha é por turnos: o jogador da vez usa *!atacar*.
3️⃣ Tens 60 segundos para atacar ou perdes o turno.
4️⃣ As habilidades, pets e escudos do teu perfil são usados.
5️⃣ O vencedor de cada combate avança para a próxima rodada.

🏆 *RECOMPENSAS (Torneio Normal):*
🥇 Campeão: +150 XP | +120 pts | Título exclusivo
🎁 Habilidade secreta: 🔱 Modo Seis Caminhos
⚔️ Vencedores de cada luta também ganham XP e pontos.

🏆 *TORNEIO DE CLÃS:*
Cada membro do clã vencedor recebe +80 XP e +60 pontos.
Para definir o representante do clã: *!cla representante @membro*`,

  social: `👥 *SOCIAL — Guildas, Casamento e Missões*

━━━━ ⚔️ GUILDAS ━━━━
*!criar-cla Akatsuki*
Cria uma guilda com o nome que escolheres. Custa 100 pontos. O emblema é sorteado automaticamente.

*!entrar-cla Akatsuki*
Junta-te a um clã existente. Só podes estar num clã de cada vez.

*!sair-cla*
Sai do teu clã atual. Se fores o líder e ainda há membros, passa a liderança primeiro.

*!clans*
Mostra todos os clãs do grupo ordenados por XP.

*!cla Akatsuki*
Mostra os detalhes de um clã específico: membros, líder, XP, nível.

*!cla representante @membro*
Define o representante do teu clã para torneios de clãs. Só pode ser um membro do próprio clã.

━━━━ 💍 CASAMENTO ━━━━
*!propor Sakura*
Pede alguém em casamento no grupo. A pessoa tem de aceitar ou recusar.

*!aceitar-casamento*
Aceita a proposta de casamento. Ambos ganham +30 XP!

*!recusar-casamento*
Recusa a proposta. Que drama! 😢

*!casal*
Mostra com quem estás casado(a).

*!divorcio*
Encerra o casamento. Fim de uma era...

━━━━ 📋 MISSÕES ━━━━
*!missoes*
Mostra todas as tuas missões e o progresso atual. As missões atualizam automaticamente quando jogas!

🎯 *Exemplos de missões:*
• Acerta 5 quizzes → +80 XP
• Vence 3 batalhas → +100 XP
• Completa desafio diário 3 dias → +90 XP`,

  ia: `🤖 *INTELIGÊNCIA ARTIFICIAL*

━━━━ 💬 CHAT ━━━━
*!ia qual é o anime mais triste?*
Conversa livremente com a IA sobre qualquer assunto de anime. Ela lembra o contexto da conversa!

*bot, quem é mais forte Goku ou Saitama?*
Também podes mencionar "AnimeBot" ou "bot," no início para chamar a IA sem comando.

*!limpar*
Apaga o histórico da tua conversa com a IA. Útil para mudar de assunto.

━━━━ 📖 INFORMAÇÃO ━━━━
*!resumo One Piece*
Resumo completo de um anime: sinopse, personagens, pontos fortes/fracos e nota.

*!analisar Itachi*
Análise profunda de um personagem: personalidade, poderes, desenvolvimento, momentos icônicos.

*!recomendar ação e aventura*
Recebe 5 recomendações personalizadas com base nos teus gostos.

*!comparar Naruto vs Bleach*
Compara dois animes ou personagens lado a lado.

*!curiosidade Naruto*
Uma curiosidade surpreendente e pouco conhecida sobre um anime ou personagem.

*!traduzir Nakama*
Traduz palavras japonesas de anime com contexto de uso e exemplos.

━━━━ 🎤 DEBATE ━━━━
*!debate Naruto vs Luffy, quem é melhor?*
Inicia um debate no grupo. A IA modera e comenta os argumentos!

*!argumento O Naruto tem mais determinação*
Adiciona o teu argumento no debate ativo.

*!encerrar*
Encerra o debate e a IA declara um vencedor com resumo.`,

  media: `🎨 *MEDIA — Imagens, Áudio e Stickers*

━━━━ 🖼️ IMAGENS ━━━━
*!img naruto com rinnegan*
Gera uma imagem estilo anime com o que descreveres. Pode demorar 30s!

*!img arte samurai ao pôr do sol*
Estilo artístico mais elaborado.

*!img retrato waifu cabelo azul*
Retrato focado num personagem.

━━━━ 🎵 ÁUDIO ━━━━
*!musica epic battle dark*
Compõe uma música de anime com o tema que escolheres. Demora até 1 minuto.

*!voz Eu nunca desistirei, esse é o meu nindo!*
Converte qualquer texto em voz.

*!frase*
Gera um áudio com uma frase épica de anime.

━━━━ 🎭 STICKERS ━━━━
*!sticker*
Envia uma imagem com a legenda !sticker e ela vira sticker automaticamente!

*!reacao feliz*
Envia um GIF animado de reação de anime.
Opções: *feliz, triste, bravo, surpreso, danca*

━━━━ 🌸 WAIFU ━━━━
*!waifu*
Mostra a waifu e husbando do dia. Muda todos os dias!`,

  anime: `🔍 *PESQUISAR ANIME*

*!anime One Piece*
Informação completa de um anime: sinopse, episódios, ano, studio, géneros, nota e link.

*!personagem Monkey D. Luffy*
Ficha completa de um personagem com foto: descrição, idade, género, animes onde aparece.

*!top*
Top 10 melhores animes de todos os tempos segundo o AniList.

*!temporada*
Animes que estão a ser transmitidos na temporada atual.

💡 *Tudo gratuito via AniList — sem chave de API!*`,

  perfil: `📊 *PERFIL, RANKING E LOJA*

━━━━ 👤 PERFIL ━━━━
*!perfil*
Mostra o teu perfil completo: nível, XP, pontos, título, ataque, vida, vitórias e itens.

━━━━ 🏆 RANKING ━━━━
*!ranking*
Top 10 do grupo ordenado por XP. Vê onde estás na tabela!

━━━━ 🌟 DIÁRIO ━━━━
*!diario*
Mostra o desafio do dia. Responde no grupo e completa para ganhar recompensa!

*!completar*
Usa depois de responder ao desafio diário para receber os pontos. +30 XP | +25 pts

━━━━ 🏪 LOJA ━━━━
*!loja*
Mostra todos os itens disponíveis para comprar com pontos.

*!comprar vip*
Compra um item da loja usando o ID. Ex: vip, espadachim, kage, deus, boost_ataque, boost_vida

🎯 *Como ganhar pontos:*
Joga quiz, vence batalhas, completa desafios diários e missões!`,

  admin: `👑 *COMANDOS DE ADMIN*
Apenas administradores do grupo podem usar estes comandos.

━━━━ 👥 MEMBROS ━━━━
*!add 841234567*
Adiciona um número ao grupo. O número é automaticamente formatado com +258.

*!kick 841234567*
Remove um membro do grupo.

*!promover 841234567*
Promove um membro a administrador.

*!rebaixar 841234567*
Remove os privilégios de admin de um membro.

━━━━ 📢 GRUPO ━━━━
*!anuncio <texto>*
Envia um anúncio oficial com destaque visual.

*!silenciar*
Apenas admins podem enviar mensagens.

*!abrir*
Todos voltam a poder enviar mensagens.

*!infogrupo*
Mostra informações do grupo: membros, admins, data de criação.

━━━━ 🛡️ MODERAÇÃO ━━━━
*!antilink on* / *!antilink off*
Ativa/desativa bloqueio automático de links. Admins ficam isentos.

*!filtro palavrão*
Adiciona uma palavra proibida. Mensagens com ela são apagadas automaticamente.

━━━━ 👋 BOAS-VINDAS ━━━━
*!boasvindas on* / *!boasvindas off*
Ativa ou desativa a mensagem automática quando alguém entra.

*!setboasvindas Bem-vindo {nome}!*
Personaliza a mensagem de boas-vindas. Use {nome} onde quer que apareça o nome do novo membro.`
}

// ─── HANDLER DO AJUDA ────────────────────────────────────────
async function ajuda(sock, jid, categoria) {
  const cat = categoria?.toLowerCase().trim() || 'principal'
  const menu = menus[cat] || menus.principal

  if (cat === 'tudo') {
    // Envia tudo em sequência com delay entre cada secção
    const categorias = ['jogos', 'torneio', 'social', 'ia', 'media', 'anime', 'perfil', 'admin']
    await enviarHumano(sock, jid, '📖 *Enviando guia completo...* Aguenta! 😄')
    for (const c of categorias) {
      await new Promise(r => setTimeout(r, 2000))
      await enviarHumano(sock, jid, menus[c])
    }
    return
  }

  await enviarHumano(sock, jid, menu)
}

module.exports = { ajuda }
