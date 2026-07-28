-----

```markdown
<div align="center">
  <img src="https://i.imgur.com/placeholder-banner.png" alt="AnimeBot + Nexus World" width="100%">
  
  # 🤖 AnimeBot — WhatsApp Bot de Anime + RPG Nexus World
  
  [![Node.js](https://img.shields.io/badge/Node.js-18.x-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
  [![WhatsApp](https://img.shields.io/badge/WhatsApp-Bot-25D366?style=for-the-badge&logo=whatsapp)](https://whatsapp.com/)
  [![PM2](https://img.shields.io/badge/PM2-Process-2B037A?style=for-the-badge&logo=pm2)](https://pm2.keymetrics.io/)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
  
  > **Bot completo para grupos de WhatsApp com jogos, IA, ranking, clãs, casamento, missões e RPG de mundo aberto!**
  
  [📦 Instalação](#-instalação) • [🎮 Comandos](#-comandos) • [⚔️ Nexus World RPG](#️-nexus-world-rpg) • [📁 Estrutura](#-estrutura-do-projeto) • [🌐 Painel Web](#-painel-web)
</div>

---

## 📋 Índice

- [Requisitos](#-requisitos)
- [Instalação](#-instalação)
- [Chaves de API](#-chaves-de-api-todas-grátis)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Comandos](#-comandos)
  - [Jogos](#jogos)
  - [Batalhas e Torneio](#batalhas-e-torneio)
  - [Social](#social)
  - [Perfil e Ranking](#perfil-e-ranking)
  - [IA Assistente](#ia-assistente)
  - [Media](#media)
  - [AniList](#anilist)
  - [Admin](#admin)
- [⚔️ Nexus World RPG](#️-nexus-world-rpg)
  - [Comandos RPG](#comandos-rpg)
  - [Os 7 Pilares](#os-7-pilares)
  - [Sistema de Ranks](#sistema-de-ranks)
  - [Eventos Globais](#eventos-globais)
  - [Sistema Econômico](#sistema-econômico-do-nexus)
- [PM2](#️-pm2--manter-o-bot-sempre-ativo)
- [Painel Web](#-painel-web)
- [Limites de IA](#-limites-de-ia-por-utilizadordia)
- [GitHub](#-subir-para-o-github)
- [Contribuições](#-contribuições)
- [Licença](#-licença)

---

## 📋 Requisitos

<div align="center">
  
| Requisito | Especificação |
|-----------|---------------|
| **Sistema Operacional** | Android com Termux / Linux / Windows (WSL) |
| **Node.js** | Versão 18 ou superior |
| **WhatsApp** | Conta WhatsApp Business (número secundário) |
| **APIs** | Chaves de API (ver tabela abaixo) |
| **Espaço** | ~100MB para dependências |

</div>

---

## 🚀 Instalação

### Método Rápido (Termux)

```bash
# 1. Atualizar pacotes
pkg update && pkg upgrade -y

# 2. Instalar Node.js
pkg install nodejs-lts git -y

# 3. Clonar repositório
git clone https://github.com/teu-usuario/anime-bot.git
cd anime-bot

# 4. Instalar dependências
yarn install

# 5. Configurar variáveis de ambiente
cp .env.example .env
nano .env

# 6. Iniciar bot
node connect.js
```

Método Alternativo (npm)

```bash
git clone https://github.com/teu-usuario/anime-bot.git
cd anime-bot
npm install
cp .env.example .env
npm start
```

⚠️ Nota: O bot vai gerar um QR Code no terminal. Escaneie com seu WhatsApp Business para conectar.

---

🔑 Chaves de API (todas grátis)

<div align="center">

API Link Para quê Limite Grátis
Groq console.groq.com Chat IA principal 30 req/min
Mistral console.mistral.ai Fallback de IA 10 req/min
Hugging Face huggingface.co/settings/tokens Imagens e áudio Ilimitado (rate limit)

</div>

Configuração do .env

```env
# Chaves de API
GROQ_API_KEY=gsk_xxxxxxxxxxxx
MISTRAL_API_KEY=xxxxxxxxxxxx
HF_API_KEY=hf_xxxxxxxxxxxx

