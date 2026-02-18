import { Router, Request, Response } from 'express';
import { WhatsAppWebhookPayload } from '../whatsapp/types';
import { MessageService } from '../services/MessageService';
import { stateManagerGated, EstadoPrincipal } from '../state/StateManagerGated';
import { interactiveMessageService } from '../whatsapp/interactiveMessages';
import axios from 'axios';

const router = Router();
const messageService = new MessageService();

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'meu_token_de_teste';

router.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('\n🔍 VERIFICAÇÃO WEBHOOK:');
  console.log('hub.mode:', mode);
  console.log('hub.verify_token:', token);
  console.log('hub.challenge:', challenge);
  console.log('Expected token:', VERIFY_TOKEN);

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ VERIFICADO\n');
    res.status(200).send(challenge);
  } else {
    console.log('❌ FALHOU\n');
    res.sendStatus(403);
  }
});

// ROTA POST /whatsapp REMOVIDA PARA EVITAR CONFLITO COM A ROTA PÚBLICA DEFINIDA EM app.ts
// router.post('/whatsapp', (req: Request, res: Response) => {
//   console.log('\n' + '='.repeat(80));
//   console.log('🔥 WEBHOOK POST RECEBIDO');
//   console.dir(req.body, { depth: null });
//   console.log('='.repeat(80));
//   
//   const payload = req.body as WhatsAppWebhookPayload;

  // Responder imediatamente com 200
  res.sendStatus(200);

  // Processar mensagem de forma assíncrona
  (async () => {
    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    try {
      if (payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const message = payload.entry[0].changes[0].value.messages[0];
        const wa_id = message.from;
        
        console.log('\n📱 MENSAGEM EXTRAÍDA:');
        console.log('  De:', wa_id);
        console.log('  Tipo:', message.type);
        
        // ==================== HANDLER: MENSAGEM DE TEXTO ====================
        if (message.type === 'text' && message.text?.body) {
          const textoRecebido = message.text.body;
          console.log(`📩 TEXTO RECEBIDO: "${textoRecebido}"`);
          
          // 1️⃣ GARANTIR QUE USUÁRIO EXISTE
          console.log('\n🔄 [1/6] Garantindo usuário...');
          const userState = await stateManagerGated.getOrCreateState(wa_id);
          console.log(`   ✅ Usuário: ${wa_id}`);
          console.log(`   📊 Estado atual: ${userState.estado_atual}`);
          console.log(`   🔢 Interações: ${userState.interacoes}`);
          console.log(`   ✓ Termo aceito: ${userState.accepted_terms ? '✅' : '❌'}`);
          console.log(`   ✓ Análise autorizada: ${userState.authorized_analysis ? '✅' : '❌'}`);
          
          // 2️⃣ INCREMENTAR INTERAÇÕES (APENAS EM TEXTO)
          console.log('\n🔄 [2/6] Incrementando interações...');
          await stateManagerGated.incrementInteractions(wa_id);
          console.log(`   ✅ Interações: ${userState.interacoes} → ${userState.interacoes + 1}`);
          
          // 3️⃣ VERIFICAR BLOQUEIOS DE GATE
          console.log('\n🔄 [3/6] Verificando bloqueios de gate...');
          const estadoAtualizado = await stateManagerGated.getOrCreateState(wa_id);
          
          if (estadoAtualizado.estado_atual === EstadoPrincipal.GATE_TERMO) {
            console.log('   🚫 BLOQUEADO: Aguardando aceite do Termo de Ciência');
            console.log('   ⏸️  Usuário não pode avançar sem clicar no botão');
            
            const bloqueio = 'Antes de continuar, preciso que você leia e aceite o Termo de Ciência acima. É rápido e garante transparência entre nós. 📋';
            
            await sendTextMessage(wa_id, bloqueio, PHONE_NUMBER_ID!, WHATSAPP_TOKEN!);
            return;
          }
          
          if (estadoAtualizado.estado_atual === EstadoPrincipal.GATE_AUTORIZACAO) {
            console.log('   🚫 BLOQUEADO: Aguardando autorização de análise');
            console.log('   ⏸️  Usuário não pode avançar sem clicar no botão');
            
            const bloqueio = 'Você compartilhou dados importantes! Agora preciso da sua autorização formal para analisar tudo. Clique no botão acima para autorizar. 🔍';
            
            await sendTextMessage(wa_id, bloqueio, PHONE_NUMBER_ID!, WHATSAPP_TOKEN!);
            return;
          }
          
          console.log('   ✅ Sem bloqueios ativos');
          
          // 4️⃣ OBTER PROMPT DINÂMICO DO ESTADO ATUAL
          console.log('\n🔄 [4/6] Obtendo prompt dinâmico...');
          const systemPrompt = await stateManagerGated.getCurrentPrompt(wa_id);
          console.log(`   ✅ Prompt para estado: ${estadoAtualizado.estado_atual}`);
          console.log(`   📝 Preview: ${systemPrompt.substring(0, 100)}...`);
          
          // 5️⃣ CHAMAR GPT COM PROMPT CORRETO E ENVIAR (COM ÁUDIO NA 1ª MENSAGEM)
          console.log('\n🔄 [5/6] Chamando GPT e enviando resposta...');
          
          try {
            if (!OPENAI_API_KEY) {
              throw new Error('OPENAI_API_KEY não configurada');
            }
            
            // IMPORTANTE: usar sendResponseWithAudioSupport para garantir áudio na 1ª msg
            await messageService.sendResponseWithAudioSupport(
              wa_id,
              textoRecebido,
              systemPrompt
            );
            
            console.log('   ✅ Resposta enviada (com áudio se primeira mensagem)');
          } catch (gptError: any) {
            console.error('   ❌ ERRO GPT:', gptError.message);
            const fallback = 'Recebi sua mensagem. Já te respondo.';
            await sendTextMessage(wa_id, fallback, PHONE_NUMBER_ID!, WHATSAPP_TOKEN!);
          }
          
          // 6️⃣ VERIFICAR SE DEVE DISPARAR GATES AUTOMATICAMENTE
          console.log('\n🎯 Verificando elegibilidade para gates...');
          
          const canGate1 = await stateManagerGated.canAdvanceToGate1(wa_id);
          if (canGate1) {
            console.log('   ✅ Elegível para GATE 1 (Termo de Ciência)');
            await stateManagerGated.advanceState(wa_id);
            
            console.log('   📤 Disparando GATE 1...');
            await interactiveMessageService.sendGate1(wa_id);
            console.log('   ✅ GATE 1 enviado!');
            return;
          }
          
          const canGate2 = await stateManagerGated.canAdvanceToGate2(wa_id);
          if (canGate2) {
            console.log('   ✅ Elegível para GATE 2 (Autorização de Análise)');
            await stateManagerGated.advanceState(wa_id);
            
            console.log('   📤 Disparando GATE 2...');
            await interactiveMessageService.sendGate2(wa_id);
            console.log('   ✅ GATE 2 enviado!');
            return;
          }
          
          // 7️⃣ AVANÇAR ESTADO SE ELEGÍVEL (não-gates)
          await stateManagerGated.advanceState(wa_id);
          
          console.log('\n✅ Processamento completo!\n');
        }
        
        // ==================== HANDLER: MENSAGEM INTERATIVA (BOTÕES) ====================
        else if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
          const buttonId = message.interactive.button_reply?.id;
          if (!buttonId) {
            console.log('⚠️  Botão sem ID');
            return;
          }
          
          console.log(`🔘 BOTÃO CLICADO: ${buttonId}`);
          
          // NÃO incrementar interações em cliques de botão
          console.log('   ℹ️  Interações NÃO incrementadas (é botão, não texto)');
          
          // 1️⃣ GATE 1: Aceitar Termo
          if (buttonId === 'accept_terms') {
            console.log('\n🎯 [GATE 1] Processando aceite de termo...');
            
            const userState = await stateManagerGated.getOrCreateState(wa_id);
            console.log(`   Estado atual: ${userState.estado_atual}`);
            
            if (userState.estado_atual !== EstadoPrincipal.GATE_TERMO) {
              console.log('   ⚠️  Usuário não está no estado GATE_TERMO');
              await sendTextMessage(wa_id, 'Você já aceitou o termo anteriormente!', PHONE_NUMBER_ID!, WHATSAPP_TOKEN!);
              return;
            }
            
            await stateManagerGated.acceptTerms(wa_id);
            console.log('   ✅ Termo aceito!');
            console.log('   🔄 Estado: GATE_TERMO → IMERSAO');
            
            await interactiveMessageService.sendConfirmation(wa_id, 'terms_accepted');
            console.log('   ✅ Confirmação enviada!');
          }
          
          // 2️⃣ GATE 1: Entender melhor
          else if (buttonId === 'understand_better') {
            console.log('\n❓ [GATE 1] Usuário quer entender melhor o termo...');
            
            await interactiveMessageService.sendTermExplanation(wa_id);
            console.log('   ✅ Explicação enviada + botões reenviados');
          }
          
          // 3️⃣ GATE 2: Autorizar análise
          else if (buttonId === 'authorize_analysis') {
            console.log('\n🎯 [GATE 2] Processando autorização de análise...');
            
            const userState = await stateManagerGated.getOrCreateState(wa_id);
            console.log(`   Estado atual: ${userState.estado_atual}`);
            
            if (userState.estado_atual !== EstadoPrincipal.GATE_AUTORIZACAO) {
              console.log('   ⚠️  Usuário não está no estado GATE_AUTORIZACAO');
              await sendTextMessage(wa_id, 'Você já autorizou a análise anteriormente!', PHONE_NUMBER_ID!, WHATSAPP_TOKEN!);
              return;
            }
            
            await stateManagerGated.authorizeAnalysis(wa_id);
            console.log('   ✅ Análise autorizada!');
            console.log('   🔄 Estado: GATE_AUTORIZACAO → VISAO');
            
            await interactiveMessageService.sendConfirmation(wa_id, 'analysis_authorized');
            console.log('   ✅ Confirmação enviada!');
          }
          
          // 4️⃣ GATE 2: Revisar antes
          else if (buttonId === 'review_before') {
            console.log('\n🔄 [GATE 2] Usuário quer revisar dados antes...');
            
            await interactiveMessageService.sendReviewOption(wa_id);
            console.log('   ✅ Opção de revisão enviada');
          }
          
          else {
            console.log(`   ⚠️  Botão desconhecido: ${buttonId}`);
          }
        }
        
        else {
          console.log(`⚠️  Tipo de mensagem "${message.type}" não suportado\n`);
        }
      } else {
        console.log('⚠️  Payload sem mensagens (status update)\n');
      }
    } catch (error: any) {
      console.error('\n❌ ERRO CRÍTICO ao processar webhook:', error);
      console.dir(payload, { depth: null });
    }
  })();
});

/**
 * Helper: Enviar mensagem de texto
 */
async function sendTextMessage(to: string, text: string, phoneNumberId: string, token: string): Promise<void> {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          preview_url: false,
          body: text
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('   ✅ Mensagem enviada com sucesso');
    console.log('   📩 Message ID:', response.data?.messages?.[0]?.id);
  } catch (error: any) {
    console.error('   ❌ ERRO ao enviar mensagem');
    console.error('   Status:', error.response?.status);
    console.error('   Erro:', error.response?.data?.error?.message || error.message);
  }
}

export default router;