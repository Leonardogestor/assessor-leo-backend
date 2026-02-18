import { StateRepository } from '../repositories/StateRepository';
import { 
  UserState, 
  FaseLIVE, 
  Subfase, 
  EstadoEmocional,
  SubfaseLucidez,
  SUBFASES_POR_FASE,
  ORDEM_FASES
} from './types';
import { AppError } from '../utils/AppError';

export class StateManager {
  private repository: StateRepository;

  constructor() {
    this.repository = new StateRepository();
  }

  async getState(user_id: string): Promise<UserState> {
    const state = await this.repository.findByUserId(user_id);
    
    if (!state) {
      throw new AppError('Estado do usuário não encontrado', 404);
    }

    return state;
  }

  async initState(user_id: string): Promise<UserState> {
    const existingState = await this.repository.findByUserId(user_id);
    
    if (existingState) {
      throw new AppError('Estado do usuário já inicializado', 409);
    }

    const initialState: UserState = {
      user_id,
      fase_live: FaseLIVE.LUCIDEZ,
      subfase: SubfaseLucidez.BOAS_VINDAS,
      estado_emocional: EstadoEmocional.CONFUSO,
      ultimo_evento: 'INIT',
      proxima_acao: 'Apresentar o Assessor Léo e o método LIVE',
      atualizado_em: new Date(),
      dados_contexto: {}
    };

    return await this.repository.create(initialState);
  }

  async canAdvance(user_id: string): Promise<boolean> {
    const state = await this.getState(user_id);
    
    if (!state.dados_contexto) {
      return false;
    }

    const requiredFields = this.getRequiredFieldsForSubfase(state.subfase);
    
    for (const field of requiredFields) {
      if (!state.dados_contexto[field]) {
        return false;
      }
    }

    return true;
  }

  async advanceState(user_id: string): Promise<UserState> {
    const currentState = await this.getState(user_id);
    
    const canProgress = await this.canAdvance(user_id);
    if (!canProgress) {
      throw new AppError('Condições para avançar não foram atendidas', 400);
    }

    const nextState = this.calculateNextState(currentState);
    
    const updatedState: UserState = {
      ...currentState,
      fase_live: nextState.fase,
      subfase: nextState.subfase,
      ultimo_evento: 'ADVANCE',
      proxima_acao: this.getProximaAcao(nextState.fase, nextState.subfase),
      atualizado_em: new Date()
    };

    return await this.repository.update(updatedState);
  }

  async updateEmotionalState(user_id: string, estado: EstadoEmocional): Promise<UserState> {
    const currentState = await this.getState(user_id);
    
    const updatedState: UserState = {
      ...currentState,
      estado_emocional: estado,
      ultimo_evento: 'UPDATE_EMOTIONAL_STATE',
      atualizado_em: new Date()
    };

    return await this.repository.update(updatedState);
  }

  async updateContext(user_id: string, contexto: Record<string, any>): Promise<UserState> {
    const currentState = await this.getState(user_id);
    
    const updatedState: UserState = {
      ...currentState,
      dados_contexto: {
        ...currentState.dados_contexto,
        ...contexto
      },
      ultimo_evento: 'UPDATE_CONTEXT',
      atualizado_em: new Date()
    };

    return await this.repository.update(updatedState);
  }

  async resetState(user_id: string): Promise<void> {
    await this.repository.delete(user_id);
  }

  private calculateNextState(currentState: UserState): { fase: FaseLIVE; subfase: Subfase } {
    const currentFase = currentState.fase_live;
    const currentSubfase = currentState.subfase;
    
    const subfasesAtual = SUBFASES_POR_FASE[currentFase];
    const currentSubfaseIndex = subfasesAtual.indexOf(currentSubfase);
    
    if (currentSubfaseIndex < subfasesAtual.length - 1) {
      return {
        fase: currentFase,
        subfase: subfasesAtual[currentSubfaseIndex + 1]
      };
    }
    
    const currentFaseIndex = ORDEM_FASES.indexOf(currentFase);
    
    if (currentFaseIndex < ORDEM_FASES.length - 1) {
      const nextFase = ORDEM_FASES[currentFaseIndex + 1];
      const nextSubfases = SUBFASES_POR_FASE[nextFase];
      
      return {
        fase: nextFase,
        subfase: nextSubfases[0]
      };
    }
    
    return {
      fase: currentFase,
      subfase: currentSubfase
    };
  }

