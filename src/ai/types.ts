export enum TipoIntencao {
  ONBOARDING = 'onboarding',
  REGISTRAR_GASTO = 'registrar_gasto',
  REGISTRAR_RECEITA = 'registrar_receita',
  LEMBRETE = 'lembrete',
  CONSULTA_FINANCEIRA = 'consulta_financeira',
  CONSULTA_ORGANIZACAO = 'consulta_organizacao',
  DESCONHECIDO = 'desconhecido'
}

export enum AcaoBackend {
  SALVAR_TRANSACAO = 'SALVAR_TRANSACAO',
  SALVAR_LEMBRETE = 'SALVAR_LEMBRETE',
  AVANCAR_FASE = 'AVANCAR_FASE',
  RESPONDER = 'RESPONDER',
  PEDIR_DADO_FALTANTE = 'PEDIR_DADO_FALTANTE'
}

export interface IntentResult {
  tipo_intencao: TipoIntencao;
  dados_extraidos: Record<string, any>;
  proxima_acao: string;
  confianca: number;
}

export interface DecisionResult {
  acao_backend: AcaoBackend;
  payload: Record<string, any>;
  mensagem_base: string;
}

export interface AIContext {
  user_id: string;
  fase_live?: string;
  subfase?: string;
  estado_emocional?: string;
  dados_contexto?: Record<string, any>;
}

export interface UserProfile {
  name: string;
  email: string;
  preferences?: Record<string, any>;
}

export interface RecentHistory {
  messages: Array<{
    role: string;
    content: string;
    created_at: Date;
  }>;
}

export interface PersonaConfig {
  nome: string;
  tom: string;
  caracteristicas: string[];
  restricoes: string[];
}
