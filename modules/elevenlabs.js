const { ElevenLabsClient } = require("elevenlabs");
const { PromisifiedQuery } = require("./db");
const { v4: uuidv4 } = require("uuid"); // Added uuid
const fs = require("fs"); // Added fs
const path = require("path"); // Added path

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const generateTtsAudio = async (text) => {
  try {
    // Check if the text already exists in the database
    const existingVoice = await PromisifiedQuery(
      "SELECT audio_url FROM voices WHERE text = :text",
      { text }
    );

    if (existingVoice.length > 0) {
      // Return the existing audio URL if found
      return existingVoice[0].audio_url;
    }

    // Generate new TTS audio if not found
    const response = await client.textToSpeech.convert("21m00Tcm4TlvDq8ikWAM", {
      text,
      model_id: "eleven_flash_v2_5",
    });

    // Save the audio file in the static/audios folder
    const audioDir = path.join(__dirname, "../static/audios");
    const filename = uuidv4() + ".mp3";
    const writer = fs.createWriteStream(path.join(audioDir, filename));
    response.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        PromisifiedQuery(
          "INSERT INTO voices (text, audio_url) VALUES (:text, :audioUrl)",
          { text, audioUrl: filename }
        );

        resolve(filename);
      });
      writer.on("error", reject);
    });
    // Save the new text and audio URL to the database
  } catch (error) {
    console.error("Error generating TTS audio:", error);
    throw error;
  }
};

module.exports = { generateTtsAudio };
