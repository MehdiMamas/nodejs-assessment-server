const twilio = require("twilio");

const createTwilioClient = () => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
};

const makeCall = async (client, to, from, statusCallback) => {
  try {
    return await client.calls.create({
      to,
      from,
      twiml: process.env.TWILIO_PHONE_NUMBER,
      statusCallback,
      statusCallbackEvent: ["completed"],
    });
  } catch (error) {
    console.error("Error making call:", error);
    throw error;
  }
};

const sendSms = async (client, to, body) => {
  try {
    return await client.messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      body,
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
};

module.exports = { createTwilioClient, makeCall, sendSms };