  private getRequiredFieldsForSubfase(subfase: Subfase): string[] {
    const requirements: Record<string, string[]> = {
      // LUCIDEZ
      'BOAS_VINDAS': ['nome_usuario'],
      'IDENTIFICACAO_DOR': ['dor_principal'],
      'VALIDACAO_EMOCIONAL': ['emocao_validada'],
      'DEFINICAO_OBJETIVO': ['objetivo_definido'],
      
      // IMERSAO
      'DIAGNOSTICO_SITUACAO': ['situacao_atual'],
      'MAPEAMENTO_RECURSOS': ['recursos_disponiveis'],
      'IDENTIFICACAO_BLOQUEIOS': ['bloqueios_identificados'],
      'ANALISE_PADROES': ['padroes_comportamentais'],
      
      // VISAO
      'CONSTRUCAO_CENARIO': ['cenario_futuro'],
      'DEFINICAO_METAS': ['metas_definidas'],
      'PLANEJAMENTO_ETAPAS': ['etapas_planejadas'],
      'VALIDACAO_PLANO': ['plano_validado'],
      
      // EXPERIENCIAS
      'PRIMEIRA_ACAO': ['acao_executada'],
      'ACOMPANHAMENTO_DIARIO': ['registro_diario'],
      'AJUSTES_ROTA': ['ajustes_realizados'],
      'CELEBRACAO_CONQUISTAS': ['conquista_celebrada']
    };

    return requirements[subfase] || [];
  }

  private getProximaAcao(fase: FaseLIVE, subfase: Subfase): string {
    const acoes: Record<string, string> = {
      // LUCIDEZ
      'LUCIDEZ_BOAS_VINDAS': 'Apresentar o Assessor Léo e criar rapport',
      'LUCIDEZ_IDENTIFICACAO_DOR': 'Identificar a principal dor ou desafio do usuário',
      'LUCIDEZ_VALIDACAO_EMOCIONAL': 'Validar as emoções e criar conexão empática',
      'LUCIDEZ_DEFINICAO_OBJETIVO': 'Definir objetivo claro e mensurável',
      
      // IMERSAO
      'IMERSAO_DIAGNOSTICO_SITUACAO': 'Diagnosticar situação atual em profundidade',
      'IMERSAO_MAPEAMENTO_RECURSOS': 'Mapear recursos e competências disponíveis',
      'IMERSAO_IDENTIFICACAO_BLOQUEIOS': 'Identificar bloqueios e limitações',
      'IMERSAO_ANALISE_PADROES': 'Analisar padrões de comportamento',
      
      // VISAO
      'VISAO_CONSTRUCAO_CENARIO': 'Construir cenário futuro desejado',
      'VISAO_DEFINICAO_METAS': 'Definir metas específicas e alcançáveis',
      'VISAO_PLANEJAMENTO_ETAPAS': 'Planejar etapas e cronograma',
      'VISAO_VALIDACAO_PLANO': 'Validar plano de ação',
      
      // EXPERIENCIAS
      'EXPERIENCIAS_PRIMEIRA_ACAO': 'Executar primeira ação concreta',
      'EXPERIENCIAS_ACOMPANHAMENTO_DIARIO': 'Acompanhar progresso diário',
      'EXPERIENCIAS_AJUSTES_ROTA': 'Realizar ajustes no plano',
      'EXPERIENCIAS_CELEBRACAO_CONQUISTAS': 'Celebrar conquistas e aprendizados'
    };

    const key = `${fase}_${subfase}`;
    return acoes[key] || 'Prosseguir com o método LIVE';
  }

  async getCurrentPhaseInfo(user_id: string): Promise<{
    fase: FaseLIVE;
    subfase: Subfase;
    progresso_fase: number;
    progresso_total: number;
    pode_avancar: boolean;
  }> {
    const state = await this.getState(user_id);
    const canProgress = await this.canAdvance(user_id);
    
    const subfasesAtual = SUBFASES_POR_FASE[state.fase_live];
    const currentSubfaseIndex = subfasesAtual.indexOf(state.subfase);
    const progressoFase = ((currentSubfaseIndex + 1) / subfasesAtual.length) * 100;
    
    const currentFaseIndex = ORDEM_FASES.indexOf(state.fase_live);
    const totalSubfases = ORDEM_FASES.reduce((acc, fase) => acc + SUBFASES_POR_FASE[fase].length, 0);
    const subfasesConcluidas = ORDEM_FASES.slice(0, currentFaseIndex)
      .reduce((acc, fase) => acc + SUBFASES_POR_FASE[fase].length, 0) + currentSubfaseIndex;
    const progressoTotal = (subfasesConcluidas / totalSubfases) * 100;
    
    return {
      fase: state.fase_live,
      subfase: state.subfase,
      progresso_fase: Math.round(progressoFase),
      progresso_total: Math.round(progressoTotal),
      pode_avancar: canProgress
    };
  }
}
