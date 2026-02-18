// Guia de Debugging - Fluxo de Áudio WhatsApp + ElevenLabs

## ARQUITETURA DO FLUXO

```
ElevenLabs → MP3 Buffer → FFmpeg Conversion → OGG/OPUS → WhatsApp Media Upload → media_id → Send Audio Message
```

## PONTOS CRÍTICOS DE VALIDAÇÃO

### 1. ElevenLabs (elevenLabsClient.ts)
**Validar:**
- ✅ API key configurada (`ELEVEN_API_KEY`)
- ✅ Voice ID válido (`ELEVEN_VOICE_ID`)
- ✅ Status 200 na resposta
- ✅ Buffer não vazio

**Como debugar:**
```typescript
console.log('ElevenLabs response status:', response.status);
console.log('Audio buffer size:', buffer.length);
console.log('First 16 bytes (hex):', buffer.toString('hex', 0, 16));
```

**Erros comuns:**
- `401 Unauthorized` → API key inválida
- `404 Not Found` → Voice ID incorreto
- `429 Too Many Requests` → Limite de quota excedido
- Buffer vazio → Resposta não processada corretamente

---

### 2. Conversão de Áudio (audioConverter.ts)
**Validar:**
- ✅ FFmpeg instalado e configurado
- ✅ Input é MP3 válido (magic numbers: `FF FB`, `FF F3`, `FF F2`)
- ✅ Output é OGG válido (magic numbers: `4F 67 67 53` = "OggS")
- ✅ Codec OPUS presente

**Como debugar:**
```typescript
// Verificar magic numbers do input
const magic = buffer.toString('hex', 0, 4);
console.log('Input magic:', magic); // Deve começar com 'fff'

// Verificar output
const oggMagic = oggBuffer.toString('ascii', 0, 4);
console.log('Output magic:', oggMagic); // Deve ser 'OggS'
```

**Erros comuns:**
- `Error: Cannot find ffmpeg` → Path do ffmpeg incorreto
- `Error: Invalid data found when processing input` → MP3 corrompido
- Output com tamanho 0 → Falha na conversão

**Configuração FFmpeg crítica:**
```typescript
.audioCodec('libopus')      // Obrigatório: WhatsApp só aceita OPUS
.audioBitrate('64k')        // Otimizado para voz
.audioChannels(1)           // Mono suficiente para voz
.audioFrequency(24000)      // 24kHz ideal para voz
.format('ogg')              // Container OGG
```

---

### 3. Upload WhatsApp Media API (mediaUploader.ts)
**Validar:**
- ✅ Token válido e ativo (System User token recomendado)
- ✅ PHONE_NUMBER_ID correto
- ✅ Content-Type correto: `audio/ogg; codecs=opus`
- ✅ FormData com campos obrigatórios

**Como debugar:**
```typescript
console.log('Upload URL:', uploadUrl);
console.log('Token (first 20):', this.token.substring(0, 20));
console.log('Phone Number ID:', this.phoneNumberId);
console.log('FormData headers:', formData.getHeaders());
console.log('File size:', oggBuffer.length);
```

**Erros comuns:**
- `400 Bad Request` → Headers incorretos ou formato de arquivo inválido
- `401 Unauthorized` → Token expirado ou inválido
- `403 Forbidden` → Token sem permissões suficientes
- `413 Payload Too Large` → Arquivo maior que 16MB (limite WhatsApp)
- `500 Internal Server Error` → Problema temporário da Meta

**Headers corretos:**
```typescript
{
  'Authorization': 'Bearer YOUR_TOKEN',
  'Content-Type': 'multipart/form-data; boundary=---...',
}
```

**FormData correto:**
```typescript
formData.append('file', oggBuffer, {
  filename: 'audio.ogg',
  contentType: 'audio/ogg; codecs=opus'  // Crítico!
});
formData.append('messaging_product', 'whatsapp');
// NÃO adicionar campo 'type' separadamente
```

---

### 4. Envio de Mensagem de Áudio (whatsappClient.ts)
**Validar:**
- ✅ media_id recebido do upload
- ✅ Número de telefone formatado corretamente
- ✅ Payload JSON correto

**Como debugar:**
```typescript
console.log('Sending audio message');
console.log('To:', to);
console.log('Media ID:', audioId);
console.log('Payload:', JSON.stringify(payload, null, 2));
```

**Erros comuns:**
- `400 Bad Request` → media_id inválido ou expirado
- `404 Not Found` → PHONE_NUMBER_ID incorreto
- `Rate limit exceeded` → Muitas mensagens em pouco tempo

