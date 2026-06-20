const axios = require('axios')
const fs = require('fs')
require('dotenv').config()

const CF_TOKEN = process.env.CF_API_TOKEN
const CF_ACCOUNT_ID = '39ef827ab30816d8ed90f2795804c220'

async function deploy() {
  // Lê o código do worker (ficheiro worker.js)
  const workerScript = fs.readFileSync('./worker.js', 'utf8')

  try {
    // Criar/atualizar o worker com formato ES module + binding AI
    const res = await axios.put(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/animebot-image`,
      workerScript,
      {
        headers: {
          Authorization: `Bearer ${CF_TOKEN}`,
          'Content-Type': 'application/javascript+module'  // 🔑 ESSENCIAL para ES modules
        },
        params: {
          // Metadados: ativar bindings e compatibilidade
          'metadata[body_part]': 'worker',         // indica que é um módulo ES
          'metadata[compatibility_date]': '2024-08-12',
          'metadata[bindings][0][type]': 'ai',
          'metadata[bindings][0][name]': 'AI'
        }
      }
    )

    console.log('✅ Worker criado/atualizado com sucesso!')

    // O domínio do worker
    const workerUrl = `https://animebot-image.${CF_ACCOUNT_ID}.workers.dev`
    console.log('\n🌐 URL do worker:', workerUrl)
    console.log('📝 Adiciona ao teu .env:')
    console.log(`CLOUDFLARE_IMAGE_WORKER=${workerUrl}`)
  } catch (err) {
    console.error('❌ Erro ao criar worker:', err.response?.data || err.message)
  }
}

deploy()
