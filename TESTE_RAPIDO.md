# 🧪 TESTE RÁPIDO - VALIDAÇÃO LOCAL

## 🚀 EXECUTE ESTE TESTE AGORA

Este é um teste rápido para validar que o sistema está funcionando localmente.

---

## 1️⃣ INICIAR SERVIDOR

```powershell
npm run dev
```

**Resultado esperado:**
```
🔑 VARIÁVEIS CARREGADAS:
  PHONE_NUMBER_ID: ✅ Configurado
  WHATSAPP_TOKEN: ✅ EAAfNW83s6NABQ...
  OPENAI_API_KEY: ✅ Configurado
✅ Servidor rodando na porta 3000
```

---

## 2️⃣ TESTE 1: Criar usuário (ENTRADA → LUCIDEZ)

**Via PowerShell:**

```powershell
$body = @'
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "938667522662819"
        },
        "messages": [{
          "from": "5511999999999",
          "id": "wamid.TEST_1",
          "timestamp": "1672531200",
          "type": "text",
          "text": {
            "body": "Olá, preciso de ajuda com minhas finanças"
          }
        }]
      },
      "field": "messages"
    }]
  }]
}
'@

Invoke-RestMethod -Uri "http://localhost:3000/whatsapp" -Method POST -Body $body -ContentType "application/json"
```

**Logs esperados no servidor:**

```
================================================================================
🔥 WEBHOOK POST RECEBIDO
================================================================================

📱 MENSAGEM EXTRAÍDA:
  De: 5511999999999
  Tipo: text
📩 TEXTO RECEBIDO: "Olá, preciso de ajuda com minhas finanças"

🔄 [1/6] Garantindo usuário...
✨ Novo usuário criado: 5511999999999 → ESTADO: ENTRADA
   ✅ Usuário: 5511999999999
   📊 Estado atual: ENTRADA
   🔢 Interações: 0
   ✓ Termo aceito: ❌
   ✓ Análise autorizada: ❌

🔄 [2/6] Incrementando interações...
   ✅ Interações: 0 → 1

🔄 [3/6] Verificando bloqueios de gate...
   ✅ Sem bloqueios ativos

🔄 [4/6] Obtendo prompt dinâmico...
   ✅ Prompt para estado: LUCIDEZ
   📝 Preview: Você é Léo, um assessor financeiro...

🔄 [5/6] Chamando GPT...
   🤖 GPT respondeu: "..."

🔄 [6/6] Enviando resposta...
   ✅ Mensagem enviada com sucesso
   📩 Message ID: wamid.xxx

🎯 Verificando elegibilidade para gates...
🔄 5511999999999: ENTRADA → LUCIDEZ

✅ Processamento completo!
```

**✅ Validação:**
- [ ] Usuário criado com sucesso
- [ ] Estado: ENTRADA → LUCIDEZ
- [ ] Interações: 0 → 1
- [ ] GPT chamado com prompt de LUCIDEZ
- [ ] Sem erros

---

## 3️⃣ TESTE 2: Conversar em LUCIDEZ (3x)

**Mensagem 2:**

```powershell
$body = @'
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "938667522662819"
        },
        "messages": [{
          "from": "5511999999999",
          "id": "wamid.TEST_2",
          "timestamp": "1672531260",
          "type": "text",
          "text": {
            "body": "Estou endividado e não consigo sair dessa"
          }
        }]
      },
      "field": "messages"
    }]
  }]
}
'@

Invoke-RestMethod -Uri "http://localhost:3000/whatsapp" -Method POST -Body $body -ContentType "application/json"
```

**Mensagem 3 (identifica sonho - dispara GATE 1):**

```powershell
$body = @'
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "938667522662819"
        },
        "messages": [{
          "from": "5511999999999",
          "id": "wamid.TEST_3",
          "timestamp": "1672531320",
          "type": "text",
          "text": {
            "body": "Meu sonho é viajar pelo mundo e ter liberdade financeira"
          }
        }]
      },
      "field": "messages"
    }]
  }]
}
'@

Invoke-RestMethod -Uri "http://localhost:3000/whatsapp" -Method POST -Body $body -ContentType "application/json"
```

**Logs esperados após mensagem 3:**

```
🔄 [2/6] Incrementando interações...
   ✅ Interações: 2 → 3

🎯 Verificando elegibilidade para gates...
   ✅ Elegível para GATE 1 (Termo de Ciência)
🔄 5511999999999: LUCIDEZ → GATE_TERMO
   📤 Disparando GATE 1...
✅ GATE 1 (Termo) enviado para 5511999999999
   Message ID: wamid.xxx
   ✅ GATE 1 enviado!

✅ Processamento completo!
```

