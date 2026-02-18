# 📦 PAYLOADS DE SIMULAÇÃO - TESTE SEM META

Use estes payloads para testar o fluxo completo via **Postman** ou **curl** sem depender do WhatsApp real.

## 🔧 CONFIGURAÇÃO

**URL do webhook local:**
```
POST http://localhost:3000/whatsapp
```

**Headers:**
```
Content-Type: application/json
```

---

## 📩 TESTE 1: Mensagem de texto inicial (ENTRADA → LUCIDEZ)

**Descrição:** Primeira mensagem do usuário. Sistema cria usuário em estado ENTRADA, incrementa interações, avança para LUCIDEZ.

**Payload:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "938667522662819"
            },
            "contacts": [
              {
                "profile": {
                  "name": "João Teste"
                },
                "wa_id": "5511999999999"
              }
            ],
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.MENSAGEM_1",
                "timestamp": "1672531200",
                "type": "text",
                "text": {
                  "body": "Olá, preciso de ajuda com minhas finanças"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Resultado esperado:**
- ✅ Usuário criado: `5511999999999`
- ✅ Estado: ENTRADA → LUCIDEZ
- ✅ Interações: 0 → 1
- ✅ GPT responde com prompt de LUCIDEZ (acolhedor, perguntas abertas)
- ✅ Mensagem enviada ao usuário

**Logs esperados:**
```
🔥 WEBHOOK POST RECEBIDO
📱 MENSAGEM EXTRAÍDA: De: 5511999999999, Tipo: text
📩 TEXTO RECEBIDO: "Olá, preciso de ajuda com minhas finanças"
🔄 [1/6] Garantindo usuário...
   ✅ Usuário: 5511999999999
   📊 Estado atual: ENTRADA
   🔢 Interações: 0
🔄 [2/6] Incrementando interações...
   ✅ Interações: 0 → 1
🔄 [3/6] Verificando bloqueios de gate...
   ✅ Sem bloqueios ativos
🔄 [4/6] Obtendo prompt dinâmico...
   ✅ Prompt para estado: LUCIDEZ
🔄 [5/6] Chamando GPT...
   🤖 GPT respondeu: "..."
🔄 [6/6] Enviando resposta...
   ✅ Mensagem enviada com sucesso
🔄 ENTRADA → LUCIDEZ
✅ Processamento completo!
```

---

## 💬 TESTE 2: Conversa no estado LUCIDEZ

**Descrição:** Usuário continua conversando. Sistema identifica sonho principal e prepara para GATE 1.

**Payload 1 (2ª mensagem):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "938667522662819"
            },
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.MENSAGEM_2",
                "timestamp": "1672531260",
                "type": "text",
                "text": {
                  "body": "Estou endividado e não consigo sair dessa situação"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Payload 2 (3ª mensagem - identifica sonho):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "938667522662819"
            },
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.MENSAGEM_3",
                "timestamp": "1672531320",
                "type": "text",
                "text": {
                  "body": "Meu sonho é viajar pelo mundo e ter liberdade financeira"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Resultado esperado após 3ª mensagem:**
- ✅ Interações: 3
- ✅ Sonho identificado: "viajar pelo mundo e ter liberdade financeira"
- ✅ Estado: LUCIDEZ → GATE_TERMO
- ✅ **GATE 1 disparado automaticamente** (mensagem com botões)

**Logs esperados:**
```
🎯 Verificando elegibilidade para gates...
   ✅ Elegível para GATE 1 (Termo de Ciência)
   🔄 LUCIDEZ → GATE_TERMO
   📤 Disparando GATE 1...
   ✅ GATE 1 enviado!
```

---

## 🔘 TESTE 3: Clique no botão GATE 1 (Aceitar Termo)

**Descrição:** Usuário clica em "✅ Li e aceito" no GATE 1. Sistema desbloqueia IMERSAO.

**Payload:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "938667522662819"
            },
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.BUTTON_1",
                "timestamp": "1672531380",
                "type": "interactive",
                "interactive": {
                  "type": "button_reply",
                  "button_reply": {
                    "id": "accept_terms",
                    "title": "✅ Li e aceito"
                  }
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Resultado esperado:**
- ✅ Botão reconhecido: `accept_terms`
- ✅ **Interações NÃO incrementadas** (é botão, não texto)
- ✅ Termo aceito: `accepted_terms = true`
- ✅ Estado: GATE_TERMO → IMERSAO
- ✅ Confirmação enviada: "🎉 Perfeito! Termo aceito..."

**Logs esperados:**
```
🔘 BOTÃO CLICADO: accept_terms
   ℹ️  Interações NÃO incrementadas (é botão, não texto)
🎯 [GATE 1] Processando aceite de termo...
   Estado atual: GATE_TERMO
   ✅ Termo aceito!
   🔄 Estado: GATE_TERMO → IMERSAO
   ✅ Confirmação enviada!
```

---

## 💰 TESTE 4: Envio de dados financeiros (IMERSAO)

**Descrição:** Usuário envia dados financeiros. Sistema coleta e prepara para GATE 2.

**Payload 1 (renda):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "938667522662819"
            },
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.MENSAGEM_4",
                "timestamp": "1672531440",
                "type": "text",
                "text": {
                  "body": "Minha renda é R$ 3000 por mês"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Payload 2 (dívidas):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "938667522662819"
            },
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.MENSAGEM_5",
                "timestamp": "1672531500",
                "type": "text",
                "text": {
                  "body": "Devo R$ 12000 no cartão de crédito"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Payload 3 (gastos mensais - dispara GATE 2):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "938667522662819"
            },
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.MENSAGEM_6",
                "timestamp": "1672531560",
                "type": "text",
                "text": {
                  "body": "Gasto cerca de R$ 2500 por mês com tudo. Tenho extratos sim"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Resultado esperado após 3ª mensagem:**
- ✅ Dados coletados: renda, dívidas, gastos, extratos
- ✅ Estado: IMERSAO → GATE_AUTORIZACAO
- ✅ **GATE 2 disparado automaticamente** (mensagem com botões)

**Logs esperados:**
```
🎯 Verificando elegibilidade para gates...
   ✅ Elegível para GATE 2 (Autorização de Análise)
   🔄 IMERSAO → GATE_AUTORIZACAO
   📤 Disparando GATE 2...
   ✅ GATE 2 enviado!
```

---

## 🔘 TESTE 5: Clique no botão GATE 2 (Autorizar Análise)

**Descrição:** Usuário clica em "✅ Autorizo análise" no GATE 2. Sistema desbloqueia VISAO.

**Payload:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "938667522662819"
            },
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.BUTTON_2",
                "timestamp": "1672531620",
                "type": "interactive",
                "interactive": {
                  "type": "button_reply",
                  "button_reply": {
                    "id": "authorize_analysis",
                    "title": "✅ Autorizo análise"
                  }
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Resultado esperado:**
- ✅ Botão reconhecido: `authorize_analysis`
- ✅ **Interações NÃO incrementadas** (é botão, não texto)
- ✅ Análise autorizada: `authorized_analysis = true`
- ✅ Estado: GATE_AUTORIZACAO → VISAO
- ✅ Confirmação enviada: "🎯 Autorização recebida! Vou analisar..."

**Logs esperados:**
```
🔘 BOTÃO CLICADO: authorize_analysis
   ℹ️  Interações NÃO incrementadas (é botão, não texto)
🎯 [GATE 2] Processando autorização de análise...
   Estado atual: GATE_AUTORIZACAO
   ✅ Análise autorizada!
   🔄 Estado: GATE_AUTORIZACAO → VISAO
   ✅ Confirmação enviada!
```

---

## 🔍 TESTE 6: Conversa em VISAO (Diagnóstico + Plano)

**Descrição:** Usuário recebe diagnóstico completo e plano de ação.

**Payload:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "938667522662819"
            },
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.MENSAGEM_7",
                "timestamp": "1672531680",
                "type": "text",
                "text": {
                  "body": "Ok, estou pronto para ver a análise"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Resultado esperado:**
- ✅ Estado: VISAO
- ✅ GPT apresenta diagnóstico usando dados financeiros
- ✅ GPT apresenta método LEAVE
- ✅ GPT cria cenários futuros e plano de ação

---

## 🎯 TESTE 7: BLOQUEIO de GATE (usuário tenta avançar sem aceitar)

**Descrição:** Usuário está em GATE_TERMO mas envia mensagem de texto ao invés de clicar no botão.

**Payload:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "938667522662819"
            },
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.MENSAGEM_BLOCK",
                "timestamp": "1672531740",
                "type": "text",
                "text": {
                  "body": "Pode me dar mais informações?"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Resultado esperado:**
- ✅ Bloqueio detectado: estado é GATE_TERMO
- ✅ Mensagem de bloqueio enviada: "Antes de continuar, preciso que você leia e aceite o Termo..."
- ✅ **Usuário NÃO avança** sem clicar no botão

**Logs esperados:**
```
🔄 [3/6] Verificando bloqueios de gate...
   🚫 BLOQUEADO: Aguardando aceite do Termo de Ciência
   ⏸️  Usuário não pode avançar sem clicar no botão
   ✅ Mensagem de bloqueio enviada
```

---

## 🧪 TESTE 8: Botão "Quero entender melhor" (GATE 1)

**Descrição:** Usuário clica no botão de ajuda no GATE 1.

**Payload:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "938667522662819"
            },
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.BUTTON_HELP",
                "timestamp": "1672531800",
                "type": "interactive",
                "interactive": {
                  "type": "button_reply",
                  "button_reply": {
                    "id": "understand_better",
                    "title": "❓ Quero entender"
                  }
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Resultado esperado:**
- ✅ Explicação enviada sobre o termo
- ✅ GATE 1 reenviado automaticamente após 2 segundos
- ✅ Estado permanece: GATE_TERMO

---

## 📋 CHECKLIST DE VALIDAÇÃO

Após executar todos os payloads, confirme:

- [ ] ✅ Usuário criado em ENTRADA
- [ ] ✅ Estado avança: ENTRADA → LUCIDEZ
- [ ] ✅ Interações incrementadas apenas em texto (NÃO em botões)
- [ ] ✅ GATE 1 disparado automaticamente após critérios cumpridos
- [ ] ✅ Bloqueio funciona (mensagem de texto em GATE não avança)
- [ ] ✅ Clique em botão aceita termo e desbloqueia IMERSAO
- [ ] ✅ Dados financeiros coletados
- [ ] ✅ GATE 2 disparado automaticamente
- [ ] ✅ Clique em botão autoriza análise e desbloqueia VISAO
- [ ] ✅ GPT usa prompt correto por estado
- [ ] ✅ Logs claros em cada etapa
- [ ] ✅ Confirmações enviadas após cliques de botão

---

## 🚀 COMO TESTAR

### Via Postman:

1. Criar nova request POST: `http://localhost:3000/whatsapp`
2. Header: `Content-Type: application/json`
3. Body: copiar payload JSON
4. Send
5. Verificar logs no terminal do servidor

### Via curl (PowerShell):

```powershell
# TESTE 1: Mensagem inicial
$body = @"
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "938667522662819"
            },
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.MENSAGEM_1",
                "timestamp": "1672531200",
                "type": "text",
                "text": {
                  "body": "Olá, preciso de ajuda com minhas finanças"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
"@

Invoke-RestMethod -Uri "http://localhost:3000/whatsapp" -Method POST -Body $body -ContentType "application/json"
```

---

## ⚠️ IMPORTANTE

- **Meta não precisa estar ativa** para estes testes
- Todos os payloads funcionam via webhook local
- Logs completos no terminal do servidor
- Mensagens do WhatsApp NÃO serão enviadas (Meta não ativa)
- Foco: **validar lógica de estado, gates e bloqueios**
