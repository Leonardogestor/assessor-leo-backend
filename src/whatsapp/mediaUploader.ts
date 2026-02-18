import axios from 'axios';
import FormData from 'form-data';
import { env } from '../config/env';
import { audioConverter } from '../utils/audioConverter';

const API_VERSION = 'v18.0';

export class MediaUploader {
  private token: string;
  private phoneNumberId: string;

  constructor() {
    this.token = env.WHATSAPP_TOKEN || '';
    this.phoneNumberId = env.PHONE_NUMBER_ID || '';
  }

  /**
   * Upload de áudio para WhatsApp Media API
   * CRÍTICO: WhatsApp aceita apenas OGG/OPUS
   * @param mp3Buffer - Buffer do áudio MP3 (ElevenLabs)
   * @returns media_id ou null se falhar
   */
  async uploadAudio(mp3Buffer: Buffer): Promise<string | null> {
    if (!this.token || !this.phoneNumberId) {
      console.error('❌ WHATSAPP_TOKEN ou PHONE_NUMBER_ID não configurados');
      return null;
    }

    try {
      console.log('\n🎵 === INÍCIO DO UPLOAD DE ÁUDIO ===');
      console.log(`📊 Tamanho MP3 original: ${(mp3Buffer.length / 1024).toFixed(2)} KB`);

      // PASSO 1: Validar áudio de entrada
      const isValid = await audioConverter.validateAudioBuffer(mp3Buffer);
      if (!isValid) {
        throw new Error('Buffer de áudio inválido ou corrompido');
      }

      // PASSO 2: Converter MP3 → OGG/OPUS (obrigatório para WhatsApp)
      console.log('🔄 Convertendo MP3 para OGG/OPUS...');
      const oggBuffer = await audioConverter.convertToOggOpus(mp3Buffer);
      console.log(`✅ Conversão concluída: ${(oggBuffer.length / 1024).toFixed(2)} KB`);

      // PASSO 3: Criar FormData com formato correto
      const formData = new FormData();
      formData.append('file', oggBuffer, {
        filename: 'audio.ogg',
        contentType: 'audio/ogg; codecs=opus'
      });
      formData.append('messaging_product', 'whatsapp');

      // PASSO 4: Upload para Meta Graph API
      console.log('📤 Fazendo upload para WhatsApp Media API...');
      const uploadUrl = `https://graph.facebook.com/${API_VERSION}/${this.phoneNumberId}/media`;
      
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000
      });

      // PASSO 5: Extrair media_id
      const mediaId = response.data.id;
      console.log('✅ Upload concluído com sucesso!');
      console.log(`🆔 Media ID: ${mediaId}`);
      console.log('🎵 === FIM DO UPLOAD DE ÁUDIO ===\n');

      return mediaId;
    } catch (error: any) {
      console.error('\n❌ === ERRO NO UPLOAD DE ÁUDIO ===');
      console.error('Status:', error.response?.status);
      console.error('Dados:', JSON.stringify(error.response?.data, null, 2));
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
      console.error('❌ === FIM DO ERRO ===\n');
      return null;
    }
  }

  async uploadImage(imageBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<string | null> {
    if (!this.token || !this.phoneNumberId) {
      console.warn('⚠️  WhatsApp não configurado. Upload NÃO realizado.');
      return null;
    }

    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: 'image.jpg',
      contentType: mimeType
    });
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', mimeType);

    try {
      const response = await axios.post(
        `https://graph.facebook.com/${API_VERSION}/${this.phoneNumberId}/media`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            ...formData.getHeaders()
          }
        }
      );

      const mediaId = response.data.id;
      console.log('✅ Imagem enviada para WhatsApp Media API:', mediaId);
      return mediaId;
    } catch (error: any) {
      console.error('❌ Erro ao fazer upload de imagem:', error.response?.data || error.message);
      return null;
    }
  }
}
