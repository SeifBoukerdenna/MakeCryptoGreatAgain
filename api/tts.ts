import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const text = req.body.text;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing or invalid text parameter" });
  }

  const userId = process.env.PLAY_USER_ID;
  const secretKey = process.env.PLAY_SECRET_KEY;
  if (!userId || !secretKey) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const playResponse = await fetch("https://play.ht/api/v2/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": userId,
        "X-User-Secret": secretKey,
      },
      body: JSON.stringify({
        text: text.trim(),
        voice: "en-US-AshleyNeural", // default voice
      }),
    });

    if (!playResponse.ok) {
      const errorText = await playResponse.text();
      return res
        .status(playResponse.status)
        .json({ error: errorText || "Failed to generate TTS" });
    }

    const data = await playResponse.json();
    // Allow local dev origin for testing
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Methods", "POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error calling Play.ht API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
