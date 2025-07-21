const express = require('express');
const router = express.Router();
const { syncFromGoogleToSQL, syncFromSQLToGoogle } = require('../services/syncService');

router.post('/sync/from-sheet', async (req, res) => {
  try {
    await syncFromGoogleToSQL();
    res.send('Synced Google Sheet ➜ SQL Server');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error syncing from Google Sheet');
  }
});

router.post('/sync/to-sheet', async (req, res) => {
  try {
    await syncFromSQLToGoogle();
    res.send('Synced SQL Server ➜ Google Sheet');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error syncing to Google Sheet');
  }
});

router.get('/sync/from-sheet', async (req, res) => {
  try {
    await syncFromGoogleToSQL();
    res.send('Synced Google Sheet ➜ SQL Server');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error syncing from Google Sheet');
  }
});


module.exports = router;
