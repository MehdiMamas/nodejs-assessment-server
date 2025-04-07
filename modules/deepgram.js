const { createClient } = require("@deepgram/sdk");
const fs = require("fs");
const path = require("path");
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
const client = new createClient(deepgramApiKey);

async function transcribeWithDeepgram(path) {
  const { result, error } = await client.listen.prerecorded.transcribeFile(
    fs.readFileSync(path),
    {
      model: "nova-3",
      smart_format: true,
    }
  );
  if (error) throw error;
  return result.results.channels[0].alternatives[0].transcript;
}

module.exports = { transcribeWithDeepgram };
