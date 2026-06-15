const axios = require('axios')

const URL = 'https://graphql.anilist.co'

// ─── BUSCAR ANIME ────────────────────────────────────────────
async function buscarAnime(sock, jid, nome) {
  await sock.sendMessage(jid, { text: `🔍 Buscando "${nome}"...` })

  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        title { romaji english native }
        description(asHtml: false)
        episodes
        status
        averageScore
        genres
        startDate { year month day }
        studios(isMain: true) { nodes { name } }
        siteUrl
        coverImage { large }
      }
    }
  `

  try {
    const res = await axios.post(URL, {
      query,
      variables: { search: nome }
    })

    const m = res.data.data.Media
    if (!m) {
      await sock.sendMessage(jid, { text: `❌ Anime "${nome}" não encontrado.` })
      return
    }

    const titulo = m.title.english || m.title.romaji || m.title.native
    const tituloJP = m.title.native || ''
    const desc = m.description
      ? m.description.replace(/<[^>]+>/g, '').slice(0, 300) + '...'
      : 'Sem descrição.'
    const status = {
      FINISHED: '✅ Finalizado',
      RELEASING: '📺 Em exibição',
      NOT_YET_RELEASED: '⏳ Não lançado',
      CANCELLED: '❌ Cancelado'
    }[m.status] || m.status

    const studio = m.studios?.nodes?.[0]?.name || 'Desconhecido'
    const generos = m.genres?.join(', ') || 'N/A'
    const nota = m.averageScore ? `${m.averageScore}/100` : 'N/A'
    const eps = m.episodes || '?'
    const ano = m.startDate?.year || '?'

    // Envia capa como imagem
    if (m.coverImage?.large) {
      try {
        const imgRes = await axios.get(m.coverImage.large, { responseType: 'arraybuffer' })
        await sock.sendMessage(jid, {
          image: Buffer.from(imgRes.data),
          caption: `🎌 *${titulo}*\n🇯🇵 ${tituloJP}\n\n📖 ${desc}\n\n📺 Episódios: ${eps}\n📅 Ano: ${ano}\n🎬 Studio: ${studio}\n🏷️ Géneros: ${generos}\n⭐ Nota: ${nota}\n📊 Status: ${status}\n\n🔗 ${m.siteUrl}`
        })
        return
      } catch (_) {}
    }

    // Fallback sem imagem
    await sock.sendMessage(jid, {
      text: `🎌 *${titulo}*\n🇯🇵 ${tituloJP}\n\n📖 ${desc}\n\n📺 Episódios: ${eps}\n📅 Ano: ${ano}\n🎬 Studio: ${studio}\n🏷️ Géneros: ${generos}\n⭐ Nota: ${nota}\n📊 Status: ${status}\n\n🔗 ${m.siteUrl}`
    })

  } catch (err) {
    console.error('AniList erro:', err.message)
    await sock.sendMessage(jid, { text: '❌ Erro ao buscar anime. Tenta novamente!' })
  }
}

// ─── BUSCAR PERSONAGEM ───────────────────────────────────────
async function buscarPersonagem(sock, jid, nome) {
  await sock.sendMessage(jid, { text: `🔍 Buscando personagem "${nome}"...` })

  const query = `
    query ($search: String) {
      Character(search: $search) {
        name { full native }
        description(asHtml: false)
        gender
        age
        image { large }
        media(perPage: 3) {
          nodes { title { romaji } }
        }
        siteUrl
      }
    }
  `

  try {
    const res = await axios.post(URL, { query, variables: { search: nome } })
    const c = res.data.data.Character

    if (!c) {
      await sock.sendMessage(jid, { text: `❌ Personagem "${nome}" não encontrado.` })
      return
    }

    const desc = c.description
      ? c.description.replace(/<[^>]+>/g, '').slice(0, 300) + '...'
      : 'Sem descrição.'
    const animes = c.media?.nodes?.map(n => n.title.romaji).join(', ') || 'N/A'

    if (c.image?.large) {
      try {
        const imgRes = await axios.get(c.image.large, { responseType: 'arraybuffer' })
        await sock.sendMessage(jid, {
          image: Buffer.from(imgRes.data),
          caption: `👤 *${c.name.full}*\n🇯🇵 ${c.name.native || ''}\n\n📖 ${desc}\n\n⚧️ Género: ${c.gender || 'N/A'}\n🎂 Idade: ${c.age || 'N/A'}\n📺 Aparece em: ${animes}\n\n🔗 ${c.siteUrl}`
        })
        return
      } catch (_) {}
    }

    await sock.sendMessage(jid, {
      text: `👤 *${c.name.full}*\n\n📖 ${desc}\n\n📺 Aparece em: ${animes}\n🔗 ${c.siteUrl}`
    })

  } catch (err) {
    console.error('AniList personagem erro:', err.message)
    await sock.sendMessage(jid, { text: '❌ Erro ao buscar personagem!' })
  }
}

// ─── TOP ANIMES ──────────────────────────────────────────────
async function topAnimes(sock, jid) {
  const query = `
    query {
      Page(perPage: 10) {
        media(sort: SCORE_DESC, type: ANIME, status: FINISHED) {
          title { romaji }
          averageScore
          genres
          episodes
        }
      }
    }
  `

  try {
    const res = await axios.post(URL, { query })
    const lista = res.data.data.Page.media
    const medals = ['🥇','🥈','🥉']
    let txt = '🏆 *TOP 10 ANIMES (AniList)*\n\n'
    lista.forEach((a, i) => {
      txt += `${medals[i] || `${i+1}.`} *${a.title.romaji}*\n   ⭐ ${a.averageScore}/100 | ${a.episodes || '?'} eps\n   🏷️ ${a.genres.slice(0,2).join(', ')}\n\n`
    })
    await sock.sendMessage(jid, { text: txt })
  } catch (err) {
    await sock.sendMessage(jid, { text: '❌ Erro ao buscar top animes!' })
  }
}

// ─── ANIME DA TEMPORADA ──────────────────────────────────────
async function animeTemporada(sock, jid) {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = agora.getMonth()
  const temporada = mes < 3 ? 'WINTER' : mes < 6 ? 'SPRING' : mes < 9 ? 'SUMMER' : 'FALL'

  const query = `
    query ($season: MediaSeason, $year: Int) {
      Page(perPage: 8) {
        media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC) {
          title { romaji }
          averageScore
          episodes
          status
          genres
        }
      }
    }
  `

  try {
    const res = await axios.post(URL, { query, variables: { season: temporada, year: ano } })
    const lista = res.data.data.Page.media
    const nomes = { WINTER:'❄️ Inverno', SPRING:'🌸 Primavera', SUMMER:'☀️ Verão', FALL:'🍂 Outono' }

    let txt = `📺 *ANIME DA TEMPORADA*\n${nomes[temporada]} ${ano}\n\n`
    lista.forEach((a, i) => {
      const status = a.status === 'RELEASING' ? '📡' : '✅'
      txt += `${i+1}. ${status} *${a.title.romaji}*\n   ⭐ ${a.averageScore || '?'}/100 | ${a.episodes || '?'} eps\n   🏷️ ${a.genres.slice(0,2).join(', ')}\n\n`
    })
    await sock.sendMessage(jid, { text: txt })
  } catch (err) {
    await sock.sendMessage(jid, { text: '❌ Erro ao buscar temporada!' })
  }
}

module.exports = { buscarAnime, buscarPersonagem, topAnimes, animeTemporada }