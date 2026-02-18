# Guia completo: Assessor Léo com Evolution API

Este guia leva você do zero até o Assessor Léo funcionando no WhatsApp via Evolution API, sem depender da Meta.

---

## Resumo do que você vai fazer

1. Subir a Evolution API (Docker + Redis + PostgreSQL)
2. Criar uma instância e conectar via QR Code
3. Configurar o webhook para apontar para o leo-backend
4. Configurar o leo-backend e iniciar

**Tempo estimado:** 30–45 minutos

---

## Parte 1: Subir a Evolution API

### 1.1 Pré-requisitos

- Docker e Docker Compose instalados
- Uma URL pública HTTPS para o webhook (ex.: ngrok ou servidor em produção)

### 1.2 Criar a pasta e arquivos

Crie uma pasta (ex: `evolution-setup`) e os arquivos abaixo.

**docker-compose.yml:**

```yaml
version: "3.8"

services:
  api:
    container_name: evolution_api
    image: atendai/evolution-api:latest
    restart: always
    depends_on:
      - redis
      - evolution-postgres
    ports:
      - "127.0.0.1:8080:8080"
    volumes:
      - evolution_instances:/evolution/instances
    networks:
      - evolution-net
    env_file:
      - .env

  redis:
    container_name: evolution_redis
    image: redis:latest
    restart: always
    command: redis-server --port 6379 --appendonly yes
    volumes:
      - evolution_redis:/data
    networks:
      - evolution-net
    expose:
      - "6379"

  evolution-postgres:
    container_name: evolution_postgres
    image: postgres:15
    restart: always
    environment:
      - POSTGRES_DB=evolution
      - POSTGRES_USER=evolution
      - POSTGRES_PASSWORD=evolution123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - evolution-net
    expose:
      - "5432"

volumes:
  evolution_instances:
  evolution_redis:
  postgres_data:

networks:
  evolution-net:
    driver: bridge
```

**.env (na mesma pasta):**

```bash
# Obrigatório - mude para uma chave segura!
AUTHENTICATION_API_KEY=sua_chave_secreta_aqui_leo_2026

# Banco de dados
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://evolution:evolution123@evolution-postgres:5432/evolution?schema=public
DATABASE_CONNECTION_CLIENT_NAME=evolution_leo
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
DATABASE_SAVE_DATA_LABELS=true
DATABASE_SAVE_DATA_HISTORIC=true

# Redis
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://redis:6379/6
CACHE_REDIS_PREFIX_KEY=evolution
CACHE_REDIS_SAVE_INSTANCES=false
CACHE_LOCAL_ENABLED=false

# URL do servidor (para webhooks)
# Se local: use ngrok. Ex: https://abc123.ngrok.io
SERVER_URL=http://localhost:8080
```

### 1.3 Iniciar a Evolution API

```bash
cd evolution-setup
docker compose up -d
```

Verifique os logs:

```bash
docker logs evolution_api -f
```

Quando aparecer algo como "Server started" ou "Listening on port 8080", a API está rodando.

Acesse: http://localhost:8080 — deve retornar algo indicando que a API está ativa.

---

## Parte 2: Criar instância e conectar via QR Code

### 2.1 Criar a instância

Substitua `sua_chave_secreta_aqui_leo_2026` pela mesma chave do `.env`:

```bash
curl -X POST "http://localhost:8080/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: sua_chave_secreta_aqui_leo_2026" \
  -d '{
    "instanceName": "assessor-leo",
    "integration": "WHATSAPP-BAILEYS",
    "qrcode": true
  }'
```

Se der certo, a resposta trará um `base64` do QR Code.

### 2.2 Obter o QR Code (se não vier na resposta)

```bash
curl -X GET "http://localhost:8080/instance/connect/assessor-leo" \
  -H "apikey: sua_chave_secreta_aqui_leo_2026"
```

A resposta terá o QR Code em base64. Use um site como https://base64.guru/converter/decode/image para ver a imagem, ou use o Evolution Manager (frontend na porta 3000, se estiver usando a imagem com frontend).

### 2.3 Conectar o WhatsApp

1. Abra o WhatsApp no celular
2. Menu (⋮) → Aparelhos conectados → Conectar um aparelho
3. Escaneie o QR Code

Quando conectar, a instância ficará `CONNECTED`.

### 2.4 Conferir status da instância

