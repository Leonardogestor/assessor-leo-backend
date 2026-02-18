interface ConversationHistory {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UserContext {
  phoneNumber: string;
  history: ConversationHistory[];
  createdAt: Date;
  lastInteraction: Date;
}

const MAX_HISTORY_PER_USER = 10;
const CONTEXT_EXPIRY_MS = 3600000; // 1 hora

export class ContextManager {
  private contexts: Map<string, UserContext>;

  constructor() {
    this.contexts = new Map();
    
    // Limpeza automática a cada 30 minutos
    setInterval(() => this.cleanup(), 1800000);
  }

  addMessage(phoneNumber: string, role: 'user' | 'assistant', content: string): void {
    let context = this.contexts.get(phoneNumber);

    if (!context) {
      context = {
        phoneNumber,
        history: [],
        createdAt: new Date(),
        lastInteraction: new Date()
      };
      this.contexts.set(phoneNumber, context);
      console.log(`✨ Novo contexto criado para ${phoneNumber}`);
    }

    context.history.push({
      role,
      content,
      timestamp: new Date()
    });

    context.lastInteraction = new Date();

    // Manter apenas as últimas N mensagens
    if (context.history.length > MAX_HISTORY_PER_USER) {
      context.history = context.history.slice(-MAX_HISTORY_PER_USER);
      console.log(`🔄 Histórico truncado para ${phoneNumber} (máx: ${MAX_HISTORY_PER_USER})`);
    }
  }

  getHistory(phoneNumber: string): ConversationHistory[] {
    const context = this.contexts.get(phoneNumber);
    return context ? [...context.history] : [];
  }

  getContextSummary(phoneNumber: string): string {
    const history = this.getHistory(phoneNumber);
    
    if (history.length === 0) {
      return '';
    }

    // Formatar histórico para o GPT
    const summary = history
      .map(h => `${h.role === 'user' ? 'Usuário' : 'Léo'}: ${h.content}`)
      .join('\n');

    return `Histórico da conversa:\n${summary}`;
  }

  /**
   * Verifica se é a primeira interação do usuário (primeira mensagem do assistente)
   * Retorna true se houver apenas 1 mensagem no histórico (a do usuário)
   */
  isFirstInteraction(phoneNumber: string): boolean {
    const history = this.getHistory(phoneNumber);
    // Primeira interação: só tem a mensagem do usuário, sem resposta ainda
    return history.length === 1 && history[0].role === 'user';
  }

  clearContext(phoneNumber: string): void {
    this.contexts.delete(phoneNumber);
    console.log(`🗑️  Contexto removido para ${phoneNumber}`);
  }

  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [phoneNumber, context] of this.contexts.entries()) {
      const elapsed = now - context.lastInteraction.getTime();
      
      if (elapsed > CONTEXT_EXPIRY_MS) {
        this.contexts.delete(phoneNumber);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 Limpeza automática: ${removed} contexto(s) expirado(s) removido(s)`);
    }
  }

  getStats(): { totalUsers: number; totalMessages: number } {
    let totalMessages = 0;
    
    for (const context of this.contexts.values()) {
      totalMessages += context.history.length;
    }

    return {
      totalUsers: this.contexts.size,
      totalMessages
    };
  }
}

export const contextManager = new ContextManager();
