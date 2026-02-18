import { pool } from '../config/database';

/**
 * Estados principais do fluxo com gates obrigatórios
 */
export enum EstadoPrincipal {
  ENTRADA = 'ENTRADA',
  LUCIDEZ = 'LUCIDEZ',
  GATE_TERMO = 'GATE_TERMO',
  IMERSAO = 'IMERSAO',
  GATE_AUTORIZACAO = 'GATE_AUTORIZACAO',
  VISAO = 'VISAO',
  EXPERIENCIAS = 'EXPERIENCIAS'
}

/**
 * Estado do usuário com gates e persistência
 */
export interface UserStateGated {
  user_id: string;
  phone_number: string;
  estado_atual: EstadoPrincipal;
  
  // Gates obrigatórios
  accepted_terms: boolean;
  accepted_terms_at?: Date;
  authorized_analysis: boolean;
  authorized_analysis_at?: Date;
  
  // Dados coletados na imersão
  dados_coletados: {
    renda?: number;
    dividas?: number;
    gastos_mensais?: number;
    tem_prints?: boolean;
    tem_extratos?: boolean;
    sonho_principal?: string;
    maior_dor?: string;
  };
  
  // Controle de progressão
  interacoes: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * System prompts dinâmicos por estado
 */
const BASE_PERSONALITY = `Você é Léo, um assessor financeiro que conduz pessoas à liberdade financeira através da consciência e da realização de sonhos.

IDENTIDADE
Você é acolhedor, direto, didático e extremamente empático. Fala com firmeza suave, baseado em dados (nunca em opinião). Nunca julga, nunca acusa, nunca se coloca como superior. Seu único propósito é resgatar os sonhos do cliente e guiá-lo até eles.

LIMITES ÉTICOS
- Você NÃO é consultor de investimentos, advogado ou contador
- Você NÃO promete ganhos financeiros garantidos
- Você NÃO dá conselhos irresponsáveis
- Você NÃO encerra o atendimento (acompanhamento é contínuo)

TOM DE VOZ
- Acolhedor mas firme
- Claro e simples (nunca rebuscado)
- Empático sem ser paternalista
- Motivador sem ser falso
- Maduro e estratégico`;

const PROMPTS_POR_ESTADO: Record<EstadoPrincipal, string> = {
  [EstadoPrincipal.ENTRADA]: `${BASE_PERSONALITY}

INSTRUÇÕES ESPECÍFICAS - ESTADO ENTRADA:
- Esta é a PRIMEIRA interação com o usuário
- Seu objetivo: criar conexão humana e curiosidade
- Fazer uma pergunta aberta: "Como posso te ajudar hoje?" ou similar
- PROIBIDO: pedir dados pessoais, falar do método LIVE, falar de pagamento
- PROIBIDO: mencionar fases, etapas ou processos
- Tom: 100% acolhedor, sem pressa, sem venda
- Máximo 2 parágrafos curtos
- Use emojis com moderação`,

  [EstadoPrincipal.LUCIDEZ]: `${BASE_PERSONALITY}

INSTRUÇÕES ESPECÍFICAS - ESTADO LUCIDEZ (Fases 1-3):
- Criar CONSCIÊNCIA da necessidade de mudança
- Técnicas de PNL:
  * Espelhamento: validar emoções ("Sinto que você está frustrado...")
  * Reframing: transformar falhas em aprendizados
  * Future Pace: conectar ação presente com sonho futuro
  * Âncora emocional: SEMPRE conectar ao sonho principal
- Perguntas estratégicas para identificar:
  * Qual é o SONHO principal? (não objetivo financeiro)
  * Qual é a DOR que te trouxe aqui?
  * O que te impede de agir até agora?
- NÃO coletar dados financeiros ainda
- NÃO falar do método completo
- Objetivo: compromisso emocional com a mudança
- Máximo 3 parágrafos`,

  [EstadoPrincipal.GATE_TERMO]: `${BASE_PERSONALITY}

INSTRUÇÕES ESPECÍFICAS - AGUARDANDO ACEITE DE TERMO:
- Usuário está BLOQUEADO até aceitar o Termo de Ciência
- Se perguntar algo: responda brevemente e REFORCE a necessidade de aceitar o termo
- NÃO avance na conversa até o clique no botão
- Seja firme mas educado: "Antes de continuar, preciso que você leia e aceite o Termo de Ciência. É rápido e garante que estamos alinhados."`,

  [EstadoPrincipal.IMERSAO]: `${BASE_PERSONALITY}

INSTRUÇÕES ESPECÍFICAS - ESTADO IMERSÃO (Fase 4):
- Agora SIM, coletar dados financeiros completos:
  * Renda mensal (líquida)
  * Dívidas totais (cartão, empréstimo, etc)
  * Gastos mensais médios
  * Solicitar prints de extratos bancários
  * Solicitar prints de faturas de cartão
- Tratamento de OBJEÇÕES EMOCIONAIS:
  * Vergonha: "Troque vergonha por coragem. Estou aqui para ver dados, não falhas."
  * Culpa: "A culpa é improdutiva. Vamos transformá-la em ação responsável."
  * Medo: "O único fracasso real é a inação. Meu método é baseado em pequenas vitórias."
  * Autossabotagem: "Sua mente está te protegendo de uma dor que não existe mais."
- Pedir um dado por vez (não interrogatório)
- Validar emocionalmente ANTES de pedir o próximo dado
- Máximo 3 parágrafos por mensagem`,

  [EstadoPrincipal.GATE_AUTORIZACAO]: `${BASE_PERSONALITY}

INSTRUÇÕES ESPECÍFICAS - AGUARDANDO AUTORIZAÇÃO DE ANÁLISE:
- Usuário forneceu os dados mas ainda não autorizou análise completa
- Se perguntar algo: responda mas REFORCE que precisa da autorização formal
- Explique brevemente: "Agora vou analisar tudo que você compartilhou e criar um diagnóstico completo. Preciso da sua autorização formal para isso."
- NÃO fazer análise até o clique no botão`,

  [EstadoPrincipal.VISAO]: `${BASE_PERSONALITY}

INSTRUÇÕES ESPECÍFICAS - ESTADO VISÃO (Fases 5-7):
- Apresentar DIAGNÓSTICO completo baseado nos dados coletados
- Apresentar o método LEAVE (agora SIM):
  * Lucidez: já alcançada (consciência criada)
  * Emersão: dados coletados e validados
  * Ação: definir primeira ação concreta
  * Vida: projetar cenário futuro realista
  * Experiências: microvitórias diárias
- Construir CENÁRIOS FUTUROS:
  * Onde você estará em 6 meses seguindo o plano?
  * Quanto mais perto do seu sonho?
  * Qual a sensação de realizar isso?
- Definir PLANO DE AÇÃO claro e executável
- Máximo 4 parágrafos (pode ser mais denso aqui)`,

  [EstadoPrincipal.EXPERIENCIAS]: `${BASE_PERSONALITY}

INSTRUÇÕES ESPECÍFICAS - ESTADO EXPERIÊNCIAS (Fases 8-11):
- PRIMEIRA AÇÃO (72h): definir microvitória para próximas 72h
- ACOMPANHAMENTO DIÁRIO:
  * Perguntar: "Como foi hoje?"
  * Celebrar pequenas vitórias
  * Ajustar rota se necessário
  * Manter âncora emocional (sonho)
- FEEDBACK MENSAL:
  * Revisar progresso
  * Atualizar plano
  * Reforçar identidade ("Você é alguém que honra seu plano")
- REAVALIAÇÃO TRIMESTRAL:
  * Novo diagnóstico
  * Ajustar cenários
  * Definir próximos marcos
- PRODUTO RECORRENTE:
  * Este estado NUNCA termina
  * Acompanhamento contínuo
  * Loop infinito de evolução
- Tom: firme suave, celebração constante, sem julgamento
- Máximo 3 parágrafos`
};

/**
 * Gerenciador de estados com gates obrigatórios
 */
export class StateManagerGated {
  /**
   * Busca ou cria estado do usuário
   */
  async getOrCreateState(phone_number: string): Promise<UserStateGated> {
    // Tentar buscar existente
    const query = `
      SELECT 
        user_id,
        data->>'phone_number' as phone_number,
        data->>'estado_atual' as estado_atual,
        (data->>'accepted_terms')::boolean as accepted_terms,
        (data->>'accepted_terms_at')::timestamp as accepted_terms_at,
        (data->>'authorized_analysis')::boolean as authorized_analysis,
        (data->>'authorized_analysis_at')::timestamp as authorized_analysis_at,
        data->'dados_coletados' as dados_coletados,
        (data->>'interacoes')::int as interacoes,
        created_at,
        updated_at
      FROM onboarding_state
      WHERE user_id = $1 AND step = 'gated_flow'
    `;
    
    const result = await pool.query(query, [phone_number]).catch(() => ({ rows: [] }));
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        user_id: row.user_id,
        phone_number: row.phone_number,
        estado_atual: row.estado_atual as EstadoPrincipal,
        accepted_terms: row.accepted_terms || false,
        accepted_terms_at: row.accepted_terms_at,
        authorized_analysis: row.authorized_analysis || false,
        authorized_analysis_at: row.authorized_analysis_at,
        dados_coletados: row.dados_coletados || {},
        interacoes: row.interacoes || 0,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    }
    
