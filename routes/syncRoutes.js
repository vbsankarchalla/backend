import express from 'express';
import {
  syncFromGoogleToSQL,
  syncFromSQLToGoogle,
  clearSheet,
} from "../services/syncService.js";


const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SHEET_NAME || "Songs";

await syncFromGoogleToSQL(spreadsheetId, sheetName);

const router = express.Router();

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

// Clear Sheet
router.post("/clear", async(req,res) => {
  try {
    await clearSheet();
    res.status(200).json({message: "✅ Cleared sheet"});
  } catch (err) {
    console.error("❌ Clearing sheet failed :"+ err.message);
    res
    .status(500)
    .json({error: "Clearing Google Sheet failed : "+err.message})
  }
}); 

export default router;
