import 'dotenv/config';
import app from './app';
import axios from 'axios';

const PORT = process.env.PORT || 3000;

/**
 * Valida o System User token do Meta na inicialização
 */
async function validateMetaToken(): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  
  if (!token) {
    console.warn('⚠️  WHATSAPP_TOKEN não configurado - validação ignorada');
    return;
  }

  try {
    console.log('🔐 Validando System User token...');
    const response = await axios.get('https://graph.facebook.com/v19.0/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 5000
    });

    console.log('✅ Token válido!');
    console.log(`📱 App ID: ${response.data.id}`);
    console.log(`📛 Nome: ${response.data.name || 'N/A'}`);
  } catch (error: any) {
    console.error('❌ ERRO: Token inválido ou expirado!');
    console.error('Status:', error.response?.status);
    console.error('Mensagem:', error.response?.data?.error?.message || error.message);
    console.error('\n⚠️  O servidor continuará rodando, mas chamadas à API falharão.\n');
  }
}

app.listen(PORT, async () => {
  const evolutionEnabled = process.env.EVOLUTION_ENABLED === 'true';
  console.log('\n🚀 SERVIDOR ATIVO');
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🔗 Webhook Meta: http://localhost:${PORT}/whatsapp`);
  if (evolutionEnabled) {
    console.log(`🔗 Webhook Evolution: http://localhost:${PORT}/webhook/evolution`);
    console.log(`🔄 WhatsApp via Evolution API (sem Meta)`);
  }
  console.log(`💚 Health: http://localhost:${PORT}/__health`);
  console.log(`🔑 Verify Token: ${process.env.VERIFY_TOKEN || 'meu_token_de_teste'}\n`);
  
  // Validar token na inicialização
  await validateMetaToken();
  console.log('');
});
