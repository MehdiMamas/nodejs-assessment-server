const { PromisifiedQuery } = require("../modules/db");
const { createTwilioClient, makeCall, sendSms } = require("../modules/twilio");
const { transcribeRecording } = require("../modules/deepgram");
const { generateTtsAudio } = require("../modules/elevenlabs");

const { NGROK_URL } = process.env;

const client = createTwilioClient();

const triggerCall = async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: "Phone number is required." });
  }

  try {
    const audioUrl = await generateTtsAudio(
      "Hello, this is a reminder from your healthcare provider to confirm your medications for the day. Please confirm if you have taken your Aspirin, Cardivol, and Metformin today."
    );

    const call = await makeCall(
      client,
      phoneNumber,
      `<Response><Play>${audioUrl}</Play></Response>`,
      `${NGROK_URL}/api/handle-call`
    );

    console.log(`Call SID: ${call.sid}`);
    console.log(`Call Status: ${call.status}`);

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
  const { CallSid, CallStatus, RecordingUrl, AnsweredBy } = req.body;

  try {
    if (
      CallStatus === "no-answer" ||
      (AnsweredBy && AnsweredBy.startsWith("machine"))
    ) {
      // Leave a voicemail
      const voicemailTwiml = `
        <Response>
          <Say>
            Hello, this is a reminder from your healthcare provider. We couldn't reach you, but please confirm if you have taken your Aspirin, Cardivol, and Metformin today. Thank you.
          </Say>
        </Response>
      `;

      await makeCall(
        client,
        process.env.TWILIO_PHONE_NUMBER,
        process.env.TWILIO_PHONE_NUMBER,
        voicemailTwiml
      );

      console.log("Voicemail left for:", CallSid);
    } else if (RecordingUrl) {
      // Transcribe the recording
      const transcript = await transcribeRecording(RecordingUrl);

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
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error handling call:", error);
    res.sendStatus(500);
  }
};

const handleUnanswered = async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    await sendSms(
      client,
      phoneNumber,
      "We called to check on your medication but couldn't reach you. Please call us back to confirm that you have taken your medication."
    );

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
