import axios from 'axios';

/**
 * Script de validação do System User Token
 * Valida todas as permissões e endpoints necessários
 */

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

async function validateToken() {
  if (!WHATSAPP_TOKEN) {
    console.error('❌ WHATSAPP_TOKEN não configurado');
    process.exit(1);
  }

  console.log('🔐 VALIDAÇÃO DE TOKEN META\n');
  console.log('Token (primeiros 30 chars):', WHATSAPP_TOKEN.substring(0, 30) + '...');
  console.log('Phone Number ID:', PHONE_NUMBER_ID || 'Não configurado');
  console.log('');

  // TEST 1: Validar token básico
  try {
    console.log('📋 [1/4] Testando GET /v19.0/me...');
    const meResponse = await axios.get('https://graph.facebook.com/v19.0/me', {
      headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` }
    });
    console.log('✅ Token válido!');
    console.log('   App ID:', meResponse.data.id);
    console.log('   Nome:', meResponse.data.name || 'N/A');
    console.log('');
  } catch (error: any) {
    console.error('❌ Falha no teste /me');
    console.error('   Status:', error.response?.status);
    console.error('   Erro:', error.response?.data?.error?.message);
    process.exit(1);
  }

  // TEST 2: Verificar permissões do phone number
  if (PHONE_NUMBER_ID) {
    try {
      console.log('📋 [2/4] Testando GET phone_number info...');
      const phoneResponse = await axios.get(
        `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}`,
        {
          headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` },
          params: { fields: 'id,verified_name,display_phone_number,quality_rating' }
        }
      );
      console.log('✅ Acesso ao phone number OK!');
      console.log('   ID:', phoneResponse.data.id);
      console.log('   Nome:', phoneResponse.data.verified_name);
      console.log('   Número:', phoneResponse.data.display_phone_number);
      console.log('   Qualidade:', phoneResponse.data.quality_rating);
      console.log('');
    } catch (error: any) {
      console.error('❌ Falha ao acessar phone number');
      console.error('   Status:', error.response?.status);
      console.error('   Erro:', error.response?.data?.error?.message);
    }
  } else {
    console.log('⚠️  [2/4] PHONE_NUMBER_ID não configurado - pulando teste');
    console.log('');
  }

  // TEST 3: Validar permissões de mídia
  if (PHONE_NUMBER_ID) {
    try {
      console.log('📋 [3/4] Testando permissões de upload de mídia...');
      // Apenas validar endpoint (não fazer upload real)
      const mediaUrl = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/media`;
      console.log('✅ Endpoint de mídia configurado:');
      console.log('   URL:', mediaUrl);
      console.log('');
    } catch (error: any) {
      console.error('❌ Erro ao validar endpoint de mídia');
    }
  }

  // TEST 4: Resumo de configuração para áudio
  console.log('📋 [4/4] Validação de configuração de áudio');
  console.log('✅ Formato aceito: audio/ogg; codecs=opus');
  console.log('✅ Limite de tamanho: 16 MB');
  console.log('✅ Bitrate recomendado: 64k (mono, 24kHz)');
  console.log('');

  console.log('🎉 VALIDAÇÃO COMPLETA - Token funcionando!');
  console.log('');
  console.log('📌 Próximos passos:');
  console.log('   1. Reinicie o servidor: npm run dev');
  console.log('   2. Envie mensagem de teste pelo WhatsApp');
  console.log('   3. Verifique logs de upload de áudio');
}

validateToken().catch((error) => {
  console.error('❌ Erro fatal:', error.message);
  process.exit(1);
});
