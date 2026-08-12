// Centralized configuration for bot-supreme
// Move hardcoded values here to avoid magic strings and ease tuning.

const path = require('path');
const fs = require('fs');

// Use the current working directory (where node start.js is run)
// In practice, this is the project root.
const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

module.exports = {
  // File paths
  PATHS: {
    adminState: path.join(DATA_DIR, 'admin-state.json'),
    limiter: path.join(DATA_DIR, 'limiter.json'),
    db: path.join(DATA_DIR, 'bot.db'),
    // Add other paths as needed
  },

  // Daily limits per user
  LIMITES: {
    ia: 20,        // !ia, chat, menção
    img: 5,        // !img
    musica: 3,     // !musica
    voz: 5,        // !voz
    quizia: 15,    // !quizia
    resumo: 10,    // !resumo, !analisar, !comparar
    historia: 5,   // !historia, !continuar
  },

  // Other constants can be added here
};