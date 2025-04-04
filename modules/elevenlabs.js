const axios = require("axios");

const generateTtsAudio = async (text) => {
  try {
    const response = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech",
      { text },
      {
        headers: { Authorization: `Bearer ${process.env.ELEVENLABS_API_KEY}` },
      }
    );
    return response.data.audio_url;
  } catch (error) {
    console.error("Error generating TTS audio:", error);
    throw error;
  }
};

module.exports = { generateTtsAudio };
