/**
 * Webhook para receber mensagens da Evolution API
 * Payload: MESSAGES_UPSERT (formato Baileys/Evolution)
 */
import { Request, Response } from 'express';
import { MessageService } from './services/MessageService';

const messageService = new MessageService();

export async function webhookEvolution(req: Request, res: Response): Promise<void> {
  res.sendStatus(200);

  try {
    const body = req.body;

    // Evolution pode enviar: { event, data, instance } ou payload direto
    const data = body?.data ?? body;
    const payload = Array.isArray(data) ? data[0] : data;

    if (!payload) {
      console.log('📥 Evolution webhook: payload vazio');
      return;
    }

    const key = payload.key ?? payload;
    const fromMe = key?.fromMe === true;
    if (fromMe) {
      return;
    }

    const remoteJid = (key?.remoteJid || payload.remoteJid || '').toString();
    const from = extractPhoneNumber(remoteJid);

    const message = payload.message ?? payload;
    let text = '';

    if (message?.conversation) {
      text = message.conversation;
    } else if (message?.extendedTextMessage?.text) {
      text = message.extendedTextMessage.text;
    }

    if (!from || !text) {
      console.log('📥 Evolution webhook: sem from ou texto válido');
      return;
    }

    console.log(`📩 Evolution: mensagem de ${from}: "${text}"`);

    await messageService.processMessage(from, text);
  } catch (err) {
    console.error('❌ Erro no webhook Evolution:', err);
  }
}

function extractPhoneNumber(remoteJid: string): string {
  if (!remoteJid) return '';
  return remoteJid.replace(/@.*$/, '').replace(/[^\d]/g, '');
}
