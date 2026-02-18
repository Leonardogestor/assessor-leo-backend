import { IntentAnalyzer } from './intentAnalyzer';
import { DecisionEngine } from './decisionEngine';
import { ResponseHumanizer } from './responseHumanizer';
import { AIContext, UserProfile, RecentHistory, IntentResult, DecisionResult } from './types';

export class CognitiveEngine {
  private intentAnalyzer: IntentAnalyzer;
  private decisionEngine: DecisionEngine;
  private responseHumanizer: ResponseHumanizer;

  constructor() {
    this.intentAnalyzer = new IntentAnalyzer();
    this.decisionEngine = new DecisionEngine();
    this.responseHumanizer = new ResponseHumanizer();
  }

  async process(
    userMessage: string,
    context: AIContext,
    profile: UserProfile,
    recentHistory: RecentHistory
  ): Promise<{
    intent: IntentResult;
    decision: DecisionResult;
    response: string;
  }> {
    const intent = await this.intentAnalyzer.analyze(userMessage, context);
    
    const decision = await this.decisionEngine.decide(intent, context, profile, recentHistory);
    
    const persona = this.responseHumanizer.getDefaultPersona();
    const response = await this.responseHumanizer.humanize(decision, persona);

    return {
      intent,
      decision,
      response
    };
  }

  async analyzeIntent(userMessage: string, context: AIContext): Promise<IntentResult> {
    return await this.intentAnalyzer.analyze(userMessage, context);
  }

  async makeDecision(
    intent: IntentResult,
    context: AIContext,
    profile: UserProfile,
    recentHistory: RecentHistory
  ): Promise<DecisionResult> {
    return await this.decisionEngine.decide(intent, context, profile, recentHistory);
  }

  async humanizeResponse(decision: DecisionResult): Promise<string> {
    const persona = this.responseHumanizer.getDefaultPersona();
    return await this.responseHumanizer.humanize(decision, persona);
  }
}
