import axios from "axios";

const PLAYHT_API_URL = "https://play.ht/api/v1/convert";
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
      PLAYHT_API_URL,
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
