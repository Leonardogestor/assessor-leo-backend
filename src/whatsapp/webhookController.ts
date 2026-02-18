import { Request, Response } from 'express';

export async function handleWebhookVerification(req: Request, res: Response): Promise<void> {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔍 Verificação de webhook recebida');
  console.log('   hub.mode:', mode);
  console.log('   hub.verify_token:', token);
  console.log('   hub.challenge:', challenge);

  const expectedToken = process.env.TOKEN_META_FACEBOOK || 'default-verify-token';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('✅ Webhook verificado com sucesso');
    res.status(200).send(challenge);
  } else {
    console.warn('⚠️  Falha na verificação do webhook');
    console.warn('   Token esperado:', expectedToken);
    console.warn('   Token recebido:', token);
    res.sendStatus(403);
  }
}

export async function handleWebhookMessage(req: Request, res: Response): Promise<void> {
  res.sendStatus(200);

  try {
    console.log('\n📥 ===== WEBHOOK POST RECEBIDO =====');
    console.log('Payload completo:', JSON.stringify(req.body, null, 2));

    const entry = req.body?.entry?.[0];
    
    if (!entry) {
      console.log('⚠️  Payload sem entry');
      return;
    }

    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) {
      console.log('⚠️  Payload sem value');
      return;
    }

    const metadata = value?.metadata;
    const phoneNumberId = metadata?.phone_number_id;
    const displayPhoneNumber = metadata?.display_phone_number;

    console.log('\n📞 Metadados:');
    console.log('   phone_number_id:', phoneNumberId);
    console.log('   display_phone_number:', displayPhoneNumber);

    if (!value.messages || value.messages.length === 0) {
      console.log('⚠️  Payload sem mensagens (pode ser status update)');
      return;
    }

    const message = value.messages[0];
    const from = message.from;
    const messageId = message.id;
    const timestamp = message.timestamp;
    const text = message.text?.body;
    const messageType = message.type;

    console.log('\n📩 ===== MENSAGEM RECEBIDA =====');
    console.log('   wa_id (remetente):', from);
    console.log('   message_id:', messageId);
    console.log('   timestamp:', timestamp);
    console.log('   type:', messageType);
    console.log('   texto:', text || '(não é mensagem de texto)');
    console.log('================================\n');

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
  }
}
