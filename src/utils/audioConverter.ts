import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { Readable } from 'stream';

// Configurar path do ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath.path);

/**
 * Converte áudio MP3 (ElevenLabs) para OGG/OPUS (WhatsApp)
 * WhatsApp Cloud API aceita apenas OGG com codec OPUS
 */
export class AudioConverter {
  /**
   * Converte Buffer MP3 para OGG/OPUS
   * @param mp3Buffer - Buffer do áudio MP3 original
   * @returns Promise<Buffer> - Buffer do áudio convertido em OGG/OPUS
   */
  async convertToOggOpus(mp3Buffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const inputStream = Readable.from(mp3Buffer);

      console.log('🔄 Iniciando conversão MP3 → OGG/OPUS');
      console.log(`📊 Tamanho original: ${(mp3Buffer.length / 1024).toFixed(2)} KB`);

      ffmpeg(inputStream)
        .inputFormat('mp3')
        .audioCodec('libopus') // Codec OPUS obrigatório
        .audioBitrate('64k') // Bitrate otimizado para voz
        .audioChannels(1) // Mono (voz)
        .audioFrequency(24000) // 24kHz (voz)
        .format('ogg') // Container OGG
        .on('start', (commandLine) => {
          console.log('🎬 FFmpeg comando:', commandLine);
        })
        .on('error', (err, stdout, stderr) => {
          console.error('❌ Erro na conversão FFmpeg:', err.message);
          console.error('📄 stderr:', stderr);
          reject(new Error(`Falha na conversão de áudio: ${err.message}`));
        })
        .on('end', () => {
          const oggBuffer = Buffer.concat(chunks);
          console.log(`✅ Conversão concluída: ${(oggBuffer.length / 1024).toFixed(2)} KB`);
          resolve(oggBuffer);
        })
        .pipe()
        .on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
    });
  }

  /**
   * Valida se o buffer é um arquivo de áudio válido
   */
  async validateAudioBuffer(buffer: Buffer): Promise<boolean> {
    if (!buffer || buffer.length === 0) {
      return false;
    }

    // Verificar magic numbers (primeiros bytes)
    // MP3: FF FB ou FF F3 ou FF F2
    // OGG: 4F 67 67 53 (OggS)
    const magic = buffer.toString('hex', 0, 4);
    
    const isMP3 = magic.startsWith('fff') || magic.startsWith('fffb') || magic.startsWith('fff3');
    const isOGG = buffer.toString('ascii', 0, 4) === 'OggS';

    console.log(`🔍 Validação de áudio: magic=${magic}, isMP3=${isMP3}, isOGG=${isOGG}`);

    return isMP3 || isOGG;
  }
}

export const audioConverter = new AudioConverter();
