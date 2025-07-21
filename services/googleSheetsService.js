const { google } = require('googleapis');
const auth = require('../config/googleAuth');
require('dotenv').config();

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function getSheetData() {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Songs!A2:G',
  });
  return res.data.values;
}

async function writeSheetData(data) {
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'Songs!A2',
    valueInputOption: 'RAW',
    resource: {
      values: data,
    },
  });
}

module.exports = {
  getSheetData,
  writeSheetData
};
