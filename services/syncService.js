import { sql, poolPromise } from "../config/db.js";
import {
  auth,
  writeSheetData,
  clearSheetData,
  SPREADSHEET_ID,
  SHEET_NAME,
} from "./googleSheetsService.js";
import { getSheetClient } from "./googleSheetsService.js";

// Helper: Parse dates safely
function parseDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

export async function syncFromGoogleToSQL(spreadsheetId, sheetName) {
  try {
    const sheets = await getSheetClient();
     const range = `${sheetName}!A1:G`;
       console.log("🔍 Syncing sheet range:", range);
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range,
        });

    const rows = res.data.values;
    if (!rows || rows.length === 0) {
    console.log("No data found in Google Sheet.");
    return;
  }
    const pool = await poolPromise;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[1]) {
        console.log(`Skipping row ${i} - Empty Title`);
        continue;
      }

      const SongID = row[0] && !isNaN(row[0]) ? parseInt(row[0]) : null;
      const Title = row[1];
      const Artist = row[2] || "";
      const Album = row[3] || "";
      const PlaylistName = row[4] || "";
      const IsDownloaded = row[5] || "No";
      const DateAdded = parseDate(row[6]) || new Date();

      console.log(`Processing row ${i}:`, {
        SongID,
        Title,
        Artist,
        Album,
        PlaylistName,
        IsDownloaded,
        DateAdded,
      });

      const request = pool
        .request()
        .input("Title", sql.NVarChar, Title)
        .input("Artist", sql.NVarChar, Artist)
        .input("Album", sql.NVarChar, Album)
        .input("PlaylistName", sql.NVarChar, PlaylistName)
        .input("IsDownloaded", sql.NVarChar, IsDownloaded)
        .input("DateAdded", sql.DateTime, DateAdded);

      let query;

      if (SongID !== null) {
        request.input("SongID", sql.Int, SongID);

        query = `
          MERGE Songs AS Target
          USING (SELECT @SongID AS SongID) AS Source
          ON Target.SongID = Source.SongID
          WHEN MATCHED THEN
            UPDATE SET Title = @Title, Artist = @Artist, Album = @Album,
                       PlaylistName = @PlaylistName, IsDownloaded = @IsDownloaded,
                       DateAdded = @DateAdded;
        `;
      } else {
        query = `
          INSERT INTO Songs (Title, Artist, Album, PlaylistName, IsDownloaded, DateAdded)
          VALUES (@Title, @Artist, @Album, @PlaylistName, @IsDownloaded, @DateAdded);
        `;
      }
      console.log("Executing SQL query:", query);
      debugger;
      await request.query(query);
    }

    console.log("✅ Synced from Google Sheet to SQL Server:", rows.length);
  } catch (err) {
    console.error("❌ Error syncing from Google to SQL:", err);
    throw err;
  }
}

export async function syncFromSQLToGoogle() {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT * FROM Songs ORDER BY SongID");

    const rows = result.recordset.map((song) => [
      song.SongID,
      song.Title,
      song.Artist,
      song.Album,
      song.PlaylistName,
      song.IsDownloaded,
      song.DateAdded ? new Date(song.DateAdded).toISOString() : "",
    ]);

    const shouldClearFirst = true; // or false, based on your current need

    if (shouldClearFirst) {
      await clearSheetData(); // clears all but header
    }

    await writeSheetData(rows); // inserts only cleaned and deduped rows

    console.log("✅ Synced from SQL Server to Google Sheet");
  } catch (err) {
    console.error("❌ Error syncing from SQL to Google:", err);
    throw err;
  }
}

export async function clearSheet() {
  try {
    await clearSheetData();
  } catch (error) {
    console.error("❌ Error clearing sheet:", error);
    return { error: "Failed to clear sheet." };
  }
}

