import axios from 'axios';

async function testWebhook() {
  try {
    const response = await axios.post('https://leo-backend.vercel.app/whatsapp', {});
    console.log('Status:', response.status);
    console.log('Data:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Erro:', error.response.status, error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

testWebhook();
