import { Request, Response } from "express";
import { MessageService } from "./services/MessageService";

const messageService = new MessageService();

export async function webhookWhatsapp(req: Request, res: Response) {
  console.log("📩 CHEGOU UMA MENSAGEM DO WHATSAPP:");
  const body = req.body;
  // Extrair dados principais do payload
  const entry = body?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const message = value?.messages?.[0];
  const from = message?.from;
  const text = message?.text?.body;
  const type = message?.type;
  console.log({ from, type, text });

  res.sendStatus(200);

  // Só processa se for mensagem de texto
  if (from && text) {
    try {
      await messageService.processMessage(from, text);
    } catch (err) {
      console.error("❌ Erro no processamento do fluxo:", err);
    }
  }
}