# Configurações do Bot
BOT_PREFIX=!
BOT_NAME=AnimeBot
ADMIN_NUMBERS=5511999999999,5511988888888
```

---

📁 Estrutura do Projeto

<details>
<summary><b>📂 Clique para expandir a estrutura completa</b></summary>

```
anime-bot/
├── connect.js              # 🚀 Entrada — QR Code ou Pairing Code
├── handler.js              # 📨 Handler de todas as mensagens
├── db.js                   # 💾 Banco de dados de utilizadores
│
├── modules/                # 📦 Módulos do bot
│   ├── quiz.js             # Quiz com XP e níveis
│   ├── rpg.js              # Batalhas entre membros
│   ├── adivinhar.js        # Adivinhar personagem + waifu + loja
│   ├── torneio.js          # Torneios automáticos
│   ├── agendador.js        # Notificações diárias automáticas
│   ├── jogos.js            # Forca, memória, akinator, frase, VD
│   ├── jogos-ia.js         # Jogos com IA (quiz, forca, história)
│   ├── assistente.js       # IA assistente completo
│   ├── social.js           # Clãs, casamento, missões
│   ├── anilist.js          # Busca de animes (AniList API)
│   ├── imagem.js           # Geração de imagens (HuggingFace)
│   ├── audio.js            # Geração de áudio (HuggingFace)
│   ├── sticker.js          # Stickers e reações
│   ├── admin.js            # Comandos de administrador
│   ├── limiter.js          # Limite de uso de IA por utilizador
│   ├── fallback.js         # Fallback automático entre APIs
│   ├── humano.js           # Delay humanizado (typing...)
│   └── ajuda.js            # Menu de ajuda detalhado
│
├── nexus/                  # ⚔️ SISTEMA RPG NEXUS WORLD
│   ├── core/
│   │   ├── index.js        # Ponto de entrada do Nexus
│   │   ├── player.js       # Gerenciador de Caçadores
│   │   ├── combat.js       # Sistema de batalha com Pilares
│   │   └── events.js       # Sistema de eventos globais
│   ├── data/
│   │   ├── pilares.json    # Dados dos 7 Pilares
│   │   ├── ranks.json      # Sistema de progressão (6 Ranks)
│   │   ├── eventos.json    # Eventos canônicos
│   │   ├── itens.json      # Itens, armas e artefatos
│   │   ├── bestiario.json  # Criaturas do Vazio
│   │   └── npcs.json       # NPCs com diálogos
│   └── lore.md             # Documentação completa da lore
│
├── dashboard/              # 🌐 Painel web
│   └── server.js           # Servidor local (localhost:3000)
│
├── data/                   # 📊 Dados persistentes
│   ├── users.json          # Dados dos utilizadores
│   ├── social.json         # Clãs, casamentos, missões
│   ├── limiter.json        # Limites de uso de IA
│   ├── config.json         # Configurações do grupo
│   └── nexus.json          # 🆕 Dados RPG (Caçadores, Guildas, etc.)
│
├── auth/                   # 🔐 Sessão do WhatsApp (não commitar!)
├── .env                    # 🔑 Chaves de API (não commitar!)
├── .env.example            # 📄 Exemplo de configuração
├── .gitignore
├── ecosystem.config.js     # ⚙️ Configuração PM2
└── README.md               # 📖 Esta documentação
```

</details>

---

🎮 Comandos

Jogos

<div align="center">

Comando Descrição
!quiz Quiz de anime com XP
!quizia / !quizia facil / !quizia dificil Quiz gerado por IA
!adivinhar Adivinhar personagem pela descrição
!sinopse Adivinhar anime pela sinopse (IA)
!forca Jogo da forca
!forcaia <tema> Forca com palavra gerada por IA
!letra A Tentar letra na forca
!palavra naruto Tentar palavra completa
!memoria Jogo da memória
!par A C Revelar cartas na memória
!akinator IA adivinha o teu personagem
!sim / !nao Responder ao Akinator
!frase Completar frase de anime
!vd verdade / !vd desafio Verdade ou desafio
!vdia verdade / !vdia desafio Verdade/desafio com IA
!historia <tema> História colaborativa com IA
!continuar <texto> Continuar história ativa

</div>

Batalhas e Torneio

<div align="center">

Comando Descrição
!batalha <nome> Desafiar alguém
!aceitar / !recusar Responder desafio
!atacar Atacar na batalha
!torneio Iniciar torneio
!inscrever Inscrever-se no torneio

</div>

Social

<div align="center">

Comando Descrição
!criar-cla <nome> Criar clã (100 pts)
!entrar-cla <nome> Entrar num clã
!sair-cla Sair do clã
!clans Ver todos os clãs
!cla <nome> Detalhes de um clã
!propor <nome> Pedir em casamento
!aceitar-casamento Aceitar proposta
!recusar-casamento Recusar proposta
!casal Ver parceiro(a)
!divorcio Divorciar
!missoes Ver missões e progresso

</div>

Perfil e Ranking

<div align="center">

Comando Descrição
!perfil Ver perfil completo
!ranking Top 10 do grupo
!waifu Waifu/Husbando do dia
!diario Desafio diário
!completar Resgatar recompensa do diário
!loja Ver itens disponíveis
!comprar <id> Comprar item
!meuuso Ver uso de IA hoje

</div>

IA Assistente

<div align="center">

Comando Descrição
!ia <pergunta> Chat com IA
!limpar Apagar histórico de conversa
!resumo <anime> Resumo completo de anime
!analisar <personagem> Análise de personagem
!recomendar <gostos> Recomendações personalizadas
!comparar X vs Y Comparar animes/personagens
!curiosidade <tema> Curiosidade sobre anime
!traduzir <palavra> Traduzir japonês de anime
!debate <tema> Iniciar debate moderado por IA
!argumento <texto> Participar no debate
!encerrar Encerrar debate

</div>

Media

<div align="center">

Comando Descrição
!img <descrição> Gerar imagem anime
!musica <tema> Gerar música de anime
!voz <texto> Texto para voz
!frase Frase épica em áudio
!sticker Converter imagem em sticker
!reacao <emoção> GIF de reação

</div>

AniList

<div align="center">

Comando Descrição
!anime <nome> Info completa de anime
!personagem <nome> Ficha de personagem
!top Top 10 animes
!temporada Animes da temporada atual

</div>

Admin

<div align="center">

Comando Descrição
!admin Menu de admin
!add <número> Adicionar membro
!kick <número> Remover membro
!promover <número> Promover a admin
!rebaixar <número> Remover admin
!anuncio <texto> Anúncio oficial
!silenciar / !abrir Controlo de mensagens
!antilink on/off Bloquear links
!filtro <palavra> Palavras proibidas
!boasvindas on/off Ativar boas-vindas
!setboasvindas <msg> Personalizar boas-vindas
!infogrupo Info do grupo
!resetuso <nome> Reset limite de IA (admin)
!statusapi Ver estado das APIs

</div>

---

⚔️ Nexus World RPG

Bem-vindo ao Nexus, Caçador!
Proteja o mundo dos sonhos contra as forças do Vazio. Escolha seu Pilar, evolua seu Rank, e torne-se uma lenda.

Comandos RPG

<details>
<summary><b>📜 Clique para ver todos os comandos RPG</b></summary>

Personagem

Comando Descrição
!nexus Menu principal do RPG
!inicio Criar um Caçador e escolher seu Pilar
!perfil Ver ficha completa do Caçador
!rank Ver progressão de Rank e próximos requisitos
!atributos Distribuir pontos de atributo

Pilares e Habilidades

Comando Descrição
!pilar Ver informações do seu Pilar
!pilares Listar todos os 7 Pilares
!habilidades Ver habilidades desbloqueadas
!sinergia @membro Ver sinergia com outro Caçador

Combate

Comando Descrição
!caçar Caçar criaturas do Vazio
!masmorra Entrar numa Masmorra do Vazio
!arena @membro Desafiar outro Caçador na Arena
!aceitar-arena Aceitar desafio de Arena
!usar <habilidade> Usar habilidade em batalha
!fugir Tentar fugir do combate

Progressão

Comando Descrição
!evoluir Subir de Rank (se cumprir requisitos)
!missao Ver missão atual
!missao-completar Completar missão atual
!fragmentos Ver Fragmentos de Memória coletados

Economia

Comando Descrição
!loja-nexus Ver itens disponíveis no Nexus
!comprar-nexus <id> Comprar item com Fragmentos/Cristais
!vender <id> Vender item
!trocar @membro Trocar itens com outro Caçador
!moedas Ver seu saldo de moedas

Eventos Globais

Comando Descrição
!evento Ver evento global ativo
!participar Participar do evento atual
!ranking-evento Ranking do evento
!loja-evento Itens exclusivos do evento

Guildas (Sistema de Clãs RPG)

Comando Descrição
!guilda-criar <nome> Criar uma Guilda (requer Rank 3+)
!guilda-entrar <nome> Entrar numa Guilda
!guilda-sair Sair da Guilda
!guilda Ver informações da sua Guilda
!guildas Listar todas as Guildas
!guilda-guerra Participar da Guerra de Guildas

Lore

Comando Descrição
!lore Ver resumo da lore do Nexus
!lore <termo> Buscar termo na lore (ex: !lore nelton)
!fragmento Examinar um Fragmento de Memória
!profecia Ver a Profecia do Equilíbrio

</details>

---

Os 7 Pilares

<div align="center">

Pilar Elemento Símbolo Personalidade Habilidade Ultimate
Ignis Fogo 🔥 Paixão, impulso, destruição criativa Fúria do Vulcão
Aquor Água 💧 Fluidez, adaptação, paciência Maré do Esquecimento
Petra Terra 🏔️ Firmeza, teimosia, tradição Fortaleza Inabalável
Aeris Ar 🌪️ Liberdade, mudança, imprevisibilidade Tempestade Eterna
Lux Luz ⭐ Clareza, verdade, revelação Juízo Final
Umbra Trevas 🌑 Mistério, sigilo, potencial oculto Noite Eterna
Fulgor Trovoada ⚡ Energia, transformação, choque Tempestade de Raios

</div>

💡 Dica: Cada Pilar tem rivalidades e sinergias!
Ignis 🔥 rivaliza com Aquor 💧, mas tem sinergia com Aeris 🌪️ e Petra 🏔️.

---

Sistema de Ranks

<div align="center">

Rank Título Requisitos Recompensa
1 🟢 Desperto Iniciar jornada +1 todos atributos
2 🔵 Guardião 10 missões + 3 arenas Habilidade Nível 3
3 🟣 Arauto 20 missões + 10 arenas + 1 masmorra Habilidade Nível 5
4 🟠 Lenda 50 missões + 25 arenas + 5 masmorras Habilidade Nível 7
5 🔴 Arquétipo 100 missões + 50 arenas + 10 masmorras + Boss Vazio Habilidade Nível 10 (Ultimate)
6 ⭐ Eco de Nelton Missão lendária + 10 Fragmentos da Memória Acesso a segredos do Nexus

</div>

---

Eventos Globais

<div align="center">

Evento Frequência Duração Descrição
🌑 Invasão do Vazio Mensal (1ª semana) 7 dias Fendas em todo o Nexus
⚔️ Torneio dos Pilares Quinzenal (3ª semana) 3 dias PvP com bônus elemental
💀 Despertar da Corrupção Bimestral 5 dias Um Pilar é corrompido
✨ Festa dos Sonhos Bimestral 3 dias Portais para memórias antigas
🏴 Grande Guerra de Guildas Semestral 7 dias Guerra entre Guildas
🗡️ Peregrinação de Nelton Semestral 5 dias Rota sagrada de Nelton
🌟 Eco do Artífice Anual (janeiro) 1 dia Presença de Nelton no Nexus
🌙 Noite do Vazio Anual (julho) 24h Evento hardcore

</div>

---

Sistema Econômico do Nexus

<div align="center">

Moeda Símbolo Valor Uso Principal
Fragmentos de Sonho ✦ Base Itens comuns, poções, dia a dia
Cristais de Pilar ◆ 100 Fragmentos Itens raros, melhorias de habilidade
Essência do Vazio ◇ 1.000 Fragmentos Itens lendários, artefatos

</div>

---

⚙️ PM2 — Manter o bot sempre ativo

<div align="center">

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

</div>

---

🌐 Painel Web

<div align="center">

Funcionalidade Descrição
📊 Ranking Ver top 10 em tempo real
📈 Estatísticas Dados do grupo e utilizadores
✉️ Mensagens Enviar mensagens ao grupo
👥 Gestão Gerir jogadores (reset, remover)
📜 Logs Logs em tempo real
⚔️ Nexus 🆕 Ver Caçadores ativos, eventos e estatísticas RPG

</div>

```bash
# Iniciar painel
node dashboard/server.js

