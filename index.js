require("dotenv").config({ path: "./.env" });
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("./middleware/logger"); // Import the logger middleware
const apiRoute = require("./routes/api");

const app = express();
app.use(bodyParser.json()); // Use modularized routes
app.use(logger);
// Use modularized routes
app.use("/api", apiRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
