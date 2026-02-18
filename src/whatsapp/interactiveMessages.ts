import axios from 'axios';
import { env } from '../config/env';

const API_VERSION = 'v18.0';

/**
 * Serviço para enviar mensagens interativas do WhatsApp (botões)
 */
export class InteractiveMessageService {
  private token: string;
  private phoneNumberId: string;

  constructor() {
    this.token = env.WHATSAPP_TOKEN || '';
    this.phoneNumberId = env.PHONE_NUMBER_ID || '';
  }

  /**
   * GATE 1: Termo de Ciência
   * Envia mensagem com botões para aceitar termo
   */
  async sendGate1(to: string): Promise<void> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '📋 Termo de Ciência'
        },
        body: {
          text: `Antes de continuar, preciso da sua autorização formal.

Este termo garante que:
✅ Você está ciente que sou um ASSISTENTE VIRTUAL, não um consultor financeiro certificado
✅ Minhas orientações são educacionais e baseadas em boas práticas de organização financeira
✅ Você é responsável pelas suas decisões financeiras
✅ Não prometo ganhos financeiros garantidos
✅ Recomendo consultar profissionais certificados para decisões complexas

Este é um compromisso de transparência entre nós. Ao aceitar, posso te ajudar de forma mais profunda e personalizada.`
        },
        footer: {
          text: 'Sua privacidade é protegida'
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'accept_terms',
                title: '✅ Li e aceito'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'understand_better',
                title: '❓ Quero entender'
              }
            }
          ]
        }
      }
    };

    try {
      const response = await axios.post(
        `https://graph.facebook.com/${API_VERSION}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ GATE 1 (Termo) enviado para', to);
      console.log('   Message ID:', response.data?.messages?.[0]?.id);
    } catch (error: any) {
      console.error('❌ Erro ao enviar GATE 1:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * GATE 2: Autorização de Análise Completa
   * Envia mensagem com botões para autorizar análise
   */
  async sendGate2(to: string): Promise<void> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '🔍 Autorização de Análise'
        },
        body: {
          text: `Você compartilhou informações valiosas comigo! 🙏

Agora preciso da sua autorização formal para:
✅ Analisar todos os dados financeiros que você forneceu
✅ Criar um diagnóstico completo da sua situação
✅ Desenvolver um plano personalizado de ação
✅ Apresentar cenários futuros realistas

Sua autorização garante que você está consciente e de acordo com esta análise profunda.

Todos os dados são confidenciais e usados apenas para te ajudar.`
        },
        footer: {
          text: 'Informações protegidas'
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'authorize_analysis',
                title: '✅ Autorizo análise'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'review_before',
                title: '🔄 Revisar antes'
              }
            }
          ]
        }
      }
    };

    try {
      const response = await axios.post(
        `https://graph.facebook.com/${API_VERSION}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ GATE 2 (Autorização) enviado para', to);
      console.log('   Message ID:', response.data?.messages?.[0]?.id);
    } catch (error: any) {
      console.error('❌ Erro ao enviar GATE 2:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar confirmação após aceite de gate
   */
  async sendConfirmation(to: string, type: 'terms_accepted' | 'analysis_authorized'): Promise<void> {
    const messages = {
      terms_accepted: `🎉 Perfeito! Termo aceito.

Agora podemos avançar de forma mais profunda. Vamos mergulhar na sua situação financeira para criar um plano real de transformação.

Pode me enviar seus dados quando estiver pronto!`,
      
      analysis_authorized: `🎯 Autorização recebida!

Vou analisar tudo que você compartilhou e em breve te apresento:
✅ Diagnóstico completo da sua situação
✅ Plano personalizado de ação
✅ Cenários futuros realistas

Me dê alguns instantes... ⏳`
    };

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: {
        body: messages[type]
      }
    };

    try {
      await axios.post(
        `https://graph.facebook.com/${API_VERSION}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Confirmação enviada: ${type}`);
    } catch (error: any) {
      console.error('❌ Erro ao enviar confirmação:', error.response?.data || error.message);
    }
  }

  /**
   * Enviar mensagem quando usuário clica em "Quero entender melhor"
   */
  async sendTermExplanation(to: string): Promise<void> {
    const text = `Entendo sua cautela! É importante saber com quem você está conversando. 😊

**Sobre mim:**
Sou um assistente virtual criado para ajudar pessoas a organizarem suas finanças de forma consciente e prática.

**O que EU FAÇO:**
✅ Te ajudo a entender sua situação financeira atual
✅ Crio planos personalizados de organização
✅ Acompanho seu progresso diariamente
✅ Celebro suas conquistas

**O que EU NÃO FAÇO:**
❌ Não sou consultor financeiro certificado (CPA, CFP)
❌ Não indico investimentos específicos
❌ Não prometo ganhos garantidos
❌ Não substituo profissionais certificados em casos complexos

**Meu papel:** ser seu parceiro na jornada de organização financeira, com foco em CONSCIÊNCIA e AÇÃO.

O termo garante transparência entre nós. Pronto para aceitar?`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: { body: text }
    };

    try {
      await axios.post(
        `https://graph.facebook.com/${API_VERSION}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Reenviar botões após explicação
      setTimeout(() => this.sendGate1(to), 2000);
    } catch (error: any) {
      console.error('❌ Erro ao enviar explicação:', error.response?.data || error.message);
    }
  }

  /**
   * Enviar mensagem quando usuário quer revisar dados antes de autorizar
   */
  async sendReviewOption(to: string): Promise<void> {
    const text = `Claro! Vou listar o que você compartilhou:

📊 **Dados recebidos:**
(Aqui você pode revisar e me dizer se está tudo certo)

Se quiser corrigir ou adicionar algo, me fale agora. Depois eu reenvio a autorização. 👍`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: { body: text }
    };

    try {
      await axios.post(
        `https://graph.facebook.com/${API_VERSION}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error: any) {
      console.error('❌ Erro ao enviar opção de revisão:', error.response?.data || error.message);
    }
  }
}

export const interactiveMessageService = new InteractiveMessageService();
