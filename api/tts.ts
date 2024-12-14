import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const playResponse = await fetch("https://play.ht/api/v2/tts/stream", {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        AUTHORIZATION: "198f8a8d41b641848ba289bee9418a2d",
        "X-USER-ID": "PLBxqtHtEvhmn4gSNdzcUX35yZu1",
      },
      body: JSON.stringify({
        text: "Hello sir",
        voice:
          "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json",
      }),
    });

    if (!playResponse.ok) {
      const errorText = await playResponse.text();
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res
        .status(playResponse.status)
        .json({ error: errorText || "Failed to generate TTS" });
    }

    // Get the audio data as an ArrayBuffer
    const buffer = await playResponse.arrayBuffer();

    // Convert the buffer to a Base64 string
    const base64Data = Buffer.from(buffer).toString("base64");

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Return the base64 audio data inside JSON
    return res.status(200).json({ audioBase64: base64Data });
  } catch (error) {
    console.error("Error calling Play.ht API:", error);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: "Internal server error" });
  }
}
