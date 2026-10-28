# AGENTS.md

## What it is
Node.js backend for a Medication Reminder System: it places phone calls through Twilio, uses Deepgram for speech-to-text and ElevenLabs for text-to-speech, and stores call logs in MySQL.

## Setup
- `npm install`
- Create a `.env` file with: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY`, `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (see README for how to get each key).
- Database: `docker-compose up -d` starts MySQL 8 and phpMyAdmin; `init.sql` creates the tables on first start.

## Run
- `npm start` (runs `node index.js`). There are no test, lint or build scripts.
- Twilio needs a public URL: expose the port with `ngrok http <port>` and point the Twilio number's incoming-call webhook at `<ngrok-url>/api/receiving-call`.

## Where things live
- `index.js`: server entry point.
- `routes/api/`: API routes (`POST /api/call`, `GET /api/logs`, the Twilio webhook).
- `controllers/`: call and log handlers.
- `modules/`: wrappers for `db`, `deepgram`, `elevenlabs`, `twilio`.
- `middleware/logger.js`: request logging.

## Notes
- No CI is configured. Never commit `.env` or real keys.
- Part of a set: the frontend is MehdiMamas/nodejs-assessment-app, and MehdiMamas/DTxPlus-assessment links both.
