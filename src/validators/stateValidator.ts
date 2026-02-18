import { z } from 'zod';
import { EstadoEmocional } from '../state/types';

export const initStateSchema = z.object({
  user_id: z.string().uuid('ID de usuário inválido'),
});

export const updateEmotionalStateSchema = z.object({
  estado_emocional: z.nativeEnum(EstadoEmocional),
});

export const updateContextSchema = z.object({
  contexto: z.record(z.any()),
});
