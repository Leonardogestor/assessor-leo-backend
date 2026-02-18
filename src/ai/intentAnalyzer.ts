import { z } from 'zod';
import { callGPTWithRetry } from './gptClient';
import { validateJSON, cleanJSONString, extractJSONFromText } from './jsonValidator';
import { IntentResult, TipoIntencao, AIContext } from './types';

const intentResultSchema = z.object({
  tipo_intencao: z.nativeEnum(TipoIntencao),
  dados_extraidos: z.record(z.any()),
  proxima_acao: z.string(),
  confianca: z.number().min(0).max(1).optional().default(0.8)
});

export class IntentAnalyzer {
  async analyze(text: string, context: AIContext): Promise<IntentResult> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userMessage = this.buildUserMessage(text, context);

    try {
      const gptResponse = await callGPTWithRetry(systemPrompt, userMessage, {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 500,
        responseFormat: 'json_object'
      });

      const cleaned = cleanJSONString(gptResponse);
      const validation = validateJSON(cleaned, intentResultSchema);

      if (validation.valid) {
        return validation.data;
      }

      console.warn('GPT retornou JSON inválido:', validation.error);
      return this.fallbackIntent(text);

    } catch (error) {
      console.error('Erro ao analisar intenção:', error);
      return this.fallbackIntent(text);
    }
  }

  private buildSystemPrompt(context: AIContext): string {
    return `Você é um analisador de intenções para o Assessor Léo.
Seu trabalho é analisar a mensagem do usuário e retornar APENAS um JSON válido no seguinte formato:

{
  "tipo_intencao": "onboarding|registrar_gasto|registrar_receita|lembrete|consulta_financeira|consulta_organizacao|desconhecido",
  "dados_extraidos": {
    // Para registrar_gasto/registrar_receita: "valor", "categoria", "descricao", "data"
    // Para lembrete: "titulo", "data", "horario", "descricao"
    // Para consultas: "periodo", "categoria", "tipo_consulta"
  },
  "proxima_acao": "descrição da próxima ação do sistema",
  "confianca": 0.9
}

Contexto atual do usuário:
- Fase LIVE: ${context.fase_live || 'Não iniciado'}
- Subfase: ${context.subfase || 'N/A'}
- Estado emocional: ${context.estado_emocional || 'Neutro'}

REGRAS IMPORTANTES:
1. Retorne APENAS JSON válido, sem texto adicional
2. tipo_intencao deve ser exatamente um dos valores listados
3. dados_extraidos deve conter informações relevantes extraídas da mensagem
4. Se não conseguir extrair algum dado, deixe vazio {}
5. confianca deve ser entre 0 e 1

NUNCA responda em texto livre. SEMPRE JSON.`;
  }

  private buildUserMessage(text: string, context: AIContext): string {
    return `Mensagem do usuário: "${text}"

Analise a intenção e retorne o JSON conforme especificado.`;
  }

  private fallbackIntent(text: string): IntentResult {
    const textLower = text.toLowerCase();

    if (this.matchesPattern(textLower, ['gastei', 'paguei', 'comprei', 'despesa', 'saiu'])) {
      return {
        tipo_intencao: TipoIntencao.REGISTRAR_GASTO,
        dados_extraidos: this.extractBasicFinancialData(text),
        proxima_acao: 'Solicitar dados faltantes para registrar gasto',
        confianca: 0.6
      };
    }

    if (this.matchesPattern(textLower, ['recebi', 'ganhei', 'salário', 'renda', 'entrou'])) {
      return {
        tipo_intencao: TipoIntencao.REGISTRAR_RECEITA,
        dados_extraidos: this.extractBasicFinancialData(text),
        proxima_acao: 'Solicitar dados faltantes para registrar receita',
        confianca: 0.6
      };
    }

    if (this.matchesPattern(textLower, ['lembrar', 'lembre', 'aviso', 'alerta', 'notifica'])) {
      return {
        tipo_intencao: TipoIntencao.LEMBRETE,
        dados_extraidos: {},
        proxima_acao: 'Solicitar dados do lembrete',
        confianca: 0.6
      };
    }

    if (this.matchesPattern(textLower, ['quanto', 'saldo', 'gastei', 'balanço', 'resumo'])) {
      return {
        tipo_intencao: TipoIntencao.CONSULTA_FINANCEIRA,
        dados_extraidos: {},
        proxima_acao: 'Processar consulta financeira',
        confianca: 0.6
      };
    }

    if (this.matchesPattern(textLower, ['tarefas', 'pendências', 'lembretes', 'compromissos'])) {
      return {
        tipo_intencao: TipoIntencao.CONSULTA_ORGANIZACAO,
        dados_extraidos: {},
        proxima_acao: 'Processar consulta de organização',
        confianca: 0.6
      };
    }

    return {
      tipo_intencao: TipoIntencao.ONBOARDING,
      dados_extraidos: {},
      proxima_acao: 'Continuar fluxo de onboarding',
      confianca: 0.5
    };
  }

  private matchesPattern(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }

  private extractBasicFinancialData(text: string): Record<string, any> {
    const data: Record<string, any> = {};

    const valorMatch = text.match(/(?:r\$|rs)?\s*(\d+(?:[.,]\d{2})?)/i);
    if (valorMatch) {
      data.valor = parseFloat(valorMatch[1].replace(',', '.'));
    }

    const categorias = ['alimentação', 'transporte', 'saúde', 'educação', 'lazer', 'moradia'];
    const categoriaEncontrada = categorias.find(cat => text.toLowerCase().includes(cat));
    if (categoriaEncontrada) {
      data.categoria = categoriaEncontrada;
    }

    return data;
  }
}
