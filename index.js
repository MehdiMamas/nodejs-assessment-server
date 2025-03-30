require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  DEEPGRAM_API_KEY,
  ELEVENLABS_API_KEY,
} = process.env;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Endpoint to trigger a call
app.post("/api/call", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: "Phone number is required." });
  }

  try {
    const ttsResponse = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech",
      {
        text: "Hello, this is a reminder from your healthcare provider to confirm your medications for the day. Please confirm if you have taken your Aspirin, Cardivol, and Metformin today.",
      },
      {
        headers: { Authorization: `Bearer ${ELEVENLABS_API_KEY}` },
      }
    );

    const call = await client.calls.create({
      to: phoneNumber,
      from: TWILIO_PHONE_NUMBER,
      twiml: `<Response><Play>${ttsResponse.data.audio_url}</Play></Response>`,
    });

    console.log(`Call SID: ${call.sid}`);
    console.log(`Call Status: ${call.status}`);
    res.json({ message: "Call triggered successfully!", callSid: call.sid });
  } catch (error) {
    console.error("Error triggering call:", error);
    res.status(500).json({ message: "Failed to trigger call." });
  }
});

// Webhook to handle incoming calls
app.post("/api/webhook", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say(
    "Hello, this is a reminder from your healthcare provider to confirm your medications for the day. Please confirm if you have taken your Aspirin, Cardivol, and Metformin today."
  );
  res.type("text/xml");
  res.send(twiml.toString());
});

// Webhook to handle unanswered calls
app.post("/api/unanswered", async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    await client.messages.create({
      to: phoneNumber,
      from: TWILIO_PHONE_NUMBER,
      body: "We called to check on your medication but couldn't reach you. Please call us back or take your medications if you haven't done so.",
    });

    console.log("SMS sent to:", phoneNumber);
    res.json({ message: "SMS sent successfully!" });
  } catch (error) {
    console.error("Error sending SMS:", error);
    res.status(500).json({ message: "Failed to send SMS." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
