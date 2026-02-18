export enum FaseLIVE {
  LUCIDEZ = 'LUCIDEZ',
  IMERSAO = 'IMERSAO',
  VISAO = 'VISAO',
  EXPERIENCIAS = 'EXPERIENCIAS'
}

export enum SubfaseLucidez {
  BOAS_VINDAS = 'BOAS_VINDAS',
  IDENTIFICACAO_DOR = 'IDENTIFICACAO_DOR',
  VALIDACAO_EMOCIONAL = 'VALIDACAO_EMOCIONAL',
  DEFINICAO_OBJETIVO = 'DEFINICAO_OBJETIVO'
}

export enum SubfaseImersao {
  DIAGNOSTICO_SITUACAO = 'DIAGNOSTICO_SITUACAO',
  MAPEAMENTO_RECURSOS = 'MAPEAMENTO_RECURSOS',
  IDENTIFICACAO_BLOQUEIOS = 'IDENTIFICACAO_BLOQUEIOS',
  ANALISE_PADROES = 'ANALISE_PADROES'
}

export enum SubfaseVisao {
  CONSTRUCAO_CENARIO = 'CONSTRUCAO_CENARIO',
  DEFINICAO_METAS = 'DEFINICAO_METAS',
  PLANEJAMENTO_ETAPAS = 'PLANEJAMENTO_ETAPAS',
  VALIDACAO_PLANO = 'VALIDACAO_PLANO'
}

export enum SubfaseExperiencias {
  PRIMEIRA_ACAO = 'PRIMEIRA_ACAO',
  ACOMPANHAMENTO_DIARIO = 'ACOMPANHAMENTO_DIARIO',
  AJUSTES_ROTA = 'AJUSTES_ROTA',
  CELEBRACAO_CONQUISTAS = 'CELEBRACAO_CONQUISTAS'
}

export type Subfase = SubfaseLucidez | SubfaseImersao | SubfaseVisao | SubfaseExperiencias;

export enum EstadoEmocional {
  CONFUSO = 'CONFUSO',
  ANSIOSO = 'ANSIOSO',
  ESPERANCOSO = 'ESPERANCOSO',
  DETERMINADO = 'DETERMINADO',
  REALIZADO = 'REALIZADO',
  FRUSTRADO = 'FRUSTRADO',
  MOTIVADO = 'MOTIVADO'
}

export interface UserState {
  user_id: string;
  fase_live: FaseLIVE;
  subfase: Subfase;
  estado_emocional: EstadoEmocional;
  ultimo_evento: string;
  proxima_acao: string;
  atualizado_em: Date;
  dados_contexto?: Record<string, any>;
}

export interface StateTransition {
  from_fase: FaseLIVE;
  from_subfase: Subfase;
  to_fase: FaseLIVE;
  to_subfase: Subfase;
  condition: (state: UserState) => boolean;
}

export const SUBFASES_POR_FASE: Record<FaseLIVE, Subfase[]> = {
  [FaseLIVE.LUCIDEZ]: [
    SubfaseLucidez.BOAS_VINDAS,
    SubfaseLucidez.IDENTIFICACAO_DOR,
    SubfaseLucidez.VALIDACAO_EMOCIONAL,
    SubfaseLucidez.DEFINICAO_OBJETIVO
  ],
  [FaseLIVE.IMERSAO]: [
    SubfaseImersao.DIAGNOSTICO_SITUACAO,
    SubfaseImersao.MAPEAMENTO_RECURSOS,
    SubfaseImersao.IDENTIFICACAO_BLOQUEIOS,
    SubfaseImersao.ANALISE_PADROES
  ],
  [FaseLIVE.VISAO]: [
    SubfaseVisao.CONSTRUCAO_CENARIO,
    SubfaseVisao.DEFINICAO_METAS,
    SubfaseVisao.PLANEJAMENTO_ETAPAS,
    SubfaseVisao.VALIDACAO_PLANO
  ],
  [FaseLIVE.EXPERIENCIAS]: [
    SubfaseExperiencias.PRIMEIRA_ACAO,
    SubfaseExperiencias.ACOMPANHAMENTO_DIARIO,
    SubfaseExperiencias.AJUSTES_ROTA,
    SubfaseExperiencias.CELEBRACAO_CONQUISTAS
  ]
};

export const ORDEM_FASES: FaseLIVE[] = [
  FaseLIVE.LUCIDEZ,
  FaseLIVE.IMERSAO,
  FaseLIVE.VISAO,
  FaseLIVE.EXPERIENCIAS
];
