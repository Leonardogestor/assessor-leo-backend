# 🧪 ROTEIRO DE TESTE FIM-A-FIM - ESTADOS E GATES

## 📱 PRÉ-REQUISITOS

1. Servidor rodando: `npm run dev`
2. Ngrok expondo webhook
3. WhatsApp configurado no Meta Developer Console
4. Número de teste registrado

---

## 🎯 TESTE 1: ENTRADA → LUCIDEZ

### **Ação do usuário:**
```
Enviar: "Olá"
```

### **Comportamento esperado:**
1. ✅ Sistema detecta primeira interação
2. ✅ Cria estado `ENTRADA`
3. ✅ Envia áudio + texto (primeira mensagem)
4. ✅ Mensagem acolhedora, pergunta aberta
5. ✅ NÃO pede dados, NÃO fala de método
6. ✅ Avança para estado `LUCIDEZ` automaticamente

### **Logs esperados:**
```
✨ Novo usuário criado: 5511999999999 → ESTADO: ENTRADA
🎯 PRIMEIRA MENSAGEM DETECTADA - Enviando em áudio!
🔄 5511999999999: ENTRADA → LUCIDEZ
```

### **Exemplo de resposta:**
> "Olá! 😊 Fico feliz em conversar com você. Me conta, o que te trouxe até aqui hoje?"

---

## 🎯 TESTE 2: LUCIDEZ → GATE 1 (TERMO)

### **Ação do usuário:**
```
Enviar: "Estou perdido com minhas finanças"
Aguardar resposta
Enviar: "Quero realizar meu sonho de viajar"
Aguardar resposta
Enviar: "Mas tenho medo de não conseguir"
```

### **Comportamento esperado:**
1. ✅ Sistema usa prompt de LUCIDEZ
2. ✅ Aplica técnicas de PNL (espelhamento, reframing)
3. ✅ Identifica sonho: "viajar"
4. ✅ Após 3+ interações + sonho identificado
5. ✅ **Envia GATE 1 automaticamente** (botões interativos)

### **Logs esperados:**
```
🔄 5511999999999: LUCIDEZ → GATE_TERMO
✅ GATE 1 (Termo) enviado para 5511999999999
```

### **Mensagem recebida:**
```
📋 Termo de Ciência

Antes de continuar, preciso da sua autorização formal...
[Botões]
✅ Li e aceito
❓ Quero entender
```

---

## 🎯 TESTE 3: ACEITAR TERMO → IMERSÃO

### **Ação do usuário:**
```
Clicar em: "✅ Li e aceito"
```

### **Comportamento esperado:**
1. ✅ Sistema detecta `button_reply.id = 'accept_terms'`
2. ✅ Chama `stateManagerGated.acceptTerms()`
3. ✅ Atualiza: `accepted_terms = true`
4. ✅ Avança para estado `IMERSAO`
5. ✅ Envia confirmação
6. ✅ Próxima mensagem já usa prompt de IMERSÃO

### **Logs esperados:**
```
✅ 5511999999999 aceitou Termo de Ciência → IMERSAO
✅ Confirmação enviada: terms_accepted
```

### **Mensagem recebida:**
```
🎉 Perfeito! Termo aceito.

Agora podemos avançar de forma mais profunda...
Pode me enviar seus dados quando estiver pronto!
```

---

## 🎯 TESTE 4: IMERSÃO → GATE 2 (AUTORIZAÇÃO)

### **Ação do usuário:**
```
Enviar: "Minha renda é R$ 3000"
Aguardar resposta
Enviar: "Tenho R$ 5000 de dívidas no cartão"
Aguardar resposta
Enviar: "Gasto mais ou menos R$ 2500 por mês"
Aguardar resposta
Enviar: "Vou te enviar print do extrato"
[Enviar imagem do extrato]
```

### **Comportamento esperado:**
1. ✅ Sistema coleta dados um por um
2. ✅ Valida emocionalmente antes de pedir próximo
3. ✅ Atualiza `dados_coletados` com cada informação
4. ✅ Após todos dados completos (renda + dívidas + gastos + prints)
5. ✅ **Envia GATE 2 automaticamente** (botões interativos)

### **Logs esperados:**
```
🔄 5511999999999: IMERSAO → GATE_AUTORIZACAO
✅ GATE 2 (Autorização) enviado para 5511999999999
```

### **Mensagem recebida:**
```
🔍 Autorização de Análise

Você compartilhou informações valiosas comigo! 🙏
[Explicação da autorização]
[Botões]
✅ Autorizo análise
🔄 Revisar antes
```

---

## 🎯 TESTE 5: AUTORIZAR ANÁLISE → VISÃO

### **Ação do usuário:**
```
Clicar em: "✅ Autorizo análise"
```

