const axios = require("axios");

const transcribeRecording = async (recordingUrl) => {
  try {
    const response = await axios.post(
      "https://api.deepgram.com/v1/listen",
      { url: recordingUrl },
      {
        headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
      }
    );
    return response.data.results.channels[0].alternatives[0].transcript;
  } catch (error) {
    console.error("Error transcribing recording:", error);
    throw error;
  }
};

module.exports = { transcribeRecording };
