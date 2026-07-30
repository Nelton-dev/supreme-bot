#!/bin/bash

# ════════════════════════════════════════
#  CONFIGURAÇÃO (SUBSTITUI COM OS TEUS DADOS)
# ════════════════════════════════════════
RENDER_API_KEY="rnd_kLkF8Pe9pECqymMasWjTSmWGr8xJ"
RENDER_SERVICE_ID="srv-d8uhtslaeets7393ee5g"
echo "🚀 Serveo Auto-Update (com reconexão automática)"
echo "================================================"
echo ""

while true; do
  echo "🔄 Conectando ao Serveo..."
  
  ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:3001 serveo.net 2>&1 | while read line; do
    echo "$line"
    
    if echo "$line" | grep -q "Forwarding HTTP traffic from"; then
      URL=$(echo "$line" | grep -o 'https://[^ ]*')
      echo ""
      echo "✅ Novo URL: $URL"
      echo ""
      
      # Atualiza o Render via API
      echo "⚡ Atualizando Render..."
      
      curl -s -X PUT "https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars/BOT_URL" \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"value\": \"$URL\"}" \
        -o /dev/null
      
      echo "✅ Render atualizado!"
      echo "🔗 Dashboard: https://nexus-dashboard-60ea.onrender.com/ranking"
      echo "⏱️ Aguarda 1-2 min para o deploy..."
      echo ""
    fi
  done
  
  echo "⚠️ Conexão perdida. Reconectando em 5 segundos..."
  sleep 5
done
