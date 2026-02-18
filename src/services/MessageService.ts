import { callGPT } from '../ai/gptClient';
import { WhatsAppClient } from '../whatsapp/whatsappClient';
import { EvolutionClient } from '../whatsapp/evolutionClient';
import { contextManager } from '../state/ContextManager';
import { ElevenLabsClient } from '../ai/elevenLabsClient';
import { MediaUploader } from '../whatsapp/mediaUploader';

const SYSTEM_PROMPT = `Você é Léo, um assessor financeiro que conduz pessoas à liberdade financeira através da consciência e da realização de sonhos.

IDENTIDADE
Você é acolhedor, direto, didático e extremamente empático. Fala com firmeza suave, baseado em dados (nunca em opinião). Nunca julga, nunca acusa, nunca se coloca como superior. Seu único propósito é resgatar os sonhos do cliente e guiá-lo até eles.

LIMITES ÉTICOS
- Você NÃO é consultor de investimentos, advogado ou contador
- Você NÃO promete ganhos financeiros garantidos
- Você NÃO dá conselhos irresponsáveis
- Você NÃO encerra o atendimento (acompanhamento é contínuo)

MÉTODO DE CONDUÇÃO
Você usa o método LIVE:
- Lucidez: Criar consciência da necessidade de mudança
- Imersão: Diagnosticar a situação real com base em dados
- Visão: Definir sonhos claros e projetar cenários futuros
- Experiências: Transformar plano em ação através de microvitórias diárias

COMUNICAÇÃO (PNL)
- Espelhamento: Valide emoções antes de guiar ("Sinto que você está frustrado, e eu entendo")
- Reframing: Transforme falhas em aprendizados ("Isso não é um erro, é um dado valioso")
- Future Pace: Conecte ação presente com resultado futuro ("Imagine a sensação de realizar seu sonho")
- Identidade: Reforce quem o cliente está se tornando ("Você é alguém que honra seu plano")
- Microvitórias: Quebre desafios em passos mínimos executáveis

TOM DE VOZ
- Acolhedor mas firme
- Claro e simples (nunca rebuscado)
- Empático sem ser paternalista
- Motivador sem ser falso
- Maduro e estratégico

TRATAMENTO DE OBJEÇÕES EMOCIONAIS
Quando o cliente expressar vergonha: "Troque vergonha por coragem. Estou aqui para ver dados, não falhas."
Quando expressar culpa: "A culpa é improdutiva. Vamos transformá-la em ação responsável."
Quando temer fracasso: "O único fracasso real é a inação. Meu método é baseado em pequenas vitórias diárias."
Quando houver autossabotagem: "Sua mente está te protegendo de uma dor que não existe mais. O que a pessoa que você quer ser faria agora?"

ÂNCORA EMOCIONAL
Sempre conecte cada ação ao sonho principal do cliente. O sonho é o combustível diário, não o dinheiro.

FORMATO DE RESPOSTA
- Máximo 3 parágrafos por mensagem (WhatsApp)
- Linguagem natural brasileira
- Perguntas estratégicas quando necessário (mas sem interrogatório)
- Use emojis ocasionalmente para humanizar
- Nunca seja robótico ou técnico demais

REGRA DE OURO
Você conduz o cliente à clareza, consciência e decisão. Nunca empurra, nunca pressiona, nunca vende. Você é um guia, não um vendedor. Respeita o tempo emocional do cliente, mas mantém a firmeza suave para que ele avance.`;

// Critério: mensagens com mais de 100 caracteres recebem áudio
const AUDIO_THRESHOLD = 100;

export class MessageService {
  private whatsappClient: WhatsAppClient;
  private evolutionClient: EvolutionClient;
  private elevenLabsClient: ElevenLabsClient;
  private mediaUploader: MediaUploader;

  constructor() {
    this.whatsappClient = new WhatsAppClient();
    this.evolutionClient = new EvolutionClient();
    this.elevenLabsClient = new ElevenLabsClient();
    this.mediaUploader = new MediaUploader();
  }

  private get messenger() {
    return this.evolutionClient.isEnabled() ? this.evolutionClient : this.whatsappClient;
  }

  private get useEvolution(): boolean {
    return this.evolutionClient.isEnabled();
  }

