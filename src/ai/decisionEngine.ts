import { z } from 'zod';
import { callGPTWithRetry } from './gptClient';
import { validateJSON, cleanJSONString } from './jsonValidator';
import { DecisionResult, AcaoBackend, IntentResult, AIContext, UserProfile, RecentHistory } from './types';

const decisionResultSchema = z.object({
  acao_backend: z.nativeEnum(AcaoBackend),
  payload: z.record(z.any()),
  mensagem_base: z.string()
});

export class DecisionEngine {
  async decide(
    intent: IntentResult,
    state: AIContext,
    profile: UserProfile,
    recentHistory: RecentHistory
  ): Promise<DecisionResult> {
    const systemPrompt = this.buildSystemPrompt(state, profile);
    const userMessage = this.buildUserMessage(intent, recentHistory);

    try {
      const gptResponse = await callGPTWithRetry(systemPrompt, userMessage, {
        model: 'gpt-4o-mini',
        temperature: 0.2,
        maxTokens: 600,
        responseFormat: 'json_object'
      });

      const cleaned = cleanJSONString(gptResponse);
      const validation = validateJSON(cleaned, decisionResultSchema);

      if (validation.valid) {
        return validation.data;
      }

      console.warn('GPT retornou decisão inválida:', validation.error);
      return this.fallbackDecision(intent, state);

    } catch (error) {
      console.error('Erro ao tomar decisão:', error);
      return this.fallbackDecision(intent, state);
    }
  }

  private buildSystemPrompt(state: AIContext, profile: UserProfile): string {
    return `Você é o motor de decisão do Assessor Léo.
Seu trabalho é decidir qual ação o backend deve executar e retornar APENAS um JSON válido no seguinte formato:

{
  "acao_backend": "SALVAR_TRANSACAO|SALVAR_LEMBRETE|AVANCAR_FASE|RESPONDER|PEDIR_DADO_FALTANTE",
  "payload": {
    // Dados necessários para executar a ação
    // Para SALVAR_TRANSACAO: { "type": "expense|income", "amount": 100, "category": "...", "description": "..." }
    // Para SALVAR_LEMBRETE: { "title": "...", "reminder_date": "...", "description": "..." }
    // Para AVANCAR_FASE: { "dados_contexto": {...} }
    // Para PEDIR_DADO_FALTANTE: { "campo_faltante": "...", "pergunta": "..." }
  },
  "mensagem_base": "Mensagem clara e objetiva para o usuário"
}

Contexto do usuário:
- Nome: ${profile.name}
- Fase LIVE: ${state.fase_live || 'Não iniciado'}
- Subfase: ${state.subfase || 'N/A'}
- Estado emocional: ${state.estado_emocional || 'Neutro'}

REGRAS DE DECISÃO:
1. Se todos os dados necessários estiverem presentes → SALVAR_TRANSACAO ou SALVAR_LEMBRETE
2. Se faltar algum dado crítico → PEDIR_DADO_FALTANTE
3. Se for uma consulta simples → RESPONDER
4. Se completou requisitos da subfase → AVANCAR_FASE
5. NUNCA invente dados que não foram fornecidos

RETORNE APENAS JSON VÁLIDO, SEM TEXTO ADICIONAL.`;
  }

  private buildUserMessage(intent: IntentResult, recentHistory: RecentHistory): string {
    const historyText = recentHistory.messages
      .slice(-3)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    return `Intenção identificada:
${JSON.stringify(intent, null, 2)}

Histórico recente:
${historyText || 'Nenhum histórico'}

Decida a ação do backend e retorne o JSON conforme especificado.`;
  }

  private fallbackDecision(intent: IntentResult, state: AIContext): DecisionResult {
    switch (intent.tipo_intencao) {
      case 'registrar_gasto':
      case 'registrar_receita':
        return this.handleFinancialIntent(intent);

      case 'lembrete':
        return this.handleReminderIntent(intent);

      case 'consulta_financeira':
      case 'consulta_organizacao':
        return {
          acao_backend: AcaoBackend.RESPONDER,
          payload: { tipo_consulta: intent.tipo_intencao },
          mensagem_base: 'Vou buscar essas informações para você.'
        };

      case 'onboarding':
        return {
          acao_backend: AcaoBackend.RESPONDER,
          payload: {},
          mensagem_base: 'Vamos continuar seu processo de organização.'
        };

      default:
        return {
          acao_backend: AcaoBackend.RESPONDER,
          payload: {},
          mensagem_base: 'Não entendi completamente. Pode reformular?'
        };
    }
  }

  private handleFinancialIntent(intent: IntentResult): DecisionResult {
    const { dados_extraidos } = intent;

    if (!dados_extraidos.valor) {
      return {
        acao_backend: AcaoBackend.PEDIR_DADO_FALTANTE,
        payload: {
          campo_faltante: 'valor',
          pergunta: 'Qual foi o valor?'
        },
        mensagem_base: 'Entendi. Qual foi o valor?'
      };
    }

    if (!dados_extraidos.categoria) {
      return {
        acao_backend: AcaoBackend.PEDIR_DADO_FALTANTE,
        payload: {
          campo_faltante: 'categoria',
          pergunta: 'Em qual categoria?'
        },
        mensagem_base: 'Qual categoria você quer usar?'
      };
    }

    const type = intent.tipo_intencao === 'registrar_gasto' ? 'expense' : 'income';
    
    return {
      acao_backend: AcaoBackend.SALVAR_TRANSACAO,
      payload: {
        type,
        amount: dados_extraidos.valor,
        category: dados_extraidos.categoria,
        description: dados_extraidos.descricao || '',
        transaction_date: dados_extraidos.data || new Date().toISOString().split('T')[0]
      },
      mensagem_base: `Registrado: ${type === 'expense' ? 'Gasto' : 'Receita'} de R$ ${dados_extraidos.valor} em ${dados_extraidos.categoria}.`
    };
  }

  private handleReminderIntent(intent: IntentResult): DecisionResult {
    const { dados_extraidos } = intent;

    if (!dados_extraidos.titulo) {
      return {
        acao_backend: AcaoBackend.PEDIR_DADO_FALTANTE,
        payload: {
          campo_faltante: 'titulo',
          pergunta: 'Do que você quer se lembrar?'
        },
        mensagem_base: 'Certo. Do que você quer se lembrar?'
      };
    }

    if (!dados_extraidos.data) {
      return {
        acao_backend: AcaoBackend.PEDIR_DADO_FALTANTE,
        payload: {
          campo_faltante: 'data',
          pergunta: 'Para quando é o lembrete?'
        },
        mensagem_base: 'Para quando você quer esse lembrete?'
      };
    }

    return {
      acao_backend: AcaoBackend.SALVAR_LEMBRETE,
      payload: {
        title: dados_extraidos.titulo,
        reminder_date: dados_extraidos.data,
        description: dados_extraidos.descricao || ''
      },
      mensagem_base: `Lembrete criado: ${dados_extraidos.titulo} para ${dados_extraidos.data}.`
    };
  }
}
