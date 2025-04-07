const express = require("express");
const {
  triggerCall,
  returningCall,
  handleRecordingStatus,
  handleCallCompleted,
} = require("../../controllers/callController");
const { getCallLogs } = require("../../controllers/logController");

const router = express.Router();

router.post("/call", triggerCall);
router.post("/receiving-call", returningCall);
router.get("/logs", getCallLogs);
router.post("/recording-status", handleRecordingStatus);

router.post("/call-completed-callback", handleCallCompleted);

module.exports = router;
