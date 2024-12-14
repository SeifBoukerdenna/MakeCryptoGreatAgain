// api/tts.ts

import { VercelRequest, VercelResponse } from "@vercel/node";

// Utility function to handle CORS preflight requests
function handleOptions(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*"); // 🔒 In production, replace "*" with your frontend URL for better security
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(200).end();
    return true;
  }
  return false;
}

// Utility function to ensure the request method is POST
function ensurePostMethod(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method !== "POST") {
    res.setHeader("Access-Control-Allow-Origin", "*"); // 🔒 In production, replace "*" with your frontend URL for better security
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (handleOptions(req, res)) return;

  // Ensure the request method is POST
  if (!ensurePostMethod(req, res)) return;

  const { text, voice } = req.body || {};

  // Validate the 'text' parameter
  if (!text || typeof text !== "string") {
    res.setHeader("Access-Control-Allow-Origin", "*"); // 🔒 In production, replace "*" with your frontend URL for better security
    return res.status(400).json({ error: "Missing or invalid text parameter" });
  }

  // Retrieve API credentials from environment variables
  // const authToken = process.env.PLAY_SECRET_KEY; // Correct variable name
  // const userId = process.env.PLAY_USER_ID;

  // Validate API credentials
  // if (!authToken || !userId) {
  //   console.error(
  //     `Missing API credentials: authToken=${authToken}, userId=${userId}`
  //   );
  //   // res.setHeader("Access-Control-Allow-Origin", "*"); // 🔒 In production, replace "*" with your frontend URL for better security
  //   return res.status(200).json({ error: "Server configuration error" });
  // }

  // Set a default voice if none is provided
  const chosenVoice =
    typeof voice === "string" && voice.trim()
      ? voice.trim()
      : "s3://voice-cloning-zero-shot/9f6080a2-c6c6-4a5a-a101-17b354087b68/original/manifest.json";

  try {
    // Make the TTS request to Play.ht
    const playResponse = await fetch("https://play.ht/api/v2/tts/stream", {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        AUTHORIZATION: "198f8a8d41b641848ba289bee9418a2d",
        "X-USER-ID": "PLBxqtHtEvhmn4gSNdzcUX35yZu1",
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
      res.setHeader("Access-Control-Allow-Origin", "*"); // 🔒 In production, replace "*" with your frontend URL for better security
      return res
        .status(playResponse.status)
        .json({ error: errorText || "Failed to generate TTS" });
    }

    // Get the audio data as an ArrayBuffer
    const buffer = await playResponse.arrayBuffer();

    // Convert the buffer to a Base64 string
    const base64Data = Buffer.from(buffer).toString("base64");

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*"); // 🔒 In production, replace "*" with your frontend URL for better security
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Return the base64 audio data inside JSON
    return res.status(200).json({ audioBase64: base64Data });
  } catch (error) {
    console.error("Error calling Play.ht API:", error);
    res.setHeader("Access-Control-Allow-Origin", "*"); // 🔒 In production, replace "*" with your frontend URL for better security
    return res.status(500).json({ error: "Internal server error" });
  }
}
