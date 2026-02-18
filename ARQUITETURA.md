# PROJETO ASSESSOR LÉO - ARQUITETURA FINAL

## DECISÕES TÉCNICAS

### 1. WEBHOOK WHATSAPP
- Rotas expostas diretamente na raiz: `GET/POST /whatsapp`
- Resposta 200 imediata + processamento assíncrono
- Validação com `VERIFY_TOKEN` para Meta

### 2. INTEGRAÇÃO GPT (OpenAI)
- Modelo: `gpt-4o-mini`
- Temperatura: 0.8 (respostas naturais)
- Max tokens: 500 (respostas concisas)
- Modo texto puro (sem JSON forçado)
- Prompt: Léo como assessor financeiro empático

### 3. CONTROLE DE ESTADO
- Cache em memória (sem banco de dados)
- Histórico: máximo 10 mensagens por usuário
- Expiração: 1 hora de inatividade
- Limpeza automática: a cada 30 minutos

### 4. DECISÃO ÁUDIO vs TEXTO
- **Texto**: respostas com ≤100 caracteres
- **Áudio**: respostas com >100 caracteres
- TTS: ElevenLabs com voz Adam (multilíngue v2)
- Fallback automático para texto se áudio falhar

### 5. VARIÁVEIS DE AMBIENTE
```bash
# Obrigatórias
PORT=3000
NODE_ENV=development

# WhatsApp
VERIFY_TOKEN=meu_token_de_teste
WHATSAPP_TOKEN=seu_token_aqui
PHONE_NUMBER_ID=seu_phone_number_id

# OpenAI
OPENAI_API_KEY=sk-...

# ElevenLabs (opcional)
ELEVENLABS_API_KEY=...
```

## FLUXO DE PROCESSAMENTO

```
WhatsApp → Webhook → MessageService → GPT → Decisão (texto/áudio) → WhatsApp
                          ↓
                    ContextManager (memória)
```

## ARQUITETURA DE ARQUIVOS

```
src/
├── routes/
│   ├── index.ts                 # Agregador de rotas
│   └── webhook.routes.ts        # GET/POST /whatsapp
├── services/
│   └── MessageService.ts        # Orquestração principal
├── ai/
│   ├── gptClient.ts             # OpenAI wrapper
│   └── elevenLabsClient.ts      # TTS
├── whatsapp/
│   ├── whatsappClient.ts        # Envio de mensagens
│   ├── mediaUploader.ts         # Upload de áudio
│   └── types.ts                 # Tipos WhatsApp
└── state/
    └── ContextManager.ts        # Cache em memória
```

## PONTOS DE EVOLUÇÃO FUTURA

### 1. PERSISTÊNCIA
- Migrar de cache em memória para Redis
- Integrar PostgreSQL para histórico completo
- Implementar sistema de filas (Bull/BullMQ)

### 2. INTELIGÊNCIA
- Adicionar embeddings para busca semântica
- Implementar RAG (Retrieval-Augmented Generation)
- Sistema de intenções mais robusto

### 3. MULTIMODAL
- Transcrição de áudios recebidos (Whisper)
- Processamento de imagens (GPT-4 Vision)
- Envio de gráficos e visualizações

### 4. ESCALABILIDADE
- Deploy com load balancer
- Suporte a múltiplos números de WhatsApp
- Métricas com Prometheus/Grafana

### 5. CONFORMIDADE
- Criptografia E2E para dados sensíveis
- Auditoria de conversas
- LGPD compliance (direito ao esquecimento)

## COMANDOS

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Produção
npm run build
npm start

# Expor webhook (ngrok)
ngrok http 3000
```

## TESTES

1. Health check: `GET http://localhost:3000/__health`
2. Webhook verification: Configurar URL no Meta Developer Console
3. Enviar mensagem via WhatsApp para número de teste
4. Verificar logs no terminal

## CHECKLIST PRÉ-PRODUÇÃO

- [ ] Configurar todas as env vars
- [ ] Testar webhook com Meta
- [ ] Validar fluxo completo (texto + áudio)
- [ ] Implementar rate limiting
- [ ] Configurar logs estruturados
- [ ] Deploy em ambiente seguro
- [ ] Monitoramento de uptime
- [ ] Backup de contextos críticos
