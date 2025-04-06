const { ElevenLabsClient } = require("elevenlabs");

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const generateTtsAudio = async (text) => {
  try {
    return await client.textToSpeech.convert("9BWtsMINqrJLrRacOk9x", {
      text,
      model_id: "eleven_multilingual_v2",
      output_format: "wav",
    });
  } catch (error) {
    console.error("Error generating TTS audio:", error);
    throw error;
  }
};

module.exports = { generateTtsAudio };
