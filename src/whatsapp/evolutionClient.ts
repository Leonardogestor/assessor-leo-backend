/**
 * Cliente para enviar mensagens via Evolution API (WhatsApp sem Meta)
 * Documentação: https://doc.evolution-api.com
 */
import axios from 'axios';

export class EvolutionClient {
  private baseUrl: string;
  private instanceName: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '');
    this.instanceName = process.env.EVOLUTION_INSTANCE_NAME || '';
    this.apiKey = process.env.EVOLUTION_API_KEY || '';

    if (!this.baseUrl || !this.instanceName || !this.apiKey) {
      console.warn('⚠️  Evolution API: variáveis incompletas (EVOLUTION_API_URL, EVOLUTION_INSTANCE_NAME, EVOLUTION_API_KEY)');
    }
  }

  isEnabled(): boolean {
    return !!(
      process.env.EVOLUTION_ENABLED === 'true' &&
      this.baseUrl &&
      this.instanceName &&
      this.apiKey
    );
  }

  async sendTextMessage(to: string, text: string): Promise<void> {
    if (!this.isEnabled()) {
      console.warn('⚠️  Evolution API não configurada. Mensagem NÃO enviada.');
      return;
    }

    const number = this.formatPhoneNumber(to);
    const url = `${this.baseUrl}/message/sendText/${this.instanceName}`;

    try {
      const response = await axios.post(
        url,
        { number, text },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.apiKey,
          },
          timeout: 15000,
        }
      );

      console.log('✅ Mensagem enviada via Evolution API');
    } catch (error: any) {
      console.error('❌ Erro Evolution API:', error.response?.data || error.message);
      throw new Error('Falha ao enviar mensagem via Evolution API');
    }
  }

  async sendAudioMessage(_to: string, _audioId: string): Promise<void> {
    // Evolution API: envio de áudio requer upload diferente. Por ora, não suportado.
    // O MessageService fará fallback para texto quando usar Evolution.
    console.warn('⚠️  Evolution API: áudio não suportado neste cliente. Use texto.');
    throw new Error('Evolution API: áudio não implementado - use texto');
  }

  private formatPhoneNumber(phone: string): string {
    let num = phone.replace(/[^\d]/g, '');
    if (num.endsWith('@s.whatsapp.net')) {
      num = num.replace('@s.whatsapp.net', '');
    }
    return num;
  }
}
