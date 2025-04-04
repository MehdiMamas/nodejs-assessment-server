const twilio = require("twilio");
const axios = require("axios");

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  ELEVENLABS_API_KEY,
} = process.env;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const { PromisifiedQuery } = require("../modules/db");

const triggerCall = async (req, res) => {
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
      statusCallback: `${process.env.NGROK_URL}/api/handle-call`,
      statusCallbackEvent: ["completed"],
    });

    console.log(`Call SID: ${call.sid}`);
    console.log(`Call Status: ${call.status}`);

    // Log call details to the database
    await PromisifiedQuery(
      "INSERT INTO call_logs (phone_number, call_sid, status) VALUES (:phoneNumber, :callSid, :status)",
      { phoneNumber, callSid: call.sid, status: call.status }
    );

    res.json({ message: "Call triggered successfully!", callSid: call.sid });
  } catch (error) {
    console.error("Error triggering call:", error);
    res.status(500).json({ message: "Failed to trigger call." });
  }
};

const handleCall = async (req, res) => {
  const { CallSid, CallStatus, RecordingUrl } = req.body;

  try {
    // Use Deepgram to transcribe the recording
    const sttResponse = await axios.post(
      "https://api.deepgram.com/v1/listen",
      { url: RecordingUrl },
      {
        headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
      }
    );

    const transcript =
      sttResponse.data.results.channels[0].alternatives[0].transcript;

    // Update call log with transcription and recording URL
    await PromisifiedQuery(
      "UPDATE call_logs SET status = :status, recording_url = :recordingUrl, transcript = :transcript WHERE call_sid = :callSid",
      {
        status: CallStatus,
        recordingUrl: RecordingUrl,
        transcript,
        callSid: CallSid,
      }
    );

    res.sendStatus(200);
  } catch (error) {
    console.error("Error handling call:", error);
    res.sendStatus(500);
  }
};

const handleUnanswered = async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    await client.messages.create({
      to: phoneNumber,
      from: TWILIO_PHONE_NUMBER,
      body: "We called to check on your medication but couldn't reach you. Please call us back to confirm that you have taken your medication.",
    });

    console.log("SMS sent to:", phoneNumber);
    res.json({ message: "SMS sent successfully!" });
  } catch (error) {
    console.error("Error sending SMS:", error);
    res.status(500).json({ message: "Failed to send SMS." });
  }
};

const returningCall = (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say(
    "Thank you for returning our call. This is a reminder to confirm your medications for the day. Please confirm if you have taken your Aspirin, Cardivol, and Metformin today."
  );
  res.type("text/xml");
  res.send(twiml.toString());
};

module.exports = {
  triggerCall,
  handleCall,
  handleUnanswered,
  returningCall,
};
