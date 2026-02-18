import axios from 'axios';
import { SendMessagePayload } from './types';
import { env } from '../config/env';

const API_VERSION = 'v18.0';

export class WhatsAppClient {
  private baseUrl: string;
  private token: string;
  private phoneNumberId: string;

  constructor() {
    this.token = env.WHATSAPP_TOKEN || '';
    this.phoneNumberId = env.PHONE_NUMBER_ID || '';
    this.baseUrl = `https://graph.facebook.com/${API_VERSION}/${this.phoneNumberId}`;
    
    if (!this.token) {
      console.warn('⚠️  WHATSAPP_TOKEN não configurado');
    }
    if (!this.phoneNumberId) {
      console.warn('⚠️  PHONE_NUMBER_ID não configurado');
    }
  }

  async sendTextMessage(to: string, text: string): Promise<void> {
    if (!this.token || !this.phoneNumberId) {
      console.warn('⚠️  WhatsApp não configurado. Mensagem NÃO enviada.');
      return;
    }

    const payload: SendMessagePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.formatPhoneNumber(to),
      type: 'text',
      text: {
        preview_url: false,
        body: text
      }
    };

    try {
      const response = await axios.post(`${this.baseUrl}/messages`, payload, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Mensagem WhatsApp enviada:', response.data);
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem WhatsApp:', error.response?.data || error.message);
      throw new Error('Falha ao enviar mensagem WhatsApp');
    }
  }

  async sendAudioMessage(to: string, audioId: string): Promise<void> {
    if (!this.token || !this.phoneNumberId) {
      console.warn('⚠️  WhatsApp não configurado. Áudio NÃO enviado.');
      return;
    }

    const payload: SendMessagePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.formatPhoneNumber(to),
      type: 'audio',
      audio: {
        id: audioId
      }
    };

    try {
      const response = await axios.post(`${this.baseUrl}/messages`, payload, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Áudio WhatsApp enviado:', response.data);
    } catch (error: any) {
      console.error('❌ Erro ao enviar áudio:', error.response?.data || error.message);
      throw new Error('Falha ao enviar áudio WhatsApp');
    }
  }

  async getMediaUrl(mediaId: string): Promise<string> {
    if (!this.token) {
      throw new Error('WHATSAPP_TOKEN não configurado');
    }

    try {
      const response = await axios.get(
        `https://graph.facebook.com/${API_VERSION}/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.url;
    } catch (error: any) {
      console.error('❌ Erro ao obter URL da mídia:', error.response?.data || error.message);
      throw new Error('Falha ao obter URL da mídia');
    }
  }

  async downloadMedia(mediaUrl: string): Promise<Buffer> {
    if (!this.token) {
      throw new Error('WHATSAPP_TOKEN não configurado');
    }

    try {
      const response = await axios.get(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('❌ Erro ao baixar mídia:', error.response?.data || error.message);
      throw new Error('Falha ao baixar mídia');
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    if (!this.token || !this.phoneNumberId) {
      return;
    }

    try {
      await axios.post(
        `${this.baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error: any) {
      console.error('❌ Erro ao marcar como lida:', error.response?.data || error.message);
    }
  }

  private formatPhoneNumber(phone: string): string {
    return phone.replace(/[^\d]/g, '');
  }
}