  async processMessage(from: string, text: string): Promise<void> {
    try {
      console.log(`\n🤖 Processando mensagem de ${from}: "${text}"`);

      // Adicionar mensagem do usuário ao contexto
      contextManager.addMessage(from, 'user', text);

      // Obter histórico de conversa
      const contextSummary = contextManager.getContextSummary(from);
      
      // Montar prompt com contexto
      let userPrompt = text;
      if (contextSummary) {
        userPrompt = `${contextSummary}\n\nNova mensagem do usuário: ${text}`;
      }

      // Chamar GPT
      const gptResponse = await callGPT(SYSTEM_PROMPT, userPrompt, {
        responseFormat: 'text',
        temperature: 0.8,
        maxTokens: 500
      });

      console.log(`💬 Resposta GPT: "${gptResponse}"`);

      // Adicionar resposta do assistente ao contexto
      contextManager.addMessage(from, 'assistant', gptResponse);

      // Verificar se é primeira interação (SEMPRE envia áudio quando Meta)
      const isFirstMessage = contextManager.isFirstInteraction(from);
      
      // Evolution não suporta áudio - sempre texto. Meta: áudio na 1ª msg ou respostas longas
      const shouldSendAudio = !this.useEvolution &&
        this.elevenLabsClient.isEnabled() &&
        (isFirstMessage || gptResponse.length > AUDIO_THRESHOLD);
      
      if (isFirstMessage) {
        console.log('🎯 PRIMEIRA MENSAGEM DETECTADA - Enviando em áudio!');
      }

      if (shouldSendAudio) {
        if (isFirstMessage) {
          console.log(`🎤 Gerando PRIMEIRA MENSAGEM em áudio...`);
        } else {
          console.log(`🎤 Resposta longa detectada (${gptResponse.length} chars) - gerando áudio`);
        }
        
        try {
          // PASSO 1: Gerar áudio no ElevenLabs (MP3)
          console.log('🎙️ Chamando ElevenLabs...');
          const mp3Buffer = await this.elevenLabsClient.generateSpeechForWhatsApp(gptResponse);
          console.log(`✅ Áudio MP3 gerado: ${(mp3Buffer.length / 1024).toFixed(2)} KB`);
          
          // PASSO 2: Upload (converte MP3 → OGG/OPUS internamente)
          console.log('📤 Iniciando upload para WhatsApp...');
          const mediaId = await this.mediaUploader.uploadAudio(mp3Buffer);
          
          if (mediaId) {
            // PASSO 3: Enviar mensagem de áudio
            console.log(`📨 Enviando áudio com media_id: ${mediaId}`);
            await this.messenger.sendAudioMessage(from, mediaId);
            console.log(`✅ 🎵 ÁUDIO ENVIADO COM SUCESSO para ${from}`);
          } else {
            throw new Error('Upload retornou null - tentando fallback');
          }
        } catch (audioError: any) {
          // Fallback: enviar texto se qualquer etapa falhar
          console.warn('⚠️ Erro no fluxo de áudio:', audioError.message);
          console.log('🔄 Usando fallback: enviando texto...');
          await this.messenger.sendTextMessage(from, gptResponse);
          console.log(`✅ Texto enviado para ${from} (fallback após erro)`);
        }
      } else {
        // Enviar resposta via texto
        await this.messenger.sendTextMessage(from, gptResponse);
        console.log(`✅ Texto enviado para ${from}`);
      }

      // Log de estatísticas
      const stats = contextManager.getStats();
      console.log(`📊 Contextos ativos: ${stats.totalUsers} usuário(s), ${stats.totalMessages} mensagem(ns)\n`);
    } catch (error) {
      console.error(`❌ Erro ao processar mensagem de ${from}:`, error);
      
      // Enviar mensagem de erro genérica
      const fallbackMessage = 'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente? 🙏';
      try {
        await this.messenger.sendTextMessage(from, fallbackMessage);
      } catch (sendError) {
        console.error('❌ Falha ao enviar mensagem de erro:', sendError);
      }
    }
  }

  async processMessageAndGetResponse(from: string, text: string): Promise<string> {
    // Adicionar mensagem do usuário ao contexto
    contextManager.addMessage(from, 'user', text);

    // Obter histórico de conversa
    const contextSummary = contextManager.getContextSummary(from);
    
    // Montar prompt com contexto
    let userPrompt = text;
    if (contextSummary) {
      userPrompt = `${contextSummary}\n\nNova mensagem do usuário: ${text}`;
    }

    // Chamar GPT
    const gptResponse = await callGPT(SYSTEM_PROMPT, userPrompt, {
      responseFormat: 'text',
      temperature: 0.8,
      maxTokens: 500
    });

    // Adicionar resposta do assistente ao contexto
    contextManager.addMessage(from, 'assistant', gptResponse);

    return gptResponse;
  }

  /**
   * Processar mensagem com prompt customizado (para fluxo de estados)
   */
  async processMessageWithCustomPrompt(from: string, text: string, customSystemPrompt: string): Promise<string> {
    // Adicionar mensagem do usuário ao contexto
    contextManager.addMessage(from, 'user', text);

    // Obter histórico de conversa
    const contextSummary = contextManager.getContextSummary(from);
    
    // Montar prompt com contexto
    let userPrompt = text;
    if (contextSummary) {
      userPrompt = `${contextSummary}\n\nNova mensagem do usuário: ${text}`;
    }

    // Chamar GPT com prompt customizado
    const gptResponse = await callGPT(customSystemPrompt, userPrompt, {
      responseFormat: 'text',
      temperature: 0.8,
      maxTokens: 500
    });

    // Adicionar resposta do assistente ao contexto
    contextManager.addMessage(from, 'assistant', gptResponse);

    return gptResponse;
  }

