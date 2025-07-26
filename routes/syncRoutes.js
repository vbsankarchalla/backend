const express = require("express");
const router = express.Router();
const {
  syncFromGoogleToSQL,
  syncFromSQLToGoogle,
} = require("../services/syncService");

// POST: Sync from Google Sheet ➜ SQL Server
router.post("/from-sheet", async (req, res) => {
  try {
    await syncFromGoogleToSQL();
    res.status(200).json({ message: "✅ Synced Google Sheet ➜ SQL Server" });
  } catch (err) {
    console.error("❌ Sync from sheet failed:", err);
    res
      .status(500)
      .json({ error: "Sync from Google Sheet failed: " + err.message });
  }
});

// POST: Sync from SQL Server ➜ Google Sheet
router.post("/to-sheet", async (req, res) => {
  try {
    await syncFromSQLToGoogle();
    res.status(200).json({ message: "✅ Synced SQL Server ➜ Google Sheet" });
  } catch (err) {
    console.error("❌ Sync to sheet failed:", err);
    res
      .status(500)
      .json({ error: "Sync to Google Sheet failed: " + err.message });
  }
});

// GET: Trigger sync from Google Sheet ➜ SQL Server (for testing in browser)
router.get("/from-sheet", async (req, res) => {
  try {
    await syncFromGoogleToSQL();
    res.send("✅ Synced Google Sheet ➜ SQL Server");
  } catch (err) {
    console.error("❌ Sync from sheet failed:", err);
    res.status(500).send("❌ Sync from Google Sheet failed: " + err.message);
  }
});

// GET: Trigger sync from SQL Server ➜ Google Sheet (for testing in browser)
router.get("/to-sheet", async (req, res) => {
  try {
    await syncFromSQLToGoogle();
    res.send("✅ Synced SQL Server ➜ Google Sheet");
  } catch (err) {
    console.error("❌ Sync to sheet failed:", err);
    res.status(500).send("❌ Sync to Google Sheet failed: " + err.message);
  }
});

module.exports = router;
