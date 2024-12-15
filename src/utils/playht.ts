import axios from "axios";
import routes from "../configs/routes.json";

const PLAYHT_USER_ID = import.meta.env.VITE_Play_UserId;
const PLAYHT_SECRET_KEY = import.meta.env.VITE_Play_Secret_Key;

export async function convertTextToSpeech(text: string): Promise<string> {
  const options = {
    headers: {
      accept: "application/json",
      AUTHORIZATION: PLAYHT_SECRET_KEY,
      "X-USER-ID": PLAYHT_USER_ID,
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
