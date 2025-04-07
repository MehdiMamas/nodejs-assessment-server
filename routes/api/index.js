const express = require("express");
const {
  triggerCall,
  returningCall,
  handleRecordingStatus,
} = require("../../controllers/callController");
const { getCallLogs } = require("../../controllers/logController");

const router = express.Router();

router.post("/call", triggerCall);
router.post("/receiving-call", returningCall);
router.get("/logs", getCallLogs);
router.post("/recording-status", handleRecordingStatus);

router.post("/status-callback", (req, res) => {
  const answeredBy = req.body.AnsweredBy;

  if (answeredBy && answeredBy.startsWith("machine")) {
    console.log("Voicemail detected. Leaving message...");
    // log or change behavior if needed
  } else {
    console.log("Human answered.");
  }

  res.sendStatus(200);
});

module.exports = router;
