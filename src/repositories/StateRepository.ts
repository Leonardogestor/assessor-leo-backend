import { pool } from '../config/database';
import { UserState, FaseLIVE, Subfase, EstadoEmocional } from '../state/types';

export class StateRepository {
  async findByUserId(user_id: string): Promise<UserState | null> {
    const query = `
      SELECT 
        user_id,
        data->>'fase_live' as fase_live,
        data->>'subfase' as subfase,
        data->>'estado_emocional' as estado_emocional,
        data->>'ultimo_evento' as ultimo_evento,
        data->>'proxima_acao' as proxima_acao,
        data->'dados_contexto' as dados_contexto,
        updated_at as atualizado_em
      FROM onboarding_state
      WHERE user_id = $1 AND step = 'state_machine'
    `;
    
    const result = await pool.query(query, [user_id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      user_id: row.user_id,
      fase_live: row.fase_live as FaseLIVE,
      subfase: row.subfase as Subfase,
      estado_emocional: row.estado_emocional as EstadoEmocional,
      ultimo_evento: row.ultimo_evento,
      proxima_acao: row.proxima_acao,
      atualizado_em: row.atualizado_em,
      dados_contexto: row.dados_contexto || {}
    };
  }

  async create(state: UserState): Promise<UserState> {
    const data = {
      fase_live: state.fase_live,
      subfase: state.subfase,
      estado_emocional: state.estado_emocional,
      ultimo_evento: state.ultimo_evento,
      proxima_acao: state.proxima_acao,
      dados_contexto: state.dados_contexto || {}
    };

    const query = `
      INSERT INTO onboarding_state (user_id, step, is_completed, data)
      VALUES ($1, 'state_machine', false, $2)
      RETURNING 
        user_id,
        data->>'fase_live' as fase_live,
        data->>'subfase' as subfase,
        data->>'estado_emocional' as estado_emocional,
        data->>'ultimo_evento' as ultimo_evento,
        data->>'proxima_acao' as proxima_acao,
        data->'dados_contexto' as dados_contexto,
        updated_at as atualizado_em
    `;

    const result = await pool.query(query, [state.user_id, JSON.stringify(data)]);
    const row = result.rows[0];

    return {
      user_id: row.user_id,
      fase_live: row.fase_live as FaseLIVE,
      subfase: row.subfase as Subfase,
      estado_emocional: row.estado_emocional as EstadoEmocional,
      ultimo_evento: row.ultimo_evento,
      proxima_acao: row.proxima_acao,
      atualizado_em: row.atualizado_em,
      dados_contexto: row.dados_contexto || {}
    };
  }

  async update(state: UserState): Promise<UserState> {
    const data = {
      fase_live: state.fase_live,
      subfase: state.subfase,
      estado_emocional: state.estado_emocional,
      ultimo_evento: state.ultimo_evento,
      proxima_acao: state.proxima_acao,
      dados_contexto: state.dados_contexto || {}
    };

    const query = `
      UPDATE onboarding_state
      SET data = $2, updated_at = NOW()
      WHERE user_id = $1 AND step = 'state_machine'
      RETURNING 
        user_id,
        data->>'fase_live' as fase_live,
        data->>'subfase' as subfase,
        data->>'estado_emocional' as estado_emocional,
        data->>'ultimo_evento' as ultimo_evento,
        data->>'proxima_acao' as proxima_acao,
        data->'dados_contexto' as dados_contexto,
        updated_at as atualizado_em
    `;

    const result = await pool.query(query, [state.user_id, JSON.stringify(data)]);
    const row = result.rows[0];

    return {
      user_id: row.user_id,
      fase_live: row.fase_live as FaseLIVE,
      subfase: row.subfase as Subfase,
      estado_emocional: row.estado_emocional as EstadoEmocional,
      ultimo_evento: row.ultimo_evento,
      proxima_acao: row.proxima_acao,
      atualizado_em: row.atualizado_em,
      dados_contexto: row.dados_contexto || {}
    };
  }

  async delete(user_id: string): Promise<void> {
    const query = `DELETE FROM onboarding_state WHERE user_id = $1 AND step = 'state_machine'`;
    await pool.query(query, [user_id]);
  }
}
