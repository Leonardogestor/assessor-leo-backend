import { z, ZodSchema } from 'zod';

export function validateJSON<T>(json: string, schema: ZodSchema<T>): { valid: true; data: T } | { valid: false; error: string } {
  try {
    const parsed = JSON.parse(json);
    const validated = schema.parse(parsed);
    return { valid: true, data: validated };
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      return { valid: false, error: `JSON inválido: ${error.message}` };
    }
    if (error instanceof z.ZodError) {
      return { valid: false, error: `Validação falhou: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { valid: false, error: 'Erro desconhecido na validação' };
  }
}

export function safeParseJSON<T>(json: string): T | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function extractJSONFromText(text: string): string | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : null;
}

export function cleanJSONString(text: string): string {
  let cleaned = text.trim();
  
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }
  
  return cleaned.trim();
}
