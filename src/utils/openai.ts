// src/utils/openai.ts
import axios from "axios";
import prompt from "../configs/prompt.json";
import routes from "../configs/routes.json";

const OPENAI_API_URL = routes.openAI.completion;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function getTrumpResponseFromOpenAI(
  userMessage: string
): Promise<string> {
  const systemPrompt = prompt.systemPrompt.trump.prompt;
  const response = await axios.post(
    OPENAI_API_URL,
    {
      model: "gpt-4", // or gpt-4 if you have access
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.9,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  // Extract the assistant's reply text
  const completion =
    response.data?.choices?.[0]?.message?.content ||
    "Sorry, I couldn't generate a response.";
  return completion;
}
