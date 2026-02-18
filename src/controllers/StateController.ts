import { Request, Response } from 'express';
import { StateManager } from '../state/StateManager';
import { EstadoEmocional } from '../state/types';

const stateManager = new StateManager();

export class StateController {
  async getState(req: Request, res: Response): Promise<void> {
    const { user_id } = req.params;
    const state = await stateManager.getState(user_id);
    res.json(state);
  }

  async initState(req: Request, res: Response): Promise<void> {
    const { user_id } = req.body;
    const state = await stateManager.initState(user_id);
    res.status(201).json(state);
  }

  async canAdvance(req: Request, res: Response): Promise<void> {
    const { user_id } = req.params;
    const canAdvance = await stateManager.canAdvance(user_id);
    res.json({ can_advance: canAdvance });
  }

  async advanceState(req: Request, res: Response): Promise<void> {
    const { user_id } = req.params;
    const state = await stateManager.advanceState(user_id);
    res.json(state);
  }

  async updateEmotionalState(req: Request, res: Response): Promise<void> {
    const { user_id } = req.params;
    const { estado_emocional } = req.body;
    const state = await stateManager.updateEmotionalState(user_id, estado_emocional as EstadoEmocional);
    res.json(state);
  }

  async updateContext(req: Request, res: Response): Promise<void> {
    const { user_id } = req.params;
    const { contexto } = req.body;
    const state = await stateManager.updateContext(user_id, contexto);
    res.json(state);
  }

  async resetState(req: Request, res: Response): Promise<void> {
    const { user_id } = req.params;
    await stateManager.resetState(user_id);
    res.status(204).send();
  }

  async getPhaseInfo(req: Request, res: Response): Promise<void> {
    const { user_id } = req.params;
    const info = await stateManager.getCurrentPhaseInfo(user_id);
    res.json(info);
  }
}
