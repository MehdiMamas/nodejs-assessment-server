const { PromisifiedQuery } = require("../modules/db");
const { makeCall, sendSms } = require("../modules/twilio");
const { transcribeWithDeepgram } = require("../modules/deepgram");
const { generateTtsAudio } = require("../modules/elevenlabs");
const fs = require("fs");
const twilio = require("twilio");

const path = require("path");
const { Readable } = require("stream");

const { NGROK_URL, TWILIO_AUTH_TOKEN, TWILIO_ACCOUNT_SID } = process.env;

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
      phoneNumber,
      `<Response>
      
        <Play>${process.env.NGROK_URL + "/audios/" + audioUrl}</Play>
        <Record maxLength="10" 
          recordingStatusCallback="${
            process.env.NGROK_URL
          }/api/recording-status"
          recordingStatusCallbackMethod="POST" recordingStatusCallbackEvent="completed" playBeep="true" trim="trim-silence" />
      </Response>`
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
const handleRecordingStatus = async (req, res) => {
  const recordingUrl = req.body.RecordingUrl;
  const callSid = req.body.CallSid;

  if (!recordingUrl) return res.sendStatus(400);

  try {
    // Save the recording URL to a temporary file
    const tempFilePath = path.join(__dirname, "../temp", `${callSid}.mp3`);
    const writer = fs.createWriteStream(tempFilePath);

    const response = await fetch(`${recordingUrl}.mp3`, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const stream = Readable.fromWeb(response.body);
    stream.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Transcribe the recording using the temporary file
    const transcript = await transcribeWithDeepgram(tempFilePath);
    console.log("📝 Transcript:", transcript);

    // Update the call log with the transcript
    await PromisifiedQuery(
      "UPDATE call_logs SET transcript = :transcript,recording_url= :recording_url, status='completed' WHERE call_sid = :callSid",
      { callSid, transcript, recording_url: `${recordingUrl}.mp3` }
    );

    // Delete the temporary file after transcription
    fs.unlinkSync(tempFilePath);

    res.sendStatus(200);
  } catch (err) {
    console.error("Deepgram error:", err.message);
    res.sendStatus(500);
  }
};

const returningCall = async (req, res) => {
  const { From: phoneNumber, CallSid } = req.body;

  try {
    // Look up the last unanswered call for the calling number
    const [lastLog] = await PromisifiedQuery(
      "SELECT * FROM call_logs WHERE phone_number = :phoneNumber AND status = 'unanswered' ORDER BY created_at DESC LIMIT 1",
      { phoneNumber }
    );

    if (!lastLog) {
      return res
        .status(404)
        .send("No unanswered call log found for this number.");
    }

    const twiml = new twilio.twiml.VoiceResponse();

    let audioUrl = await generateTtsAudio(
      "Thank you for returning our call. This is a reminder to confirm your medications for the day. Please confirm if you have taken your Aspirin, Cardivol, and Metformin today."
    );
    twiml.play(`${process.env.NGROK_URL}/audios/${audioUrl}`);

    // Add a Record action to capture the user's response
    twiml.record({
      maxLength: 10,
      action: `${process.env.NGROK_URL}/api/recording-status`,
      method: "POST",
      playBeep: true,
      trim: "trim-silence",
    });

    // Insert a new call log with status "unanswered" and the new call SID
    await PromisifiedQuery(
      "INSERT INTO call_logs (phone_number, call_sid, status) VALUES (:phoneNumber, :callSid, :status)",
      {
        phoneNumber,
        callSid: CallSid,
        status: "unanswered",
      }
    );

    res.type("text/xml");
    res.send(twiml.toString());
  } catch (error) {
    console.error("Error handling returning call:", error);
    res.status(500).send("Failed to handle returning call.");
  }
};

module.exports = {
  triggerCall,
  returningCall,
  handleRecordingStatus,
};
