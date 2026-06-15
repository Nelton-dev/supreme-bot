# 🤖 AnimeBot — WhatsApp Bot de Anime

Bot completo para grupos de WhatsApp com jogos, IA, ranking, clãs, casamento, missões e muito mais!

---

## 📋 Requisitos

- Android com Termux
- Node.js 18+
- Conta WhatsApp Business (número secundário)
- Chaves de API (ver abaixo)

---

## 🚀 Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/teu-usuario/anime-bot.git
cd anime-bot

# 2. Instalar dependências
yarn install

# 3. Configurar variáveis de ambiente
cp .env.example .env
nano .env

# 4. Iniciar
node connect.js
```

---

## 🔑 Chaves de API (todas grátis)

| API | Link | Para quê |
|-----|------|----------|
| Groq | [console.groq.com](https://console.groq.com) | Chat IA principal |
| Mistral | [console.mistral.ai](https://console.mistral.ai) | Fallback de IA |
| Hugging Face | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) | Imagens e áudio |

Copia o `.env.example` e preenche:

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxx
MISTRAL_API_KEY=xxxxxxxxxxxx
HF_API_KEY=hf_xxxxxxxxxxxx
```

---

## 📁 Estrutura do Projeto

```
anime-bot/
├── connect.js          # Entrada — QR Code ou Pairing Code
├── handler.js          # Handler de todas as mensagens
├── db.js               # Banco de dados de utilizadores
├── modules/
│   ├── quiz.js         # Quiz com XP e níveis
│   ├── rpg.js          # Batalhas entre membros
│   ├── adivinhar.js    # Adivinhar personagem + waifu + loja
│   ├── torneio.js      # Torneios automáticos
│   ├── agendador.js    # Notificações diárias automáticas
│   ├── jogos.js        # Forca, memória, akinator, frase, VD
│   ├── jogos-ia.js     # Jogos com IA (quiz, forca, história)
│   ├── assistente.js   # IA assistente completo
│   ├── social.js       # Clãs, casamento, missões
│   ├── anilist.js      # Busca de animes (AniList API)
│   ├── imagem.js       # Geração de imagens (HuggingFace)
│   ├── audio.js        # Geração de áudio (HuggingFace)
│   ├── sticker.js      # Stickers e reações
│   ├── admin.js        # Comandos de administrador
│   ├── limiter.js      # Limite de uso de IA por utilizador
│   ├── fallback.js     # Fallback automático entre APIs
│   ├── humano.js       # Delay humanizado (typing...)
│   └── ajuda.js        # Menu de ajuda detalhado
├── dashboard/
│   └── server.js       # Painel web (localhost:3000)
├── data/
│   ├── users.json      # Dados dos utilizadores
│   ├── social.json     # Clãs, casamentos, missões
│   ├── limiter.json    # Limites de uso de IA
│   └── config.json     # Configurações do grupo
├── auth/               # Sessão do WhatsApp (não commitar!)
├── .env                # Chaves de API (não commitar!)
├── .env.example        # Exemplo de configuração
├── .gitignore
├── ecosystem.config.js # Configuração PM2
└── README.md
```

---

## 🎮 Comandos

### Jogos
| Comando | Descrição |
|---------|-----------|
| `!quiz` | Quiz de anime com XP |
| `!quizia` / `!quizia facil` / `!quizia dificil` | Quiz gerado por IA |
| `!adivinhar` | Adivinhar personagem pela descrição |
| `!sinopse` | Adivinhar anime pela sinopse (IA) |
| `!forca` | Jogo da forca |
| `!forcaia <tema>` | Forca com palavra gerada por IA |
| `!letra A` | Tentar letra na forca |
| `!palavra naruto` | Tentar palavra completa |
| `!memoria` | Jogo da memória |
| `!par A C` | Revelar cartas na memória |
| `!akinator` | IA adivinha o teu personagem |
| `!sim` / `!nao` | Responder ao Akinator |
| `!frase` | Completar frase de anime |
| `!vd verdade` / `!vd desafio` | Verdade ou desafio |
| `!vdia verdade` / `!vdia desafio` | Verdade/desafio com IA |
| `!historia <tema>` | História colaborativa com IA |
| `!continuar <texto>` | Continuar história ativa |

### Batalhas e Torneio
| Comando | Descrição |
|---------|-----------|
| `!batalha <nome>` | Desafiar alguém |
| `!aceitar` / `!recusar` | Responder desafio |
| `!atacar` | Atacar na batalha |
| `!torneio` | Iniciar torneio |
| `!inscrever` | Inscrever-se no torneio |

