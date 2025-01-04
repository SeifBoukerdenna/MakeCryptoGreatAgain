// /api/tts.ts

import { VercelRequest, VercelResponse } from "@vercel/node";
import { Readable } from "stream";
import voices from "../src/configs/voices.json";

function getRandomAuthTokenUser() {
  const randomIndex = Math.floor(Math.random() * authTokenUserArray.length);
  return authTokenUserArray[randomIndex];
}

const authTokenUserArray: { authToken: string; userId: string }[] = [
  {
    authToken: "62f273499fb640c9b8d21143113c050e",
    userId: "uzAqHZENYEWkspDZZayOrHAhe1a2",
  },
  {
    authToken: "198f8a8d41b641848ba289bee9418a2d",
    userId: "PLBxqtHtEvhmn4gSNdzcUX35yZu1",
  },
  {
    authToken: "9c1624056d284ee4b32e92a4895b71d4",
    userId: "RzncyNlk5hYgmUYUPauL64oi5Pz1",
  },
  {
    authToken: "539ef4bd114440c5930da2ed59bcad0a",
    userId: "wiP17EkJNZVcY2dPlqSLCNkei8B2",
  },
  {
    authToken: "a21edf131f004f7a967ffa1c055ff694",
    userId: "8nwNpiCL9fhyrbQBuNjNF7r3dvJ2",
  },
];

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

  const { authToken, userId } = getRandomAuthTokenUser();

  console.log("authToken", authToken);
  console.log("userId", userId);
  console.log("---------------------------------");

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
    const playResponse = await fetch("https://play.ht/api/v2/tts/stream", {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        Authorization: authToken,
        "X-User-ID": userId,
      },
      body: JSON.stringify({
        text: text.trim(),
        voice: chosenVoice,
        output_format: "mp3",
        voice_engine: "Play3.0-mini",
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
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    return res.status(500).json({ error: "Internal server error from tts" });
  }
}

/*

authToken 198f8a8d41b641848ba289bee9418a2d
userId PLBxqtHtEvhmn4gSNdzcUX35yZu1
---------------------------------

authToken a21edf131f004f7a967ffa1c055ff694
userId 8nwNpiCL9fhyrbQBuNjNF7r3dvJ2
---------------------------------


authToken 62f273499fb640c9b8d21143113c050e
userId uzAqHZENYEWkspDZZayOrHAhe1a2
---------------------------------






*/