```bash
curl -X GET "http://localhost:8080/instance/connectionState/assessor-leo" \
  -H "apikey: sua_chave_secreta_aqui_leo_2026"
```

---

## Parte 3: Configurar o webhook

### 3.1 Expor o leo-backend publicamente (para receber o webhook)

Se o backend estiver em localhost, use **ngrok**:

```bash
ngrok http 3000
```

Anote a URL HTTPS (ex: `https://abc123.ngrok-free.app`).

### 3.2 Configurar o webhook na Evolution API

Substitua `https://SUA_URL_PUBLICA` pela URL do ngrok (ou do seu servidor):

```bash
curl -X POST "http://localhost:8080/webhook/set/assessor-leo" \
  -H "Content-Type: application/json" \
  -H "apikey: sua_chave_secreta_aqui_leo_2026" \
  -d '{
    "enabled": true,
    "url": "https://SUA_URL_PUBLICA/webhook/evolution",
    "webhookByEvents": false,
    "webhookBase64": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

Exemplo com ngrok:

```json
{
  "enabled": true,
  "url": "https://abc123.ngrok-free.app/webhook/evolution",
  "webhookByEvents": false,
  "webhookBase64": false,
  "events": ["MESSAGES_UPSERT"]
}
```

### 3.3 Testar o webhook

Envie uma mensagem de texto para o número do WhatsApp conectado. No terminal do leo-backend você deve ver os logs da mensagem recebida.

---

## Parte 4: Configurar o leo-backend

### 4.1 Variáveis de ambiente (.env do leo-backend)

Adicione ao seu `.env`:

```bash
# Evolution API (use quando quiser rodar via Evolution em vez da Meta)
EVOLUTION_ENABLED=true
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_INSTANCE_NAME=assessor-leo
EVOLUTION_API_KEY=sua_chave_secreta_aqui_leo_2026

# OpenAI (obrigatório para o assessor)
OPENAI_API_KEY=sk-proj-...
```

### 4.2 Iniciar o leo-backend

```bash
cd leo-backend
npm install
npm run dev
```

### 4.3 Conferir se está usando Evolution

Nos logs deve aparecer algo como:

```
🔄 Usando Evolution API para WhatsApp
```

---

## Parte 5: Testar o fluxo completo

1. Envie uma mensagem no WhatsApp para o número conectado à instância `assessor-leo`
2. O webhook vai chamar `https://SUA_URL/webhook/evolution`
3. O leo-backend processa com GPT e responde via Evolution API
4. A resposta deve chegar no WhatsApp em poucos segundos

---

## Checklist final

- [ ] Evolution API rodando (porta 8080)
- [ ] Instância `assessor-leo` criada
- [ ] WhatsApp conectado via QR Code
- [ ] Webhook configurado apontando para `/webhook/evolution`
- [ ] leo-backend com `EVOLUTION_ENABLED=true` e variáveis preenchidas
- [ ] URL pública (ngrok ou servidor) acessível
- [ ] Mensagem de teste enviada e respondida

---

## Problemas comuns

### "Cannot connect to Redis"
- Confira se o serviço `redis` está rodando: `docker ps`
- No `.env` da Evolution, use `redis://redis:6379/6` (nome do serviço no Docker)

### "Cannot connect to database"
- Confira se `evolution-postgres` está rodando
- `DATABASE_CONNECTION_URI` deve usar `evolution-postgres` como host (nome do serviço)

### Webhook não recebe mensagens
- Confirme que a URL é HTTPS (ngrok já fornece)
- Verifique se a instância está `CONNECTED`
- Confira os eventos do webhook: deve incluir `MESSAGES_UPSERT`

### Mensagens não são respondidas
- Verifique os logs do leo-backend
- Confirme `EVOLUTION_ENABLED=true` e `OPENAI_API_KEY` definido
- Confira se `EVOLUTION_API_URL` está acessível a partir do leo-backend (localhost:8080 se tudo estiver na mesma máquina)

---

## Diferenças: Evolution vs Meta

| Aspecto | Meta (oficial) | Evolution |
|---------|----------------|-----------|
| Verificação empresa | Necessária | Não necessária |
| Conexão | Número de teste/produção da Meta | QR Code (WhatsApp pessoal/Business) |
| Áudio (TTS) | Suportado via Meta Media API | Por enquanto: apenas texto* |
| Botões interativos | Suportado | Requer adaptação* |

\* Possível implementar depois; o fluxo principal em texto funciona assim que concluir este guia.