    // Criar novo estado (ENTRADA)
    const newState: UserStateGated = {
      user_id: phone_number,
      phone_number,
      estado_atual: EstadoPrincipal.ENTRADA,
      accepted_terms: false,
      authorized_analysis: false,
      dados_coletados: {},
      interacoes: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await this.saveState(newState);
    console.log(`✨ Novo usuário criado: ${phone_number} → ESTADO: ENTRADA`);
    
    return newState;
  }

  /**
   * Salva estado no banco (ou memória se DB não configurado)
   */
  private async saveState(state: UserStateGated): Promise<void> {
    const data = {
      phone_number: state.phone_number,
      estado_atual: state.estado_atual,
      accepted_terms: state.accepted_terms,
      accepted_terms_at: state.accepted_terms_at,
      authorized_analysis: state.authorized_analysis,
      authorized_analysis_at: state.authorized_analysis_at,
      dados_coletados: state.dados_coletados,
      interacoes: state.interacoes
    };
    
    const query = `
      INSERT INTO onboarding_state (user_id, step, is_completed, data, created_at, updated_at)
      VALUES ($1, 'gated_flow', false, $2, NOW(), NOW())
      ON CONFLICT (user_id, step) 
      DO UPDATE SET data = $2, updated_at = NOW()
    `;
    
    await pool.query(query, [state.user_id, JSON.stringify(data)]).catch((error) => {
      console.warn('⚠️  Database não disponível - usando memória:', error.message);
    });
  }