### Social
| Comando | Descrição |
|---------|-----------|
| `!criar-cla <nome>` | Criar clã (100 pts) |
| `!entrar-cla <nome>` | Entrar num clã |
| `!sair-cla` | Sair do clã |
| `!clans` | Ver todos os clãs |
| `!cla <nome>` | Detalhes de um clã |
| `!propor <nome>` | Pedir em casamento |
| `!aceitar-casamento` | Aceitar proposta |
| `!recusar-casamento` | Recusar proposta |
| `!casal` | Ver parceiro(a) |
| `!divorcio` | Divorciar |
| `!missoes` | Ver missões e progresso |

### Perfil e Ranking
| Comando | Descrição |
|---------|-----------|
| `!perfil` | Ver perfil completo |
| `!ranking` | Top 10 do grupo |
| `!waifu` | Waifu/Husbando do dia |
| `!diario` | Desafio diário |
| `!completar` | Resgatar recompensa do diário |
| `!loja` | Ver itens disponíveis |
| `!comprar <id>` | Comprar item |
| `!meuuso` | Ver uso de IA hoje |

### IA Assistente
| Comando | Descrição |
|---------|-----------|
| `!ia <pergunta>` | Chat com IA |
| `!limpar` | Apagar histórico de conversa |
| `!resumo <anime>` | Resumo completo de anime |
| `!analisar <personagem>` | Análise de personagem |
| `!recomendar <gostos>` | Recomendações personalizadas |
| `!comparar X vs Y` | Comparar animes/personagens |
| `!curiosidade <tema>` | Curiosidade sobre anime |
| `!traduzir <palavra>` | Traduzir japonês de anime |
| `!debate <tema>` | Iniciar debate moderado por IA |
| `!argumento <texto>` | Participar no debate |
| `!encerrar` | Encerrar debate |

### Media
| Comando | Descrição |
|---------|-----------|
| `!img <descrição>` | Gerar imagem anime |
| `!musica <tema>` | Gerar música de anime |
| `!voz <texto>` | Texto para voz |
| `!frase` | Frase épica em áudio |
| `!sticker` | Converter imagem em sticker |
| `!reacao <emoção>` | GIF de reação |

### AniList
| Comando | Descrição |
|---------|-----------|
| `!anime <nome>` | Info completa de anime |
| `!personagem <nome>` | Ficha de personagem |
| `!top` | Top 10 animes |
| `!temporada` | Animes da temporada atual |

### Admin
| Comando | Descrição |
|---------|-----------|
| `!admin` | Menu de admin |
| `!add <número>` | Adicionar membro |
| `!kick <número>` | Remover membro |
| `!promover <número>` | Promover a admin |
| `!rebaixar <número>` | Remover admin |
| `!anuncio <texto>` | Anúncio oficial |
| `!silenciar` / `!abrir` | Controlo de mensagens |
| `!antilink on/off` | Bloquear links |
| `!filtro <palavra>` | Palavras proibidas |
| `!boasvindas on/off` | Ativar boas-vindas |
| `!setboasvindas <msg>` | Personalizar boas-vindas |
| `!infogrupo` | Info do grupo |
| `!resetuso <nome>` | Reset limite de IA (admin) |
| `!statusapi` | Ver estado das APIs |

---

## ⚙️ PM2 — Manter o bot sempre ativo

```bash
# Instalar PM2
npm install -g pm2

# Iniciar bot
pm2 start ecosystem.config.js

# Ver logs
pm2 logs animebot

# Reiniciar
pm2 restart animebot

# Parar
pm2 stop animebot

# Auto-iniciar no boot do Termux
pm2 save
pm2 startup
```

---

## 🌐 Painel Web

Acede em `http://localhost:3000` depois de iniciar o bot.

Funcionalidades:
- Ver ranking em tempo real
- Estatísticas do grupo
- Enviar mensagens ao grupo
- Gerir jogadores (reset, remover)
- Logs em tempo real

---

## 🔒 Limites de IA (por utilizador/dia)

| Função | Limite |
|--------|--------|
| Chat IA (`!ia`) | 20/dia |
| Imagens (`!img`) | 5/dia |
| Música (`!musica`) | 3/dia |
| Voz (`!voz`) | 5/dia |
| Quiz IA (`!quizia`) | 15/dia |
| Resumos (`!resumo`) | 10/dia |
| Histórias (`!historia`) | 5/dia |

Limites resetam à meia-noite automaticamente.

---

## 📤 Subir para o GitHub

```bash
git init
git add .
git commit -m "🤖 AnimeBot v1.0"
git branch -M main
git remote add origin https://github.com/teu-usuario/anime-bot.git
git push -u origin main
```

---

## 🤝 Contribuições

Pull requests são bem-vindos! Abre uma issue primeiro para discutir o que queres mudar.

---

## 📄 Licença

MIT — usa à vontade!
