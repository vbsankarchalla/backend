const express = require("express");
const bodyParser = require("body-parser");
const syncRoutes = require("./routes/syncRoutes");
require("dotenv").config();

const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
app.use("/api/sync", syncRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