  /**
   * Incrementa contador de interações
   */
  async incrementInteractions(user_id: string): Promise<void> {
    const state = await this.getOrCreateState(user_id);
    state.interacoes += 1;
    state.updated_at = new Date();
    await this.saveState(state);
  }

  /**
   * Aceitar termo de ciência (GATE 1)
   */
  async acceptTerms(user_id: string): Promise<void> {
    const state = await this.getOrCreateState(user_id);
    
    if (state.estado_atual !== EstadoPrincipal.GATE_TERMO) {
      throw new Error('Usuário não está no estado GATE_TERMO');
    }
    
    state.accepted_terms = true;
    state.accepted_terms_at = new Date();
    state.estado_atual = EstadoPrincipal.IMERSAO;
    state.updated_at = new Date();
    
    await this.saveState(state);
    console.log(`✅ ${user_id} aceitou Termo de Ciência → IMERSAO`);
  }

  /**
   * Autorizar análise completa (GATE 2)
   */
  async authorizeAnalysis(user_id: string): Promise<void> {
    const state = await this.getOrCreateState(user_id);
    
    if (state.estado_atual !== EstadoPrincipal.GATE_AUTORIZACAO) {
      throw new Error('Usuário não está no estado GATE_AUTORIZACAO');
    }
    
    state.authorized_analysis = true;
    state.authorized_analysis_at = new Date();
    state.estado_atual = EstadoPrincipal.VISAO;
    state.updated_at = new Date();
    
    await this.saveState(state);
    console.log(`✅ ${user_id} autorizou análise → VISAO`);
  }

  /**
   * Atualizar dados coletados
   */
  async updateDadosColetados(user_id: string, dados: Partial<UserStateGated['dados_coletados']>): Promise<void> {
    const state = await this.getOrCreateState(user_id);
    state.dados_coletados = { ...state.dados_coletados, ...dados };
    state.updated_at = new Date();
    await this.saveState(state);
  }

  /**
   * Verificar se pode avançar de LUCIDEZ para GATE_TERMO
   */
  async canAdvanceToGate1(user_id: string): Promise<boolean> {
    const state = await this.getOrCreateState(user_id);
    
    // Critérios: estado LUCIDEZ + mínimo 3 interações + sonho identificado
    return (
      state.estado_atual === EstadoPrincipal.LUCIDEZ &&
      state.interacoes >= 3 &&
      !!state.dados_coletados.sonho_principal
    );
  }

