// SQLite-based database wrapper for bot-supreme
// Maintains the same API as the original JSON-based db.js

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'bot.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Open the database
const db = new Database(DB_PATH);

// PRAGMAs for better performance and safety
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    nome TEXT PRIMARY KEY,
    xp INTEGER NOT NULL DEFAULT 0,
    nivel INTEGER NOT NULL DEFAULT 1,
    pontos INTEGER NOT NULL DEFAULT 0,
    titulo TEXT NOT NULL DEFAULT 'Novato',
    vida INTEGER NOT NULL DEFAULT 100,
    ataque INTEGER NOT NULL DEFAULT 10,
    inventario TEXT NOT NULL DEFAULT '[]', -- JSON array
    ultimoDiario INTEGER, -- timestamp
    ultimaMasmorra INTEGER, -- timestamp
    vitorias INTEGER NOT NULL DEFAULT 0,
    despertou INTEGER NOT NULL DEFAULT 0, -- boolean as 0/1
    rank TEXT,
    nivel_rank INTEGER NOT NULL DEFAULT 1,
    xp_rank INTEGER NOT NULL DEFAULT 0,
    titulo_rank TEXT,
    ultima_atividade INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    elemento TEXT,
    afinidade TEXT NOT NULL DEFAULT '{}', -- JSON object
    moralidade INTEGER NOT NULL DEFAULT 0,
    habilidades_combate TEXT NOT NULL DEFAULT '[]', -- JSON array
    buffs_ativos TEXT NOT NULL DEFAULT '[]' -- JSON array
  );