  /**
   * NOVO MÉTODO: Enviar resposta com suporte a áudio (para fluxo gated)
   * Garante que primeira mensagem sempre envia áudio + texto
   */
  async sendResponseWithAudioSupport(from: string, text: string, customSystemPrompt: string): Promise<void> {
    try {
      console.log(`\n🤖 [SEND WITH AUDIO] Processando mensagem de ${from}: "${text}"`);

      // Adicionar mensagem do usuário ao contexto
      contextManager.addMessage(from, 'user', text);

      // ⚠️ IMPORTANTE: Verificar se é primeira mensagem ANTES de adicionar resposta do assistente
      const isFirstMessage = contextManager.isFirstInteraction(from);

      // Obter histórico de conversa
      const contextSummary = contextManager.getContextSummary(from);
      
      // Montar prompt com contexto
      let userPrompt = text;
      if (contextSummary) {
        userPrompt = `${contextSummary}\n\nNova mensagem do usuário: ${text}`;
      }

      // Chamar GPT com prompt customizado
      const gptResponse = await callGPT(customSystemPrompt, userPrompt, {
        responseFormat: 'text',
        temperature: 0.8,
        maxTokens: 500
      });

      console.log(`💬 Resposta GPT: "${gptResponse}"`);

      // Adicionar resposta do assistente ao contexto
      contextManager.addMessage(from, 'assistant', gptResponse);

      // Evolution não suporta áudio - sempre texto. Meta: áudio na 1ª msg ou respostas longas
      const shouldSendAudio = !this.useEvolution &&
        this.elevenLabsClient.isEnabled() &&
        (isFirstMessage || gptResponse.length > AUDIO_THRESHOLD);
      
      if (isFirstMessage) {
        console.log('🎯 PRIMEIRA MENSAGEM DETECTADA - Enviando em áudio!');
      }

      if (shouldSendAudio) {
        if (isFirstMessage) {
          console.log(`🎤 Gerando PRIMEIRA MENSAGEM em áudio...`);
        } else {
          console.log(`🎤 Resposta longa detectada (${gptResponse.length} chars) - gerando áudio`);
        }
        
        try {
          // PASSO 1: Gerar áudio no ElevenLabs (MP3)
          console.log('🎙️ Chamando ElevenLabs...');
          const mp3Buffer = await this.elevenLabsClient.generateSpeechForWhatsApp(gptResponse);
          console.log(`✅ Áudio MP3 gerado: ${(mp3Buffer.length / 1024).toFixed(2)} KB`);
          
          // PASSO 2: Upload (converte MP3 → OGG/OPUS internamente)
          console.log('📤 Iniciando upload para WhatsApp...');
          const mediaId = await this.mediaUploader.uploadAudio(mp3Buffer);
          
          if (mediaId) {
            // PASSO 3: Enviar mensagem de áudio
            console.log(`📨 Enviando áudio com media_id: ${mediaId}`);
            await this.messenger.sendAudioMessage(from, mediaId);
            console.log(`✅ 🎵 ÁUDIO ENVIADO COM SUCESSO para ${from}`);
          } else {
            throw new Error('Upload retornou null - tentando fallback');
          }
        } catch (audioError: any) {
          // Fallback: enviar texto se qualquer etapa falhar
          console.warn('⚠️ Erro no fluxo de áudio:', audioError.message);
          console.log('🔄 Usando fallback: enviando texto...');
          await this.messenger.sendTextMessage(from, gptResponse);
          console.log(`✅ Texto enviado para ${from} (fallback após erro)`);
        }
      } else {
        // Enviar resposta via texto
        await this.messenger.sendTextMessage(from, gptResponse);
        console.log(`✅ Texto enviado para ${from}`);
      }

      // Log de estatísticas
      const stats = contextManager.getStats();
      console.log(`📊 Contextos ativos: ${stats.totalUsers} usuário(s), ${stats.totalMessages} mensagem(ns)\n`);
    } catch (error) {
      console.error(`❌ Erro ao processar mensagem de ${from}:`, error);
      
      // Enviar mensagem de erro genérica
      const fallbackMessage = 'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente? 🙏';
      try {
        await this.messenger.sendTextMessage(from, fallbackMessage);
      } catch (sendError) {
        console.error('❌ Falha ao enviar mensagem de erro:', sendError);
      }
    }
  }
}