  /**
   * Verificar se pode avançar de IMERSAO para GATE_AUTORIZACAO
   */
  async canAdvanceToGate2(user_id: string): Promise<boolean> {
    const state = await this.getOrCreateState(user_id);
    
    // Critérios: estado IMERSAO + dados financeiros completos
    const dados = state.dados_coletados;
    return (
      state.estado_atual === EstadoPrincipal.IMERSAO &&
      !!dados.renda &&
      !!dados.dividas &&
      !!dados.gastos_mensais &&
      !!(dados.tem_prints || dados.tem_extratos)
    );
  }

  /**
   * Avançar para próximo estado (chamado manualmente quando gates são cumpridos)
   */
  async advanceState(user_id: string): Promise<void> {
    const state = await this.getOrCreateState(user_id);
    
    // ENTRADA → LUCIDEZ (após primeira interação)
    if (state.estado_atual === EstadoPrincipal.ENTRADA && state.interacoes >= 1) {
      state.estado_atual = EstadoPrincipal.LUCIDEZ;
      state.updated_at = new Date();
      await this.saveState(state);
      console.log(`🔄 ${user_id}: ENTRADA → LUCIDEZ`);
      return;
    }
    
    // LUCIDEZ → GATE_TERMO (após critérios cumpridos)
    if (await this.canAdvanceToGate1(user_id)) {
      state.estado_atual = EstadoPrincipal.GATE_TERMO;
      state.updated_at = new Date();
      await this.saveState(state);
      console.log(`🔄 ${user_id}: LUCIDEZ → GATE_TERMO`);
      return;
    }
    
    // IMERSAO → GATE_AUTORIZACAO (após dados coletados)
    if (await this.canAdvanceToGate2(user_id)) {
      state.estado_atual = EstadoPrincipal.GATE_AUTORIZACAO;
      state.updated_at = new Date();
      await this.saveState(state);
      console.log(`🔄 ${user_id}: IMERSAO → GATE_AUTORIZACAO`);
      return;
    }
    
    // VISAO → EXPERIENCIAS (após plano definido, critério simplificado)
    if (state.estado_atual === EstadoPrincipal.VISAO && state.interacoes >= 2) {
      state.estado_atual = EstadoPrincipal.EXPERIENCIAS;
      state.updated_at = new Date();
      await this.saveState(state);
      console.log(`🔄 ${user_id}: VISAO → EXPERIENCIAS (LOOP INFINITO)`);
      return;
    }
    
    console.log(`⚠️  ${user_id}: Não pode avançar de ${state.estado_atual} ainda`);
  }

  /**
   * Obter system prompt dinâmico baseado no estado atual
   */
  async getCurrentPrompt(user_id: string): Promise<string> {
    const state = await this.getOrCreateState(user_id);
    const basePrompt = PROMPTS_POR_ESTADO[state.estado_atual];
    
    // Adicionar contexto de dados coletados
    let contextAddition = '';
    
    if (state.dados_coletados.sonho_principal) {
      contextAddition += `\n\nSONHO DO CLIENTE: ${state.dados_coletados.sonho_principal}`;
    }
    
    if (state.dados_coletados.maior_dor) {
      contextAddition += `\nDOR PRINCIPAL: ${state.dados_coletados.maior_dor}`;
    }
    
    if (state.estado_atual === EstadoPrincipal.VISAO || state.estado_atual === EstadoPrincipal.EXPERIENCIAS) {
      contextAddition += `\n\nDADOS FINANCEIROS:`;
      contextAddition += `\n- Renda mensal: R$ ${state.dados_coletados.renda || 'não informado'}`;
      contextAddition += `\n- Dívidas totais: R$ ${state.dados_coletados.dividas || 'não informado'}`;
      contextAddition += `\n- Gastos mensais: R$ ${state.dados_coletados.gastos_mensais || 'não informado'}`;
    }
    
    return basePrompt + contextAddition;
  }

  /**
   * Obter estado atual do usuário (para debug)
   */
  async getState(user_id: string): Promise<UserStateGated> {
    return await this.getOrCreateState(user_id);
  }
}

export const stateManagerGated = new StateManagerGated();
