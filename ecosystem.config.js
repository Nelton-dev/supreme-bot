module.exports = {
  apps: [{
    name: 'animebot',
    script: 'start.js',
    watch: false,
    autorestart: true,
    restart_delay: 3000,
    max_restarts: 50,          // Reinicia até 50 vezes
    min_uptime: '10s',         // Considera estável após 10s
    exp_backoff_restart_delay: 100, // Espera crescente entre restarts
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'DD-MM-YYYY HH:mm:ss',
    // Reinicia automaticamente se usar muita memória
    max_memory_restart: '500M',
    // Variáveis de ambiente
    env: {
      NODE_ENV: 'production',
      KEEP_ALIVE: 'true'
    }
  }]
}

// ════════════════════════════════════════
//  .gitignore
// ════════════════════════════════════════
/*
Cria o ficheiro .gitignore com este conteúdo:

node_modules/
auth/
.env
data/users.json
data/limiter.json
logs/
*.log
*/

// ════════════════════════════════════════
//  .env.example
// ════════════════════════════════════════
/*
Cria o ficheiro .env.example com este conteúdo:

GROQ_API_KEY=gsk_xxxxxxxxxxxx
MISTRAL_API_KEY=xxxxxxxxxxxx
HF_API_KEY=hf_xxxxxxxxxxxx
PORT=3000
*/