### **Comportamento esperado:**
1. ✅ Sistema detecta `button_reply.id = 'authorize_analysis'`
2. ✅ Chama `stateManagerGated.authorizeAnalysis()`
3. ✅ Atualiza: `authorized_analysis = true`
4. ✅ Avança para estado `VISAO`
5. ✅ Envia confirmação
6. ✅ GPT agora tem acesso a todos dados financeiros
7. ✅ Próxima mensagem apresenta DIAGNÓSTICO + método LEAVE

### **Logs esperados:**
```
✅ 5511999999999 autorizou análise → VISAO
✅ Confirmação enviada: analysis_authorized
```

### **Mensagem recebida:**
```
🎯 Autorização recebida!

Vou analisar tudo que você compartilhou...
[Apresenta diagnóstico completo]
[Explica método LEAVE]
[Constrói cenários futuros]
```

---

## 🎯 TESTE 6: VISÃO → EXPERIÊNCIAS (LOOP)

### **Ação do usuário:**
```
Enviar: "Entendi! O que devo fazer agora?"
Aguardar resposta
Enviar: "Quero começar!"
```

### **Comportamento esperado:**
1. ✅ Sistema apresenta plano de ação
2. ✅ Após 2+ interações no estado VISÃO
3. ✅ Avança automaticamente para `EXPERIENCIAS`
4. ✅ Define primeira ação (72h)
5. ✅ **Este estado nunca termina** (loop infinito)

### **Logs esperados:**
```
🔄 5511999999999: VISAO → EXPERIENCIAS (LOOP INFINITO)
```

### **Mensagem recebida:**
```
🚀 Perfeito! Vamos à PRIMEIRA AÇÃO:

Nas próximas 72h, quero que você:
[Define microvitória específica]
[Conecta com sonho]
[Reforça identidade]

Me manda uma mensagem amanhã me contando como foi!
```

---

## 🎯 TESTE 7: LOOP INFINITO (ACOMPANHAMENTO)

### **Ação do usuário:**
```
[Dia seguinte]
Enviar: "Consegui! Fiz a primeira ação"
```

### **Comportamento esperado:**
1. ✅ Sistema celebra conquista
2. ✅ Reforça âncora emocional (sonho)
3. ✅ Define próxima micro-ação
4. ✅ Mantém estado `EXPERIENCIAS` (nunca avança)
5. ✅ Acompanhamento contínuo

### **Mensagem recebida:**
```
🎉 PARABÉNS! Você é alguém que honra seus compromissos!

[Celebra conquista]
[Conecta com sonho de viajar]
[Define próxima ação]

Continue assim! Você está mais perto do seu sonho. 🚀
```

---

## ⚠️ TESTES DE BLOQUEIO (GATES)

### **Teste A: Tentar pular GATE 1**

**Ação:**
```
[Estado: GATE_TERMO]
Enviar: "Qual minha renda?" (tentando avançar sem clicar)
```

**Esperado:**
```
✅ Sistema responde brevemente MAS reforça necessidade do termo
✅ NÃO coleta dados
✅ NÃO avança de estado
```

---

### **Teste B: Tentar pular GATE 2**

**Ação:**
```
[Estado: GATE_AUTORIZACAO]
Enviar: "Pode fazer a análise?" (tentando avançar sem clicar)
```

**Esperado:**
```
✅ Sistema explica que precisa da autorização formal
✅ NÃO faz análise
✅ NÃO avança de estado
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

Após testes, verificar:

- [ ] Primeira mensagem sempre em áudio
- [ ] Estado ENTRADA → LUCIDEZ automático
- [ ] GATE 1 enviado após 3 interações + sonho
- [ ] Botões interativos funcionando (cliques detectados)
- [ ] Aceite de termo desbloqueia IMERSÃO
- [ ] Coleta de dados acontece apenas após GATE 1
- [ ] GATE 2 enviado após dados completos
- [ ] Autorização desbloqueia VISÃO e análise completa
- [ ] GPT usa prompts diferentes por estado
- [ ] EXPERIENCIAS é loop infinito (nunca termina)
- [ ] Usuário não pode pular gates
- [ ] Persistência no banco de dados (ou memória)
- [ ] Logs detalhados em cada transição

---

## 🐛 DEBUG

**Ver estado atual do usuário:**
```bash
# No código:
const state = await stateManagerGated.getState(phone_number);
console.log(JSON.stringify(state, null, 2));
```

**Forçar reset (desenvolvimento):**
```sql
DELETE FROM onboarding_state WHERE user_id = '5511999999999';
```

---

## ✅ CRITÉRIOS DE SUCESSO

O teste está **100% aprovado** se:

1. ✅ Fluxo completo executado sem erros
2. ✅ GATE 1 bloqueia até clique em botão
3. ✅ GATE 2 bloqueia até clique em botão
4. ✅ GPT usa prompts corretos por estado
5. ✅ Dados persistidos corretamente
6. ✅ Loop infinito em EXPERIENCIAS funciona
7. ✅ Primeira mensagem sempre em áudio

---

**Tempo estimado do teste completo:** 15-20 minutos  
**Pré-requisito:** Mensagens interativas habilitadas no Meta Console
