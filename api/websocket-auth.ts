// api/websocket-auth.ts
import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Load your Play.ht credentials from environment variables
  // Set these in your Vercel project settings
  //   const authToken = process.env.PLAYHT_API_KEY;
  //   const userId = process.env.PLAYHT_USER_ID;
  const authToken = "198f8a8d41b641848ba289bee9418a2d"; // Replace with your Play.ht secret key
  const userId = "PLBxqtHtEvhmn4gSNdzcUX35yZu1"; // Replace with your Play.ht user ID

  if (!authToken || !userId) {
    return res
      .status(500)
      .json({ error: "Missing PLAYHT_API_KEY or PLAYHT_USER_ID" });
  }

  try {
    const playResponse = await fetch(
      "https://api.play.ht/api/v4/websocket-auth",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "X-User-Id": userId,
          "Content-Type": "application/json",
        },
      }
    );

    if (!playResponse.ok) {
      const errorText = await playResponse.text();
      return res
        .status(playResponse.status)
        .json({ error: errorText || "Failed to get WebSocket URL" });
    }

    // Pass the data straight through
    const data = await playResponse.json();

    // Optionally set CORS headers if you need local development
    // For production, you may want to set this to your domain
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching WebSocket URL:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
