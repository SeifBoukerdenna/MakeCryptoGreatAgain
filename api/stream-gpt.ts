// /api/stream-gpt.ts

import { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import { ChatCompletionMessage } from "openai/resources/chat/index.mjs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { prompt, systemPrompt, conversationHistory } = req.query;

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
    // Build messages array with conversation history
    const messages: Array<any> = [{ role: "system", content: systemPrompt }];

    // Add conversation history if it exists
    if (conversationHistory && typeof conversationHistory === "string") {
      const history = JSON.parse(conversationHistory);
      messages.push(
        ...history.map(
          (msg: any) =>
            ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.text,
            }) as ChatCompletionMessage
        )
      );
    }

    // Add current prompt
    messages.push({ role: "user", content: prompt });

    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages as any,
      stream: true,
      temperature: 0.7,
      max_tokens: 150,
      frequency_penalty: 1.8,
      presence_penalty: 0,
    });

    let buffer = "";
    let pendingWord = "";
    let isInWord = false;
    const isWordChar = (char: string) => /[a-zA-Z0-9'-]/.test(char);
    const isBreakChar = (char: string) => /[\s.,!?;:)\]})"]/.test(char);

    for await (const part of stream) {
      const content = part.choices[0]?.delta?.content || "";

      for (const char of content) {
        if (isWordChar(char)) {
          pendingWord += char;
          isInWord = true;
        } else {
          if (isInWord) {
            // Complete word found, add it to buffer
            buffer += pendingWord;
            pendingWord = "";
            isInWord = false;
          }
          buffer += char;

          // If we hit a break character, send the buffer
          if (isBreakChar(char)) {
            res.write(`data: ${buffer}\n\n`);
            buffer = "";
          }
        }
      }
    }

    // Send any remaining content
    if (pendingWord) {
      buffer += pendingWord;
    }
    if (buffer) {
      res.write(`data: ${buffer}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Error streaming GPT response:", error.message);
    res.status(500).json({ error: "Failed to stream GPT response" });
  }
}
