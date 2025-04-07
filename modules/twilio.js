const twilio = require("twilio");

const createTwilioClient = () => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
};
const client = createTwilioClient();
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const makeCall = async (to, twiml) => {
  try {
    return client.calls.create({
      to,
      from: TWILIO_PHONE_NUMBER,
      twiml,
      machineDetection: "Enable",
    });
  } catch (error) {
    console.error("Error making call:", error);
    throw error;
  }
};

const sendSms = async (to, body) => {
  try {
    return await client.messages.create({
      to,
      from: TWILIO_PHONE_NUMBER,
      body,
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
};

module.exports = { createTwilioClient, makeCall, sendSms };
