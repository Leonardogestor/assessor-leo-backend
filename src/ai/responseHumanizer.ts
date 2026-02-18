import { callGPTWithRetry } from './gptClient';
import { DecisionResult, PersonaConfig } from './types';

export class ResponseHumanizer {
  async humanize(decision: DecisionResult, persona: PersonaConfig): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(persona);
    const userMessage = this.buildUserMessage(decision);

    try {
      const humanizedResponse = await callGPTWithRetry(systemPrompt, userMessage, {
        model: 'gpt-4o-mini',
        temperature: 0.9,
        maxTokens: 300,
        responseFormat: 'text'
      });

      return humanizedResponse.trim();

    } catch (error) {
      console.error('Erro ao humanizar resposta:', error);
      return this.fallbackHumanize(decision);
    }
  }

  private buildSystemPrompt(persona: PersonaConfig): string {
    return `Você é ${persona.nome}, um assistente pessoal com as seguintes características:

Tom: ${persona.tom}

Características:
${persona.caracteristicas.map(c => `- ${c}`).join('\n')}

Restrições:
${persona.restricoes.map(r => `- ${r}`).join('\n')}

Seu trabalho é transformar mensagens técnicas em respostas naturais e humanizadas para WhatsApp.

REGRAS:
1. Seja conversacional e natural
2. Use emojis com moderação (máximo 2 por mensagem)
3. Frases curtas e diretas
4. Evite jargões técnicos
5. Seja empático e encorajador
6. NUNCA retorne JSON ou código
7. Máximo 2-3 frases
8. Responda em português brasileiro`;
  }

  private buildUserMessage(decision: DecisionResult): string {
    return `Transforme esta mensagem base em uma resposta natural e humanizada:

"${decision.mensagem_base}"

Ação do sistema: ${decision.acao_backend}

Retorne apenas o texto final para enviar ao usuário via WhatsApp.`;
  }

  private fallbackHumanize(decision: DecisionResult): string {
    const emojis: Record<string, string> = {
      SALVAR_TRANSACAO: '💰',
      SALVAR_LEMBRETE: '⏰',
      AVANCAR_FASE: '🎯',
      RESPONDER: '💬',
      PEDIR_DADO_FALTANTE: '🤔'
    };

    const emoji = emojis[decision.acao_backend] || '✅';
    
    const baseMessages: Record<string, string> = {
      SALVAR_TRANSACAO: 'Tudo certo! Registrei essa transação pra você.',
      SALVAR_LEMBRETE: 'Perfeito! Criei o lembrete.',
      AVANCAR_FASE: 'Ótimo progresso! Vamos para a próxima etapa.',
      PEDIR_DADO_FALTANTE: decision.mensagem_base,
      RESPONDER: decision.mensagem_base
    };

    const message = baseMessages[decision.acao_backend] || decision.mensagem_base;
    return `${emoji} ${message}`;
  }

  getDefaultPersona(): PersonaConfig {
    return {
      nome: 'Léo',
      tom: 'amigável, profissional e encorajador',
      caracteristicas: [
        'Empático e compreensivo',
        'Objetivo e direto',
        'Positivo sem ser excessivo',
        'Usa linguagem simples e clara',
        'Celebra pequenas conquistas'
      ],
      restricoes: [
        'NUNCA usa gírias ou linguagem muito informal',
        'NÃO faz piadas ou brincadeiras',
        'NÃO dá conselhos financeiros complexos',
        'NÃO usa mais de 2 emojis',
        'NÃO escreve mais de 3 frases por mensagem'
      ]
    };
  }
}