**✅ Validação:**
- [ ] Interações: 3
- [ ] Estado: LUCIDEZ → GATE_TERMO
- [ ] GATE 1 disparado automaticamente
- [ ] Mensagem interativa enviada (mesmo que Meta não esteja ativa, log aparece)

---

## 4️⃣ TESTE 3: Tentar enviar texto em GATE (BLOQUEIO)

```powershell
$body = @'
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "938667522662819"
        },
        "messages": [{
          "from": "5511999999999",
          "id": "wamid.TEST_BLOCK",
          "timestamp": "1672531380",
          "type": "text",
          "text": {
            "body": "Me dá mais informações?"
          }
        }]
      },
      "field": "messages"
    }]
  }]
}
'@

Invoke-RestMethod -Uri "http://localhost:3000/whatsapp" -Method POST -Body $body -ContentType "application/json"
```

**Logs esperados:**

```
🔄 [3/6] Verificando bloqueios de gate...
   🚫 BLOQUEADO: Aguardando aceite do Termo de Ciência
   ⏸️  Usuário não pode avançar sem clicar no botão
   ✅ Mensagem enviada com sucesso
```

**✅ Validação:**
- [ ] Bloqueio detectado
- [ ] Mensagem de bloqueio enviada
- [ ] Usuário NÃO avançou de estado
- [ ] GPT NÃO foi chamado

---

## 5️⃣ TESTE 4: Clicar em botão GATE 1

```powershell
$body = @'
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "938667522662819"
        },
        "messages": [{
          "from": "5511999999999",
          "id": "wamid.BUTTON_1",
          "timestamp": "1672531440",
          "type": "interactive",
          "interactive": {
            "type": "button_reply",
            "button_reply": {
              "id": "accept_terms",
              "title": "✅ Li e aceito"
            }
          }
        }]
      },
      "field": "messages"
    }]
  }]
}
'@

Invoke-RestMethod -Uri "http://localhost:3000/whatsapp" -Method POST -Body $body -ContentType "application/json"
```

**Logs esperados:**

```
🔘 BOTÃO CLICADO: accept_terms
   ℹ️  Interações NÃO incrementadas (é botão, não texto)

🎯 [GATE 1] Processando aceite de termo...
   Estado atual: GATE_TERMO
   ✅ Termo aceito!
   🔄 Estado: GATE_TERMO → IMERSAO
✅ Confirmação enviada: terms_accepted
   ✅ Confirmação enviada!
```

**✅ Validação:**
- [ ] Botão reconhecido: `accept_terms`
- [ ] Interações NÃO incrementadas
- [ ] Termo aceito: `accepted_terms = true`
- [ ] Estado: GATE_TERMO → IMERSAO
- [ ] Confirmação enviada

---

## 📋 CHECKLIST COMPLETO

Execute os 5 testes acima e confirme:

- [ ] ✅ Servidor iniciou sem erros
- [ ] ✅ TESTE 1: Usuário criado em ENTRADA
- [ ] ✅ TESTE 1: Estado avançou para LUCIDEZ
- [ ] ✅ TESTE 2: Interações incrementadas (3x)
- [ ] ✅ TESTE 2: GATE 1 disparado automaticamente
- [ ] ✅ TESTE 3: Bloqueio funcionou (mensagem de bloqueio enviada)
- [ ] ✅ TESTE 4: Botão desbloqueou IMERSAO
- [ ] ✅ TESTE 4: Interações NÃO incrementadas em botão
- [ ] ✅ Logs claros em cada etapa
- [ ] ✅ Nenhum erro no console

---

## ✅ SE TODOS OS TESTES PASSARAM

**PARABÉNS!** 🎉

O sistema está **100% funcional** localmente.

**Próximos passos:**
1. ✅ Aguardar Meta ativar número
2. ✅ Configurar webhook público (ngrok)
3. ✅ Testar com WhatsApp real
4. ✅ Validar mensagens interativas reais

---

## ❌ SE ALGUM TESTE FALHOU

**Verificar:**
- Servidor rodando na porta 3000?
- Variáveis de ambiente configuradas?
- Banco de dados acessível?
- Erros no console?

**Debug:**
- Ver logs detalhados no terminal
- Verificar [ENTREGA_FINAL_ESTADOS.md](ENTREGA_FINAL_ESTADOS.md)
- Consultar [PAYLOADS_SIMULACAO.md](PAYLOADS_SIMULACAO.md)
