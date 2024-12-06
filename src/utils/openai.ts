// src/utils/openai.ts
import axios from "axios";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function getTrumpResponseFromOpenAI(
  userMessage: string
): Promise<string> {
  const systemPrompt =
    "You are Donald Trump. Respond to the user as if you are Donald Trump, with a confident, boastful tone and referencing American greatness.";

  const response = await axios.post(
    OPENAI_API_URL,
    {
      model: "gpt-3.5-turbo", // or gpt-4 if you have access
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
