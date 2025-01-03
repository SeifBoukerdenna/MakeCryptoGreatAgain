import axios from "axios";
import routes from "../configs/routes.json";

const PLAYHT_USER_ID = import.meta.env.VITE_Play_UserId;
const PLAYHT_SECRET_KEY = import.meta.env.VITE_Play_Secret_Key;

const authToken = "uzAqHZENYEWkspDZZayOrHAhe1a2"; // Ensure this is set
const userId = "62f273499fb640c9b8d21143113c050e"; // Ensure this is set

export async function convertTextToSpeech(text: string): Promise<string> {
  const options = {
    headers: {
      accept: "application/json",
      Authorization: authToken, // Correct casing
      "X-User-ID": userId,
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await axios.post(
      routes.playHT.convert,
      {
        content: [text],
        // voice: "donald_trump_gwsyn",
        title: "Trump Response",
      },
      options
    );

    return response.data.audioUrl;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
