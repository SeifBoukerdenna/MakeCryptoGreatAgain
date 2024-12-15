// api/tts.ts

import { VercelRequest, VercelResponse } from "@vercel/node";
import voices from "../src/configs/voices.json";
import routes from "../src/configs/routes.json";
// Handle CORS preflight requests
function handleOptions(
  req: VercelRequest,
  res: VercelResponse,
  allowedOrigin: string
): boolean {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(200).end();
    return true;
  }
  return false;
}

// Ensure the request method is POST
function ensurePostMethod(
  req: VercelRequest,
  res: VercelResponse,
  allowedOrigin: string
): boolean {
  if (req.method !== "POST") {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Retrieve ALLOWED_ORIGIN or set to "*" for development
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";

  // Handle CORS preflight
  if (handleOptions(req, res, allowedOrigin)) return;

  // Ensure the request method is POST
  if (!ensurePostMethod(req, res, allowedOrigin)) return;

  const { text, voice } = req.body || {};

  // Validate the 'text' parameter
  if (!text || typeof text !== "string") {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    return res.status(400).json({ error: "Missing or invalid text parameter" });
  }

  // going to replace this with the actual API credentials
  // **Temporarily Hardcode API Credentials for Testing**
  const authToken = "198f8a8d41b641848ba289bee9418a2d"; // Replace with your Play.ht secret key
  const userId = "PLBxqtHtEvhmn4gSNdzcUX35yZu1"; // Replace with your Play.ht user ID

  // Validate API credentials
  if (!authToken || !userId) {
    console.error(
      `Missing API credentials: authToken=${authToken}, userId=${userId}`
    );
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Set a default voice if none is provided
  const chosenVoice =
    typeof voice === "string" && voice.trim()
      ? voice.trim()
      : voices.trump.voice;

  try {
    // Make the TTS request to Play.ht
    const playResponse = await fetch(routes.playHT.stream, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        Authorization: authToken, // Correct casing
        "X-User-ID": userId,
      },
      body: JSON.stringify({
        text: text.trim(),
        voice: chosenVoice,
        output_format: "mp3",
        voice_engine: "PlayDialog",
      }),
    });

    // Handle non-OK responses
    if (!playResponse.ok) {
      const errorText = await playResponse.text();
      res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      return res
        .status(playResponse.status)
        .json({ error: errorText || "Failed to generate TTS" });
    }

    // Get the audio data as an ArrayBuffer
    const buffer = await playResponse.arrayBuffer();

    // Convert the buffer to a Base64 string
    const base64Data = Buffer.from(buffer).toString("base64");

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Return the base64 audio data inside JSON
    return res.status(200).json({ audioBase64: base64Data });
  } catch (error) {
    console.error("Error calling Play.ht API:", error);
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    return res.status(500).json({ error: "Internal server error" });
  }
}
