// api/completions.ts

import { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: "User message is required." });
  }

  const systemPrompt =
    "You are Donald Trump. Respond to the user as if you are Donald Trump, with a confident, boastful tone and referencing American greatness. for debugging purposes keep your answers short (1 sentence)";

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4", // Ensure your API key has access to this model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.9,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const trumpReply =
      response.data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    res.status(200).json({ trumpReply });
  } catch (error) {
    console.error("OpenAI API error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error:
        error.response?.data?.error?.message ||
        "Failed to fetch response from OpenAI.",
    });
  }
}
