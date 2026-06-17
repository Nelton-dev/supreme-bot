const axios = require('axios')

// ─── BUSCAR IMAGEM DO POLLINATIONS ───────────────────────────
async function gerarImagemPollinations(prompt, largura = 512, altura = 512) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${largura}&height=${altura}&nologo=true&enhance=true`
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const buf = Buffer.from(res.data)
    if (buf.length > 5000) return buf
    return null
  } catch {
    return null
  }
}

// ─── BUSCAR IMAGEM DE PERSONAGEM VIA ANILIST ─────────────────
async function buscarImagemPersonagem(nome) {
  const query = `
    query ($search: String) {
      Character(search: $search) {
        name { full }
        image { large }
      }
    }
  `
  try {
    const res = await axios.post('https://graphql.anilist.co', {
      query, variables: { search: nome }
    })
    const imgUrl = res.data?.data?.Character?.image?.large
    if (!imgUrl) return null
    const img = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 15000 })
    return Buffer.from(img.data)
  } catch {
    return null
  }
}

// ─── BUSCAR IMAGEM DE ANIME VIA ANILIST ──────────────────────
async function buscarImagemAnime(nome) {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        title { romaji }
        coverImage { large }
      }
    }
  `
  try {
    const res = await axios.post('https://graphql.anilist.co', {
      query, variables: { search: nome }
    })
    const imgUrl = res.data?.data?.Media?.coverImage?.large
    if (!imgUrl) return null
    const img = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 15000 })
    return Buffer.from(img.data)
  } catch {
    return null
  }
}

// ════════════════════════════════════════
//  CARD DE PERFIL
// ════════════════════════════════════════
async function enviarCardPerfil(sock, jid, nome, user) {
  const nivel = user.nivel || 1
  const xp = user.xp || 0
  const pontos = user.pontos || 0
  const titulo = user.titulo || 'Novato'
  const vitorias = user.vitorias || 0
  const ataque = user.ataque || 10
  const vida = user.vida || 100
  const hab = user.habilidade_ativa || 'nenhuma'
  const pet = user.pet_ativo || 'nenhum'
  const barra = '█'.repeat(Math.min(nivel, 10)) + '░'.repeat(10 - Math.min(nivel, 10))

  const caption = `👤 *${nome}*\n🏅 ${titulo}\n\n⭐ Nível: ${nivel} [${barra}]\n✨ XP: ${xp}\n💰 Pontos: ${pontos}\n⚔️ Ataque: ${ataque}\n❤️ Vida: ${vida}\n🏆 Vitórias: ${vitorias}\n⚡ Habilidade: ${hab}\n🐾 Pet: ${pet}\n🎒 Itens: ${user.inventario?.length || 0}`

  // Gera imagem de perfil estilo anime
  const prompt = `anime character profile card, ${titulo}, level ${nivel}, warrior, epic, dark background, glowing stats`
  const img = await gerarImagemPollinations(prompt, 512, 512)

  if (img) {
    await sock.sendMessage(jid, { image: img, caption })
  } else {
    await sock.sendMessage(jid, { text: caption })
  }
}

// ════════════════════════════════════════
//  RANKING COM PÓDIO
// ════════════════════════════════════════
async function enviarRankingComImagem(sock, jid, sorted, top3) {
  const medals = ['🥇','🥈','🥉']

  // 🧠 separa os tiers
  const elite = sorted.slice(0, 3)
  const resto = sorted.slice(3)

  const eliteText = elite
    .map(([n, u], i) =>
      `${medals[i]} *${n}*\n   ⭐ Nv ${u.nivel} | ${u.xp} XP | 💰 ${u.pontos} pts`
    )
    .join('\n\n')

  const restoText = resto
    .map(([n, u], i) =>
      `• ${n} — Nv ${u.nivel} | ${u.xp} XP`
    )
    .join('\n')

  const caption =
`🏆 *RANKING GERAL*

🔥 *TOP PLAYERS*
${eliteText}

━━━━━━━━━━━━━━
📊 *RESTO DO SERVIDOR*
${restoText}

⚡ Atualiza jogando mais para subir no ranking`

  // 🎨 prompt mais “game UI”
  const topNames = elite.map(([n]) => n).join(', ')

  const prompt =
`anime game leaderboard UI, futuristic holographic ranking screen, neon interface, top players ${topNames}, cyberpunk style, glowing panels, competitive game interface`

  const img = await gerarImagemPollinations(prompt, 768, 512)

  if (img) {
    await sock.sendMessage(jid, {
      image: img,
      caption
    })
  } else {
    await sock.sendMessage(jid, { text: caption })
  }
}

