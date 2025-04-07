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
    console.log("[TRIGGER CALL] Missing phone number in request.");
    return res.status(400).json({ message: "Phone number is required." });
  }

  try {
    console.log(
      `[TRIGGER CALL] Generating TTS audio for phone number: ${phoneNumber}`
    );
    const audioUrl = await generateTtsAudio(
      "Hello, this is a reminder from your healthcare provider to confirm your medications for the day. Please confirm if you have taken your Aspirin, Cardivol, and Metformin today."
    );

    console.log(`[TRIGGER CALL] Initiating call to: ${phoneNumber}`);
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

    console.log(
      `[TRIGGER CALL] Call initiated. SID: ${call.sid}, Status: ${call.status}`
    );
    await PromisifiedQuery(
      "INSERT INTO call_logs (phone_number, call_sid, status) VALUES (:phoneNumber, :callSid, :status)",
      { phoneNumber, callSid: call.sid, status: call.status }
    );

    console.log(
      `[TRIGGER CALL] Call log inserted for phone number: ${phoneNumber}`
    );
    res.json({ message: "Call triggered successfully!", callSid: call.sid });
  } catch (error) {
    console.error("[TRIGGER CALL] Error triggering call:", error);
    res.status(500).json({ message: "Failed to trigger call." });
  }
};

const handleCallCompleted = async (req, res) => {
  const { CallSid, CallStatus, AnsweredBy, To: phone_number } = req.body;

  try {
    console.log(
      `[CALL COMPLETED] Handling call completion for SID: ${CallSid}`
    );
    if (AnsweredBy && AnsweredBy.indexOf("machine") === 0) {
      console.log(
        `[CALL COMPLETED] Call answered by machine. Updating status to "voicemail".`
      );
      await PromisifiedQuery(
        "UPDATE call_logs SET status = 'voicemail' WHERE call_sid = :callSid",
        { callSid: CallSid }
      );
    } else if (AnsweredBy == undefined) {
      console.log(
        `[CALL COMPLETED] Call unanswered. Sending SMS to: ${phone_number}`
      );
      await PromisifiedQuery(
        "UPDATE call_logs SET status = 'sms sent' WHERE call_sid = :callSid",
        { callSid: CallSid }
      );

      await sendSms(
        phone_number,
        "We called to check on your medication but couldn't reach you. Please call us back or take your medications if you haven't done so."
      );
      console.log(`[CALL COMPLETED] SMS sent to: ${phone_number}`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("[CALL COMPLETED] Error handling call completion:", error);
    res.sendStatus(500);
  }
};

const handleRecordingStatus = async (req, res) => {
  const recordingUrl = req.body.RecordingUrl;
  const callSid = req.body.CallSid;

  if (!recordingUrl) {
    console.log("[RECORDING STATUS] Missing recording URL in request.");
    return res.sendStatus(400);
  }

  try {
    console.log(
      `[RECORDING STATUS] Processing recording for Call SID: ${callSid}`
    );
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

    console.log(
      `[RECORDING STATUS] Recording saved locally for transcription.`
    );
    const transcript = await transcribeWithDeepgram(tempFilePath);
    console.log(`[RECORDING STATUS] Transcript generated: ${transcript}`);

    await PromisifiedQuery(
      "UPDATE call_logs SET transcript = :transcript, recording_url = :recording_url, status = 'completed' WHERE call_sid = :callSid",
      { callSid, transcript, recording_url: `${recordingUrl}.mp3` }
    );

    console.log(`[RECORDING STATUS] Call log updated for Call SID: ${callSid}`);
    fs.unlinkSync(tempFilePath);
    console.log(`[RECORDING STATUS] Temporary file deleted: ${tempFilePath}`);

    res.sendStatus(200);
  } catch (err) {
    console.error(
      "[RECORDING STATUS] Error processing recording:",
      err.message
    );
    res.sendStatus(500);
  }
};

const returningCall = async (req, res) => {
  const { From: phoneNumber, CallSid } = req.body;

  try {
    console.log(
      `[RETURNING CALL] Handling returning call from: ${phoneNumber}`
    );
    const [lastLog] = await PromisifiedQuery(
      "SELECT * FROM call_logs WHERE phone_number = :phoneNumber AND (status = 'unanswered' OR status = 'voicemail' OR status = 'sms sent') ORDER BY created_at DESC LIMIT 1",
      { phoneNumber }
    );

    if (!lastLog) {
      console.log(
        `[RETURNING CALL] No unanswered call log found for phone number: ${phoneNumber}`
      );
      return res
        .status(404)
        .send("No unanswered call log found for this number.");
    }

    const twiml = new twilio.twiml.VoiceResponse();
    console.log(`[RETURNING CALL] Generating TTS audio for returning call.`);
    const audioUrl = await generateTtsAudio(
      "Thank you for returning our call. This is a reminder to confirm your medications for the day. Please confirm if you have taken your Aspirin, Cardivol, and Metformin today."
    );
    twiml.play(`${process.env.NGROK_URL}/audios/${audioUrl}`);

    twiml.record({
      maxLength: 10,
      action: `${process.env.NGROK_URL}/api/recording-status`,
      method: "POST",
      playBeep: true,
      trim: "trim-silence",
    });

    console.log(`[RETURNING CALL] Inserting new call log for returning call.`);
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
    console.error("[RETURNING CALL] Error handling returning call:", error);
    res.status(500).send("Failed to handle returning call.");
  }
};

module.exports = {
  triggerCall,
  returningCall,
  handleRecordingStatus,
  handleCallCompleted,
};
