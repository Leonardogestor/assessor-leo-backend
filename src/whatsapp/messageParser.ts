import { WhatsAppMessage, ParsedMessage } from './types';
import { WhatsAppClient } from './whatsappClient';

export class MessageParser {
  private whatsappClient: WhatsAppClient;

  constructor() {
    this.whatsappClient = new WhatsAppClient();
  }

  async parse(message: WhatsAppMessage): Promise<ParsedMessage> {
    const baseData: ParsedMessage = {
      user_phone: message.from,
      message_text: '',
      message_type: message.type,
      timestamp: new Date(parseInt(message.timestamp) * 1000)
    };

    switch (message.type) {
      case 'text':
        return {
          ...baseData,
          message_text: message.text?.body || '',
          message_type: 'text'
        };

      case 'audio':
        if (message.audio) {
          const mediaUrl = await this.whatsappClient.getMediaUrl(message.audio.id);
          return {
            ...baseData,
            message_text: '[Áudio recebido - transcrição em desenvolvimento]',
            message_type: 'audio',
            media_id: message.audio.id,
            media_url: mediaUrl
          };
        }
        break;

      case 'image':
        if (message.image) {
          return {
            ...baseData,
            message_text: message.image.caption || '[Imagem recebida]',
            message_type: 'image',
            media_id: message.image.id
          };
        }
        break;

      default:
        return {
          ...baseData,
          message_text: `[Tipo de mensagem não suportado: ${message.type}]`,
          message_type: message.type
        };
    }

    return baseData;
  }

  extractPhoneNumber(waId: string): string {
    return waId.replace(/[^\d]/g, '');
  }

  normalizeText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
