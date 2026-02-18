import OpenAI from 'openai';
import { env } from '../config/env';

const apiKey = env.OPENAI_API_KEY || '';

if (!apiKey) {
  console.warn('⚠️  OPENAI_API_KEY não configurada');
}

export const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function callGPT(
  systemPrompt: string,
  userMessage: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'json_object' | 'text';
  } = {}
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI não configurada - OPENAI_API_KEY ausente');
  }

  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 1000,
    responseFormat = 'json_object'
  } = options;

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature,
      max_tokens: maxTokens,
      ...(responseFormat === 'json_object' && { response_format: { type: 'json_object' } })
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('❌ Erro ao chamar GPT:', error);
    throw new Error(`Falha na comunicação com GPT: ${error.message}`);
  }
}

export async function callGPTWithRetry(
  systemPrompt: string,
  userMessage: string,
  options: Parameters<typeof callGPT>[2] = {},
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callGPT(systemPrompt, userMessage, options);
    } catch (error: any) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Falha ao chamar GPT após tentativas');
}
