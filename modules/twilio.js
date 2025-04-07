const twilio = require("twilio");

const createTwilioClient = () => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
};

const client = createTwilioClient();
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const makeCall = async (to, twiml) => {
  try {
    console.log(`Making call to: ${to}`);
    return client.calls.create({
      to,
      from: TWILIO_PHONE_NUMBER,
      twiml,
      machineDetection: "Enable",
      statusCallback: `${process.env.NGROK_URL}/api/call-completed-callback`,
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["completed"],
    });
  } catch (error) {
    console.error("Error making call:", error.message);
    throw new Error("Failed to make call");
  }
};

const sendSms = async (to, body) => {
  try {
    console.log(`Sending SMS to: ${to}, Body: ${body}`);
    return client.messages.create({
      to,
      from: TWILIO_PHONE_NUMBER,
      body,
    });
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    throw new Error("Failed to send SMS");
  }
};

module.exports = { createTwilioClient, makeCall, sendSms };
