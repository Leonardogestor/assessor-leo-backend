import axios from 'axios';
import { env } from '../config/env';

/**
 * Cliente ElevenLabs para Text-to-Speech
 * Production-ready, TypeScript-first
 */
export class ElevenLabsClient {
  private apiKey: string;
  private voiceId: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    // Prioriza ELEVEN_API_KEY, fallback para ELEVENLABS_API_KEY (retrocompatibilidade)
    this.apiKey = env.ELEVEN_API_KEY || env.ELEVENLABS_API_KEY || '';
    this.voiceId = env.ELEVEN_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
    
    if (!this.apiKey) {
      console.warn('⚠️  ELEVEN_API_KEY não configurada - áudio desabilitado');
    }
  }

  /**
   * Gera áudio a partir de texto usando ElevenLabs API
   * @param text - Texto para converter em fala
   * @returns Buffer contendo áudio MP3 ou null se falhar
   */
  async generateSpeech(text: string): Promise<Buffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key não configurada. Configure ELEVEN_API_KEY no .env');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Texto não pode estar vazio');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${this.voiceId}`,
        {
          text: text.trim(),
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          responseType: 'arraybuffer',
          timeout: 30000 // 30s timeout
        }
      );

      if (response.status !== 200) {
        throw new Error(`ElevenLabs API retornou status ${response.status}`);
      }

      console.log('✅ Áudio gerado pelo ElevenLabs');
      return Buffer.from(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail 
        || error.response?.statusText 
        || error.message 
        || 'Erro desconhecido';
      
      console.error('❌ Erro ao gerar áudio com ElevenLabs:', {
        status: error.response?.status,
        message: errorMessage,
        voiceId: this.voiceId
      });
      
      throw new Error(`Falha ao gerar áudio: ${errorMessage}`);
    }
  }

  /**
   * Método legado - mantido para retrocompatibilidade
   * @deprecated Use generateSpeech() em vez disso
   */
  async textToSpeech(text: string): Promise<Buffer | null> {
    try {
      return await this.generateSpeech(text);
    } catch (error) {
      console.warn('⚠️  textToSpeech falhou:', error);
      return null;
    }
  }

  /**
   * Gera áudio otimizado para WhatsApp (OGG/OPUS)
   * @param text - Texto para converter em fala
   * @returns Buffer contendo áudio MP3 (será convertido depois)
   */
  async generateSpeechForWhatsApp(text: string): Promise<Buffer> {
    // ElevenLabs sempre retorna MP3
    // A conversão para OGG/OPUS acontece no MediaUploader
    return await this.generateSpeech(text);
  }

  /**
   * Verifica se o cliente está configurado e pronto para uso
   */
  isEnabled(): boolean {
    return !!this.apiKey && !!this.voiceId;
  }
}
