import { VercelRequest, VercelResponse } from "@vercel/node";
import { Readable } from "stream";
import voices from "../src/configs/voices.json";
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { text, voice } = req.body;

  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "Invalid text parameter" });
    return;
  }

  const authToken = "198f8a8d41b641848ba289bee9418a2d";
  const userId = "PLBxqtHtEvhmn4gSNdzcUX35yZu1";

  if (!authToken || !userId) {
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  try {
    const playResponse = await fetch("https://play.ht/api/v2/tts/stream", {
      // Replace with the correct Play.ht streaming endpoint if different
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
        "X-User-ID": userId,
      },
      body: JSON.stringify({
        text,
        voice: voices.trump.voice,
        output_format: "mp3",
        voice_engine: "Play3.0-mini",
      }),
    });

    if (!playResponse.ok) {
      const errorText = await playResponse.text();
      res
        .status(playResponse.status)
        .json({ error: errorText || "Failed to generate TTS" });
      return;
    }

    res.setHeader("Content-Type", "audio/mpeg");

    if (playResponse.body) {
      // Convert web ReadableStream to Node.js Readable stream
      const nodeStream = Readable.fromWeb(playResponse.body as any);

      // Pipe the Node.js stream to the response
      nodeStream.pipe(res);

      // Optional: Handle stream errors
      nodeStream.on("error", (err) => {
        console.error("Stream error:", err);
        res.end(); // Ensure the response is closed on error
      });
    } else {
      res.status(500).json({ error: "No audio stream received" });
    }
  } catch (error: any) {
    console.error("Error streaming TTS:", error.message);
    res.status(500).json({ error: "Internal server error fromm stream-tts" });
  }
}
