import 'dotenv/config';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const keyFile = path.join(__dirname, '../credentials.json');

const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Songs';

console.log('✅ Loaded spreadsheet ID from .env:', SPREADSHEET_ID);

export async function getSheetData() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:G`,
  });

  return res.data.values || [];
}

export async function writeSheetData(sqlRows) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const headers = ['SongID', 'Title', 'Artist', 'Album', 'PlaylistName', 'IsDownloaded', 'DateAdded'];

  // Step 1: Read existing data (including header)
  const existingDataRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}`,
  });

  const existingData = existingDataRes.data.values || [];
  const [existingHeader, ...existingRows] = existingData;

  // ✅ Step 2: Filter out rows with empty SongIDs
  const existingMap = new Map();
  existingRows.forEach(row => {
    const songId = row[0]?.trim();
    if (songId) existingMap.set(songId, row);
  });

  // ✅ Step 3: Process SQL rows, skip blank SongIDs
  for (const newRow of sqlRows) {
    const newId = newRow[0]?.toString().trim();
    if (!newId) continue;

    const existingRow = existingMap.get(newId);

    if (!existingRow) {
      // New row to insert
      existingMap.set(newId, newRow);
    } else {
      // Check if row is different
      const isDifferent = newRow.some((val, idx) => val !== (existingRow[idx] || ''));
      if (isDifferent) {
        existingMap.set(newId, newRow);
      }
    }
  }

  // Step 4: Prepare values and write back
  const mergedValues = Array.from(existingMap.values());

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'RAW',
    resource: {
      values: [headers, ...mergedValues],
    },
  });

  console.log('✅ Synced: only unique and updated rows, no duplicates or blank inserts.');
}


export async function clearSheetData() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:G`,
  });

  console.log('🧹 Cleared all data except header.');
}
