// src/utils/openai.ts

export async function streamGPTResponse(
  prompt: string,
  systemPrompt: string,
  onToken: (token: string) => void
): Promise<void> {
  const response = await fetch(
    `/api/stream-gpt?prompt=${encodeURIComponent(
      prompt
    )}&systemPrompt=${encodeURIComponent(systemPrompt)}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch GPT response");
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  if (!reader) {
    throw new Error("No reader available");
  }

  let previousWasWord = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data:")) {
        const content = line.replace(/^data:\s*/, "");
        if (content === "[DONE]") {
          return;
        }

        // Process the token
        if (content) {
          // Check if current token is a word
          const isWord = /^[a-zA-Z]+$/.test(content.trim());

          // Add space only if both previous and current tokens are words
          if (previousWasWord && isWord && !content.startsWith(" ")) {
            onToken(" ");
          }

          onToken(content);
          previousWasWord = isWord;
        }
      }
    }
  }
}
