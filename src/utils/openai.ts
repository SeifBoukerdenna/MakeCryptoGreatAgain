import prompt from "../configs/prompt.json";
import routes from "../configs/routes.json";

const OPENAI_API_URL = routes.openAI.completion;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function streamTrumpResponseFromOpenAI(
  userMessage: string,
  onToken: (token: string) => void
): Promise<void> {
  const systemPrompt = prompt.systemPrompt.trump.prompt;

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.9,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API returned an error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No reader found on the response body");
  }

  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((line) => line.trim() !== "");

    for (const line of lines) {
      if (line.startsWith("data:")) {
        const jsonStr = line.replace(/^data:\s*/, "");

        // Handle [DONE]
        if (jsonStr === "[DONE]") {
          return;
        }

        // Only attempt parsing if jsonStr seems like a JSON object
        if (!jsonStr.trim().startsWith("{")) {
          continue;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onToken(content);
          }
        } catch (err) {
          console.error("Error parsing streaming chunk:", err, jsonStr);
        }
      }
    }
  }
}