// ════════════════════════════════════════
//  BOAS-VINDAS COM IMAGEM
// ════════════════════════════════════════
async function enviarBoasVindasComImagem(sock, jid, nome, mensagem) {
  const prompt = `anime welcome scene, new character arriving, cherry blossoms, warm light, group of friends welcoming, colorful, joyful`
  const img = await gerarImagemPollinations(prompt, 512, 384)

  if (img) {
    await sock.sendMessage(jid, { image: img, caption: mensagem })
  } else {
    await sock.sendMessage(jid, { text: mensagem })
  }
}

// ════════════════════════════════════════
//  WAIFU COM FOTO REAL
// ════════════════════════════════════════
async function enviarWaifuComImagem(sock, jid, waifu, husbando) {
  const txt = `💖 *WAIFU & HUSBANDO DO DIA* 💖\n\n🌸 *Waifu:* ${waifu.nome}\n📺 ${waifu.anime}\n💬 "${waifu.descricao}"\n\n💪 *Husbando:* ${husbando.nome}\n📺 ${husbando.anime}\n💬 "${husbando.descricao}"`

  // Tenta buscar imagem real da waifu via AniList
  const img = await buscarImagemPersonagem(waifu.nome)

  if (img) {
    await sock.sendMessage(jid, { image: img, caption: txt })
  } else {
    // Fallback — gera imagem via Pollinations
    const prompt = `anime girl ${waifu.nome} from ${waifu.anime}, beautiful, detailed, high quality portrait`
    const imgGerada = await gerarImagemPollinations(prompt, 512, 512)
    if (imgGerada) {
      await sock.sendMessage(jid, { image: imgGerada, caption: txt })
    } else {
      await sock.sendMessage(jid, { text: txt })
    }
  }
}

// ════════════════════════════════════════
//  VITÓRIA NO TORNEIO
// ════════════════════════════════════════
async function enviarVitoriaTorneio(sock, jid, campeao) {
  const prompt = `anime champion victory, ${campeao} winner, golden trophy, epic celebration, crowd, confetti, dramatic lighting, anime style`
  const img = await gerarImagemPollinations(prompt, 512, 384)

  const txt = `🎉 *TORNEIO ENCERRADO!*\n\n👑 *CAMPEÃO: ${campeao}*\n\n+150 XP | +120 pontos\n🎁 Título: 🏆 Campeão do Torneio\n🎁 Habilidade: 🔱 Modo Seis Caminhos`

  if (img) {
    await sock.sendMessage(jid, { image: img, caption: txt })
  } else {
    await sock.sendMessage(jid, { text: txt })
  }
}

// ════════════════════════════════════════
//  LEVEL UP
// ════════════════════════════════════════
async function enviarLevelUp(sock, jid, nome, novoNivel, novoTitulo) {
  const prompt = `anime level up scene, power explosion, ${novoTitulo}, aura glowing, dramatic, epic transformation, level ${novoNivel}`
  const img = await gerarImagemPollinations(prompt, 512, 384)

  const txt = `🆙 *LEVEL UP!*\n\n*${nome}* subiu para o nível *${novoNivel}*!\n🏅 Novo título: *${novoTitulo}*\n\n💪 Continua a jogar para subir mais!`

  if (img) {
    await sock.sendMessage(jid, { image: img, caption: txt })
  } else {
    await sock.sendMessage(jid, { text: txt })
  }
}

// ════════════════════════════════════════
//  VITÓRIA EM BATALHA
// ════════════════════════════════════════
async function enviarVitoriaBatalha(sock, jid, vencedor, perdedor) {
  const prompt = `anime battle victory, ${vencedor} defeats ${perdedor}, epic pose, power aura, dramatic sky, anime style`
  const img = await gerarImagemPollinations(prompt, 512, 384)

  const txt = `🏆 *${vencedor}* venceu a batalha!\n⚔️ *${perdedor}* foi derrotado!\n\n+50 XP | +30 pontos`

  if (img) {
    await sock.sendMessage(jid, { image: img, caption: txt })
  } else {
    await sock.sendMessage(jid, { text: txt })
  }
}

module.exports = {
  enviarCardPerfil,
  enviarRankingComImagem,
  enviarBoasVindasComImagem,
  enviarWaifuComImagem,
  enviarVitoriaTorneio,
  enviarLevelUp,
  enviarVitoriaBatalha,
  buscarImagemPersonagem,
  buscarImagemAnime,
}
