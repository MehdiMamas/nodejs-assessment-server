const { PromisifiedQuery } = require("../modules/db");

const getCallLogs = async (req, res) => {
  try {
    const logs = await PromisifiedQuery(
      "SELECT * FROM call_logs ORDER BY created_at DESC"
    );
    res.json(logs);
  } catch (error) {
    console.error("Error fetching call logs:", error);
    res.status(500).json({ message: "Failed to fetch call logs." });
  }
};

module.exports = { getCallLogs };
