# Server

This repository contains the backend code for the Medication Reminder System.

## Instructions

1. Clone the repository:

   ```bash
   git clone <server-repo-url>
   cd server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   - Create a `.env` file in the `server` folder.
   - Add the following variables:
     ```
     TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
     TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
     TWILIO_PHONE_NUMBER=<your-twilio-phone-number>
     DEEPGRAM_API_KEY=<your-deepgram-api-key>
     ELEVENLABS_API_KEY=<your-elevenlabs-api-key>
     ```

4. Start the server:

   ```bash
   npm start
   ```

5. Expose your local server using Ngrok:
   ```bash
   ngrok http 5000
   ```
   - Copy the Ngrok URL and configure it in your Twilio webhook settings.

## Notes

- Ensure the `.env` file is properly configured with your API keys.
- Use Ngrok to expose your local server for Twilio webhooks.
- For unanswered calls, the system will attempt to leave a voicemail or send an SMS.
- The system uses ElevenLabs for TTS and Deepgram for STT.