# Acessar
http://localhost:3000
```

---

🔒 Limites de IA (por utilizador/dia)

<div align="center">

Função Comando Limite Reseta
Chat IA !ia 20/dia 🌙 Meia-noite
Imagens !img 5/dia 🌙 Meia-noite
Música !musica 3/dia 🌙 Meia-noite
Voz !voz 5/dia 🌙 Meia-noite
Quiz IA !quizia 15/dia 🌙 Meia-noite
Resumos !resumo 10/dia 🌙 Meia-noite
Histórias !historia 5/dia 🌙 Meia-noite

</div>

💡 Dica: Use !meuuso para ver seu uso diário.

---

📤 Subir para o GitHub

```bash
git init
git add .
git commit -m "🤖 AnimeBot v1.0 + Nexus World RPG"
git branch -M main
git remote add origin https://github.com/teu-usuario/anime-bot.git
git push -u origin main
```

---

🤝 Contribuições

<div align="center">

https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge
https://img.shields.io/badge/Issues-Report-red?style=for-the-badge

</div>

Pull requests são bem-vindos! Para grandes mudanças, abra uma issue primeiro para discutir o que queres alterar.

Como contribuir:

1. Fork o projeto
2. Crie sua branch (git checkout -b feature/AmazingFeature)
3. Commit suas mudanças (git commit -m 'Add: AmazingFeature')
4. Push para a branch (git push origin feature/AmazingFeature)
5. Abra um Pull Request

---

📄 Licença

<div align="center">

Nelton Dev © 2024 — Usa à vontade! 🚀

https://img.shields.io/badge/License-MIT-blue?style=for-the-badge

</div>

---

<div align="center">

⭐ Mostre seu apoio

Se este projeto te ajudou, dê uma ⭐ no GitHub!

---

Feito com ❤️ para a comunidade de WhatsApp e RPG

</div>
```

---

🎯 Características Interativas do README

|Elemento | Descrição|
|---------|----------|
|**Badges** | Status do projeto, versões, licença
|**Banner** | Espaço para logo do bot
|**Índice** | Navegação rápida entre seções
|**Tabelas** | Dados organizados visualmente
|**Collapsible** | Sections Comandos RPG em seção retrátil
|**Emojis** | Identificação visual de cada seção
|**Divisores** | Separação clara entre seções
|**Código Formatado** |Comandos e exemplos coloridos
|**Links** | Navegação entre seções do README
|**Contribuição** | Guia claro para contribuidores

---
