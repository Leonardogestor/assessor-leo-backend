import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().positive()),
  
  URL_BANCO_DE_DADOS: z.string().optional(),
  
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres').optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  OPENAI_API_KEY: z.string().optional(),
  
  WHATSAPP_TOKEN: z.string().optional(),
  PHONE_NUMBER_ID: z.string().optional(),
  VERIFY_TOKEN: z.string().optional(),
  
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVEN_API_KEY: z.string().optional(),
  ELEVEN_VOICE_ID: z.string().optional(),

  // Evolution API (WhatsApp sem Meta)
  EVOLUTION_ENABLED: z.string().optional(),
  EVOLUTION_API_URL: z.string().optional(),
  EVOLUTION_INSTANCE_NAME: z.string().optional(),
  EVOLUTION_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Erro de validação de variáveis de ambiente:\n');
      
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        console.error(`   • ${field}: ${err.message}`);
      });
      
      console.error('\n📋 Verifique o arquivo .env e certifique-se de que todas as variáveis obrigatórias estão definidas.');
      console.error('📄 Consulte .env.example para referência.\n');
      
      process.exit(1);
    }
    
    throw error;
  }
}

export const env = validateEnv();

export function getEnv(): Env {
  return env;
}

export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}
