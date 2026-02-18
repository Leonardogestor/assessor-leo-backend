import { Request, Response } from 'express';
import { CognitiveEngine } from '../ai/cognitiveEngine';
import { StateManager } from '../state/StateManager';
import { UserRepository } from '../repositories/UserRepository';

const cognitiveEngine = new CognitiveEngine();
const stateManager = new StateManager();
const userRepository = new UserRepository();

export class MessageController {
  async process(req: Request, res: Response): Promise<void> {
    const { user_id, message } = req.body;

    const user = await userRepository.findById(user_id);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    let state;
    try {
      state = await stateManager.getState(user_id);
    } catch (error) {
      state = await stateManager.initState(user_id);
    }

    const context = {
      user_id,
      fase_live: state.fase_live,
      subfase: state.subfase,
      estado_emocional: state.estado_emocional,
      dados_contexto: state.dados_contexto
    };

    const profile = {
      name: user.name,
      email: user.email
    };

    const recentHistory = {
      messages: []
    };

    const result = await cognitiveEngine.process(message, context, profile, recentHistory);

    res.json({
      intent: result.intent,
      decision: result.decision,
      response: result.response,
      state: {
        fase: state.fase_live,
        subfase: state.subfase
      }
    });
  }

  async analyzeIntent(req: Request, res: Response): Promise<void> {
    const { user_id, message } = req.body;

    let state;
    try {
      state = await stateManager.getState(user_id);
    } catch (error) {
      state = await stateManager.initState(user_id);
    }

    const context = {
      user_id,
      fase_live: state.fase_live,
      subfase: state.subfase,
      estado_emocional: state.estado_emocional,
      dados_contexto: state.dados_contexto
    };

    const intent = await cognitiveEngine.analyzeIntent(message, context);

    res.json({ intent });
  }
}
