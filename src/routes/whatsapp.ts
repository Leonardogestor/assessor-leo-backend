import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'meu_token_de_teste';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';

router.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔍 Verificação webhook:');
  console.log('mode:', mode);
  console.log('token:', token);
  console.log('challenge:', challenge);

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Verificado');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Falhou');
    res.sendStatus(403);
  }
});

router.post('/whatsapp', async (req: Request, res: Response) => {
  console.log('\n📥 POST recebido:');
  console.dir(req.body, { depth: null });
  
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) return;

    const from = message.from;
    const phone_number_id = value.metadata.phone_number_id;

    console.log('\n📤 Enviando resposta...');

    await axios.post(
      `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
      {
        messaging_product: 'whatsapp',
        to: from,
        text: { body: 'Mensagem recebida com sucesso 🚀' }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Resposta enviada');
  } catch (error: any) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
});

export default router;
