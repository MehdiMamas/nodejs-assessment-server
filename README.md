# Server

This repository contains the backend code for the Medication Reminder System.

## Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/MehdiMamas/nodejs-assessment-server
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
     PORT=<desired-port>

     DB_HOST=localhost
     DB_USER=user
     DB_PASSWORD=userpass1
     DB_NAME=myapp
     ```

4. Start the server:

   ```bash
   npm start
   ```

5. Expose your local server using Ngrok:

   ```bash
   ngrok http <port || 5000>
   ```

   - Copy the Ngrok URL and configure it in your Twilio webhook settings.

6. Set up MySQL and phpMyAdmin using Docker:

   - **Run Docker Compose**:

     - Ensure Docker is installed and running on your system.
     - Navigate to the project directory and run:
       ```bash
       docker-compose up -d
       ```
     - This will start MySQL and phpMyAdmin containers.

   - **Access phpMyAdmin**:

     - Open your browser and navigate to `http://localhost:9000`.
     - Use your MySQL credentials to log in (as specified in the `docker-compose.yml` file).

   - **Initialize the Database**:
     - The `init.sql` file will automatically set up the database and tables when the MySQL container starts.

## Notes

- Ensure the `.env` file is properly configured with your API keys.
- Use Ngrok to expose your local server for Twilio webhooks.
- For unanswered calls, the system will attempt to leave a voicemail or send an SMS.
- The system uses ElevenLabs for TTS and Deepgram for STT.

## New Features

- **Call Logs**: The system now stores call logs in the database, including:

  - Phone number
  - Call SID
  - Call status
  - Recording URL
  - Transcription (via Deepgram)

- **API Endpoints**:
  - `POST /api/call`: Trigger a call.
  - `GET /api/logs`: Fetch call logs.
