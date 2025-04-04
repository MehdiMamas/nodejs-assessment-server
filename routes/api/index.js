const express = require("express");
const {
  triggerCall,
  returningCall,
  handleCall,
  handleUnanswered,
} = require("../../controllers/callController");
const { getCallLogs } = require("../../controllers/logController");

const router = express.Router();

router.post("/call", triggerCall);
router.post("/receiving-call", returningCall);
router.post("/handle-call", handleCall);
router.post("/unanswered", handleUnanswered);
router.get("/logs", getCallLogs);

module.exports = router;