**Payload correto:**
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "5511999999999",
  "type": "audio",
  "audio": {
    "id": "MEDIA_ID_HERE"
  }
}
```

---

## WEBHOOK STATUS MESSAGES

Quando tudo funciona, você receberá:

1. **sent** - Mensagem aceita pelo WhatsApp
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "statuses": [{
          "status": "sent",
          "timestamp": "1234567890"
        }]
      }
    }]
  }]
}
```

2. **delivered** - Mensagem entregue ao dispositivo
```json
{
  "status": "delivered"
}
```

3. **read** - Mensagem lida pelo usuário
```json
{
  "status": "read"
}
```

---

## CHECKLIST COMPLETO DE DEBUGGING

### ✅ Pré-requisitos
- [ ] `WHATSAPP_TOKEN` configurado (System User token)
- [ ] `PHONE_NUMBER_ID` correto
- [ ] `ELEVEN_API_KEY` válido
- [ ] `ELEVEN_VOICE_ID` válido
- [ ] FFmpeg instalado (`npm list @ffmpeg-installer/ffmpeg`)
- [ ] Número de teste registrado no WhatsApp Business Console

### ✅ Fluxo ElevenLabs
- [ ] Request retorna status 200
- [ ] Buffer MP3 não está vazio
- [ ] Magic numbers MP3 válidos (hex começa com `fff`)

### ✅ Fluxo Conversão
- [ ] FFmpeg encontrado e executado
- [ ] Conversão retorna status 0 (sucesso)
- [ ] Buffer OGG não está vazio
- [ ] Magic numbers OGG válidos (`OggS`)
- [ ] Tamanho do arquivo < 16MB

### ✅ Fluxo Upload
- [ ] Request retorna status 200
- [ ] Response contém campo `id` (media_id)
- [ ] Content-Type correto: `audio/ogg; codecs=opus`
- [ ] FormData inclui `messaging_product: whatsapp`

### ✅ Fluxo Envio
- [ ] Request retorna status 200
- [ ] Response contém `message_id`
- [ ] Webhook recebe status `sent`
- [ ] Webhook recebe status `delivered`

---

## COMANDOS ÚTEIS DE DEBUG

### Verificar token WhatsApp
```bash
curl -X GET "https://graph.facebook.com/v18.0/me?fields=id,name" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Verificar formato do áudio gerado
```bash
# Salvar buffer em arquivo para análise
fs.writeFileSync('test.ogg', oggBuffer);

# Inspecionar com FFmpeg
ffmpeg -i test.ogg
# Deve mostrar: codec: opus, container: ogg
```

### Verificar media_id gerado
```bash
curl -X GET "https://graph.facebook.com/v18.0/MEDIA_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## LIMITES E RESTRIÇÕES

**WhatsApp Cloud API:**
- Tamanho máximo de áudio: **16 MB**
- Formatos aceitos: **OGG (OPUS codec), AAC, MP4, AMR**
- Duração máxima recomendada: **5 minutos**
- Rate limit: **80 mensagens/segundo** (varies by tier)

**ElevenLabs:**
- Character limit por request: depende do plano
- Concurrent requests: depende do plano
- Audio format: sempre MP3 (conversão obrigatória)

---

## LOGS ESPERADOS EM PRODUÇÃO

**Sucesso completo:**
```
🎵 === INÍCIO DO UPLOAD DE ÁUDIO ===
📊 Tamanho MP3 original: 45.32 KB
🔄 Iniciando conversão MP3 → OGG/OPUS
🎬 FFmpeg comando: ffmpeg -i pipe:0 -acodec libopus ...
✅ Conversão concluída: 38.21 KB
📤 Fazendo upload para WhatsApp Media API...
✅ Upload concluído com sucesso!
🆔 Media ID: 1234567890
🎵 === FIM DO UPLOAD DE ÁUDIO ===
📨 Enviando áudio com media_id: 1234567890
✅ 🎵 ÁUDIO ENVIADO COM SUCESSO para 5511999999999
```

**Erro na conversão:**
```
🎵 === INÍCIO DO UPLOAD DE ÁUDIO ===
🔄 Iniciando conversão MP3 → OGG/OPUS
❌ Erro na conversão FFmpeg: Invalid data found
⚠️ Erro no fluxo de áudio: Falha na conversão
🔄 Usando fallback: enviando texto...
✅ Texto enviado (fallback após erro)
```
