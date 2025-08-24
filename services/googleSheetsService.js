import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

export async function getSheetClient() {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: authClient });
  console.log("✅ Google Sheets client created using service account");
  return sheets;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const keyFile = path.join(__dirname, "../credentials.json");
const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

let SPREADSHEET_ID;
let SHEET_NAME = "Songs";

  export function setSpreadsheetEnv(id, name = "Songs") {
    SPREADSHEET_ID = id;
    SHEET_NAME = name;
  }

console.log("✅ GSS ENV LOADED:", SPREADSHEET_ID, SHEET_NAME);

// export async function getSheetData() {
//   const authClient = await auth.getClient();
//   const sheets = google.sheets({ version: "v4", auth: authClient });

//   console.log("✅ Google Sheets client created using service account");

//   return sheets;
// }

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

  // Step 2: Convert existing rows to Map<SongID, row>
  const existingMap = new Map();
  existingRows.forEach(row => {
    const songId = row[0];
    if (songId) existingMap.set(songId, row);
  });

  // Step 3: Merge sqlRows based on SongID with logging
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const newRow of sqlRows) {
    const newId = newRow[0];
    const existingRow = existingMap.get(newId);

    if (!existingRow) {
      existingMap.set(newId, newRow);
      insertedCount++;
    } else {
      const isDifferent = newRow.some((val, idx) => val !== (existingRow[idx] || ''));
      if (isDifferent) {
        existingMap.set(newId, newRow);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }
  }

  // Step 4: Filter out empty or invalid rows and sort by SongID
  const mergedValues = Array.from(existingMap.values())
    .filter(row => row && row.length > 0 && row[0])
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

  // Step 5: Write data back to sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'RAW',
    resource: {
      values: [headers, ...mergedValues],
    },
  });

  // Step 6: Logging
  console.log('✅ Sheet sync summary:');
  console.log(`  ➕ Inserted rows: ${insertedCount}`);
  console.log(`  ✏️ Updated rows:  ${updatedCount}`);
  console.log(`  ⏭️ Skipped rows:   ${skippedCount}`);
}


export async function clearSheetData() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:G`,
  });

  console.log("🧹 Cleared all data except header.");
}

export { auth,SPREADSHEET_ID, SHEET_NAME };
