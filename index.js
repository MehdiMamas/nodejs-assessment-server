const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const logger = require("./middleware/logger"); // Import the logger middleware
const apiRoute = require("./routes/api");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(logger);

// Serve static files
app.use(express.static(path.join(__dirname, "static")));

// Use modularized routes
app.use("/api", apiRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
