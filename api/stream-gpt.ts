// /api/stream-gpt.ts

import { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey:
    "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", // Ensure this is set in your environment variables
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { prompt, systemPrompt } = req.query;

  if (
    !prompt ||
    typeof prompt !== "string" ||
    !systemPrompt ||
    typeof systemPrompt !== "string"
  ) {
    res.status(400).json({ error: "Prompt and system prompt are required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      stream: true,
    });

    for await (const part of stream) {
      const content = part.choices[0]?.delta?.content || "";
      res.write(`data: ${content}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Error streaming GPT response:", error.message);
    res.status(500).json({ error: "Failed to stream GPT response" });
  }
}