`);

// Helper functions to parse JSON fields
function parseJSON(json, fallback) {
  if (json === null || json === undefined) return fallback;
  try {
    return JSON.parse(json);
  } catch (e) {
    return fallback;
  }
}

// Helper to stringify JSON fields
function stringifyJSON(value) {
  return JSON.stringify(value);
}

// CRUD operations

// Get a user by nome, creating if not exists and criar is true
function getUser(nome, criar = true) {
  let row = db.prepare('SELECT * FROM users WHERE nome = ?').get(nome);
  if (!row && criar) {
    // Insert a new user with default values
    const now = Date.now();
    const defaultValues = {
      nome,
      xp: 0,
      nivel: 1,
      pontos: 0,
      titulo: 'Novato',
      vida: 100,
      ataque: 10,
      inventario: '[]',
      ultimoDiario: null,
      ultimaMasmorra: null,
      vitorias: 0,
      despertou: 0,
      rank: null,
      nivel_rank: 1,
      xp_rank: 0,
      titulo_rank: null,
      ultima_atividade: now,
      elemento: null,
      afinidade: '{}',
      moralidade: 0,
      habilidades_combate: '[]',
      buffs_ativos: '[]'
    };
    const placeholders = Object.keys(defaultValues).map(() => '?').join(', ');
    const columns = Object.keys(defaultValues).join(', ');
    db.prepare(`INSERT INTO users (${columns}) VALUES (${placeholders})`)
      .run(...Object.values(defaultValues));
    row = db.prepare('SELECT * FROM users WHERE nome = ?').get(nome);
  }
  if (!row) return null;

  // Convert database row to the user object format expected by the rest of the code
  return {
    xp: row.xp,
    nivel: row.nivel,
    pontos: row.pontos,
    titulo: row.titulo,
    vida: row.vida,
    ataque: row.ataque,
    inventario: parseJSON(row.inventario, []),
    ultimoDiario: row.ultimoDiario,
    ultimaMasmorra: row.ultimaMasmorra,
    vitorias: row.vitorias,
    despertou: !!row.despertou,
    rank: row.rank,
    nivel_rank: row.nivel_rank,
    xp_rank: row.xp_rank,
    titulo_rank: row.titulo_rank,
    ultima_atividade: row.ultima_atividade,
    elemento: row.elemento,
    afinidade: parseJSON(row.afinidade, {}),
    moralidade: row.moralidade,
    habilidades_combate: parseJSON(row.habilidades_combate, []),
    buffs_ativos: parseJSON(row.buffs_ativos, [])
  };
}

// Save a user object (update)
function saveUser(nome, user) {
  const now = Date.now();
  const stmt = db.prepare(`
    UPDATE users SET
      xp = ?,
      nivel = ?,
      pontos = ?,
      titulo = ?,
      vida = ?,
      ataque = ?,
      inventario = ?,
      ultimoDiario = ?,
      ultimaMasmorra = ?,
      vitorias = ?,
      despertou = ?,
      rank = ?,
      nivel_rank = ?,
      xp_rank = ?,
      titulo_rank = ?,
      ultima_atividade = ?,
      elemento = ?,
      afinidade = ?,
      moralidade = ?,
      habilidades_combate = ?,
      buffs_ativos = ?
    WHERE nome = ?
  `);
  stmt.run(
    user.xp,
    user.nivel,
    user.pontos,
    user.titulo,
    user.vida,
    user.ataque,
    stringifyJSON(user.inventario),
    user.ultimoDiario,
    user.ultimaMasmorra,
    user.vitorias,
    user.despertou ? 1 : 0,
    user.rank,
    user.nivel_rank,
    user.xp_rank,
    user.titulo_rank,
    user.ultima_atividade,
    user.elemento,
    stringifyJSON(user.afinidade),
    user.moralidade,
    stringifyJSON(user.habilidades_combate),
    stringifyJSON(user.buffs_ativos),
    nome
  );
}

// Get all users (returns an object keyed by nome)
function todosUsuarios() {
  const rows = db.prepare('SELECT nome FROM users').all();
  const result = {};
  for (const { nome } of rows) {
    result[nome] = getUser(nome, false); // criar=false to avoid creating new users
  }
  return result;
}

// Reset the cache (delete all users)
function resetarCache() {
  db.prepare('DELETE FROM users').run();
}

// Remove a specific user
function removerUsuario(nome) {
  db.prepare('DELETE FROM users WHERE nome = ?').run(nome);
}

// Add XP to rank and check for rank up
function adicionarXpRank(nome, quantidade) {
  const user = getUser(nome, false);
  if (!user || !user.despertou) return false;
  user.xp_rank = (user.xp_rank || 0) + quantidade;
  user.ultima_atividade = Date.now();
  saveUser(nome, user);
  return verificarSubidaRank(nome);
}

// Check if the user ranked up and update rank if so
function verificarSubidaRank(nome) {
  const user = getUser(nome, false);
  if (!user) return false;
  const currentRank = user.rank || 'E';
  const currentIndex = RANKS.findIndex(r => r.rank === currentRank);
  if (currentIndex === -1) return false;
  const nextRank = RANKS[currentIndex + 1];
  if (!nextRank) return false;
  if (user.xp_rank >= nextRank.xp) {
    user.rank = nextRank.rank;
    user.titulo_rank = nextRank.nome;
    user.nivel_rank = 1;
    // Reset xp_rank? In the original, they keep the excess? Actually they do not reset.
    // The original code does not reset xp_rank after rank up. We'll keep it as is.
    saveUser(nome, user);
    return true;
  }
  return false;
}

// Penalize defeat (reduce xp_rank)
function penalizarDerrota(nome, quantidade = 5) {
  const user = getUser(nome, false);
  if (!user || !user.despertou) return;
  user.xp_rank = Math.max(0, (user.xp_rank || 0) - quantidade);
  saveUser(nome, user);
}

// Apply daily tax (called every minute, checks if it's a new day at 00:00)
function aplicarTaxaDiaria() {
  const usuarios = todosUsuarios();
  const agora = Date.now();
  const doisDias = 2 * 24 * 60 * 60 * 1000; // 2 days in ms
  for (const nome in usuarios) {
    const user = usuarios[nome];
    if (!user.despertou) continue;
    const ultimaAtividade = user.ultima_atividade || agora;
    const tempoInativo = agora - ultimaAtividade;
    if (tempoInativo > doisDias) {
      const diasInativo = Math.floor(tempoInativo / (1000 * 60 * 60 * 24));
      const penalidade = Math.min(50, diasInativo * 5);
      if (penalidade > 0) {
        user.xp_rank = Math.max(0, (user.xp_rank || 0) - penalidade);
        saveUser(nome, user);
      }
    }
    const rankIdx = RANKS.findIndex(r => r.rank === user.rank);
    if (rankIdx >= 5) {
      const taxa = Math.max(5, Math.min(50, Math.floor((user.xp_rank || 0) * 0.01)));
      if (taxa > 0 && tempoInativo <= doisDias) {
        user.xp_rank = Math.max(0, (user.xp_rank || 0) - taxa);
        saveUser(nome, user);
      }
    }
  }
}

// RANKS and COMANDOS_POR_RANK (copied from the original db.js)
const RANKS = [
  { rank: 'E', nome: 'Caçador Rank E', xp: 0 },
  { rank: 'D', nome: 'Caçador Rank D', xp: 200 },
  { rank: 'C', nome: 'Caçador Rank C', xp: 500 },
  { rank: 'B', nome: 'Caçador Rank B', xp: 1000 },
  { rank: 'A', nome: 'Caçador Rank A', xp: 2000 },
  { rank: 'S', nome: 'Caçador Rank S', xp: 5000 },
  { rank: 'SS', nome: 'Caçador Rank SS', xp: 10000 },
  { rank: 'Nacional', nome: 'Caçador Nacional', xp: 20000 },
  { rank: 'Monarca', nome: 'Monarca', xp: 50000 },
  { rank: 'Divino', nome: 'Ser Divino', xp: 100000 }
];

const COMANDOS_POR_RANK = {
  'E': ['perfil', 'quiz', 'adivinhar', 'diario', 'waifu', 'ranking', 'ajuda', 'missoes'],
  'D': ['batalha', 'criar-cla', 'entrar-cla', 'loja', 'comprar', 'sair-cla', 'clans', 'cla', 'propor', 'aceitar-casamento', 'recusar-casamento', 'divorcio', 'casal'],
  'C': ['torneio', 'inscrever', 'apostar', 'atacar', 'vertorneio'],
  'B': ['voz', 'frase', 'ia', 'resumo', 'recomendar', 'analisar', 'comparar', 'curiosidade', 'traduzir'],
  'A': ['torneio clans', 'img', 'musica', 'debate', 'argumento', 'encerrar'],
  'S': ['modo_seis', 'admin']
};

function obterRankAtual(user) {
  if (!user.rank) return RANKS[0];
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (user.rank === RANKS[i].rank) return RANKS[i];
  }
  return RANKS[0];
}

function obterProximoRank(user) {
  const atual = obterRankAtual(user);
  const idx = RANKS.findIndex(r => r.rank === atual.rank);
  return RANKS[idx + 1] || null;
}

function adicionarXpRank(nome, quantidade) {
  const user = getUser(nome, false);
  if (!user || !user.despertou) return false;
  user.xp_rank = (user.xp_rank || 0) + quantidade;
  user.ultima_atividade = Date.now();
  saveUser(nome, user);
  return verificarSubidaRank(nome);
}

function verificarSubidaRank(nome) {
  const user = getUser(nome, false);
  if (!user) return false;
  const prox = obterProximoRank(user);
  if (!prox) return false;
  if (user.xp_rank >= prox.xp) {
    user.rank = prox.rank;
    user.titulo_rank = prox.nome;
    user.nivel_rank = 1;
    saveUser(nome, user);
    return true;
  }
  return false;
}

function penalizarDerrota(nome, quantidade = 5) {
  const user = getUser(nome, false);
  if (!user || !user.despertou) return;
  user.xp_rank = Math.max(0, (user.xp_rank || 0) - quantidade);
  saveUser(nome, user);
}

function aplicarTaxaDiaria() {
  const usuarios = todosUsuarios();
  const agora = Date.now();
  const doisDias = 2 * 24 * 60 * 60 * 1000;
  for (const nome in usuarios) {
    const user = usuarios[nome];
    if (!user.despertou) continue;
    const ultimaAtividade = user.ultima_atividade || agora;
    const tempoInativo = agora - ultimaAtividade;
    if (tempoInativo > doisDias) {
      const diasInativo = Math.floor(tempoInativo / (1000 * 60 * 60 * 24));
      const penalidade = Math.min(50, diasInativo * 5);
      if (penalidade > 0) {
        user.xp_rank = Math.max(0, (user.xp_rank || 0) - penalidade);
        saveUser(nome, user);
      }
    }
    const rankIdx = RANKS.findIndex(r => r.rank === user.rank);
    if (rankIdx >= 5) {
      const taxa = Math.max(5, Math.min(50, Math.floor((user.xp_rank || 0) * 0.01)));
      if (taxa > 0 && tempoInativo <= doisDias) {
        user.xp_rank = Math.max(0, (user.xp_rank || 0) - taxa);
        saveUser(nome, user);
      }
    }
  }
}

function comandoPermitido(nome, comando) {
  const user = getUser(nome);
  if (!user) return false;
  const rankAtual = user.rank || 'E';
  for (let i = 0; i < RANKS.length; i++) {
    const r = RANKS[i];
    if (r.rank === rankAtual) {
      for (let j = i; j >= 0; j--) {
        if (COMANDOS_POR_RANK[RANKS[j].rank]?.includes(comando)) return true;
      }
      break;
    }
  }
  return false;
}

setInterval(() => { if (dirty) salvar() }, 30000)

process.on('SIGINT', () => { salvar(); process.exit() })
process.on('SIGTERM', () => { salvar(); process.exit() })

let ultimaExecucaoTaxa = null
setInterval(() => {
  const agora = new Date()
  const hoje = agora.toDateString()
  if (hoje !== ultimaExecucaoTaxa && agora.getHours() === 0) {
    ultimaExecucaoTaxa = hoje
    aplicarTaxaDiaria()
  }
}, 60000)

module.exports = {
  getUser, saveUser, todosUsuarios, resetarCache, removerUsuario,
  adicionarXpRank, verificarSubidaRank, penalizarDerrota,
  comandoPermitido, RANKS, aplicarTaxaDiaria
}