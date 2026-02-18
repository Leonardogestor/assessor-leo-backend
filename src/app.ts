import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { webhookWhatsapp } from './webhook-whatsapp';
import { webhookEvolution } from './webhook-evolution';

// Webhook Meta (WhatsApp oficial)
app.post('/whatsapp', webhookWhatsapp);

// Webhook Evolution API (WhatsApp sem Meta)
app.post('/webhook/evolution', webhookEvolution);

app.get('/__health', (req: Request, res: Response) => {
  const evolutionEnabled = process.env.EVOLUTION_ENABLED === 'true';
  res.json({
    status: 'ok',
    port: 3000,
    webhook: '/whatsapp',
    webhookEvolution: '/webhook/evolution',
    evolutionEnabled
  });
});

app.use('/', routes);

export default app;
