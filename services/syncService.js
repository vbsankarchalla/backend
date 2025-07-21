const { sql, poolPromise } = require('../config/db');
const { getSheetData, writeSheetData } = require('./googleSheetsService');

// Helper: Parse dates safely
function parseDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

async function syncFromGoogleToSQL() {
  try {
    const rows = await getSheetData();
    const pool = await poolPromise;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[1]) continue; // Skip empty titles

      const SongID = row[0] && !isNaN(row[0]) ? parseInt(row[0]) : null;
      const Title = row[1];
      const Artist = row[2] || '';
      const Album = row[3] || '';
      const PlaylistName = row[4] || '';
      const IsDownloaded = row[5] || 'No';
      const DateAdded = parseDate(row[6]) || new Date();

      const request = pool.request()
        .input('Title', sql.NVarChar, Title)
        .input('Artist', sql.NVarChar, Artist)
        .input('Album', sql.NVarChar, Album)
        .input('PlaylistName', sql.NVarChar, PlaylistName)
        .input('IsDownloaded', sql.NVarChar, IsDownloaded)
        .input('DateAdded', sql.DateTime, DateAdded);

      if (SongID !== null) {
        request.input('SongID', sql.Int, SongID);
      } else {
        request.input('SongID', sql.Int, -1); // Use -1 to force INSERT if SongID missing
      }

      await request.query(`
        MERGE Songs AS Target
        USING (SELECT @SongID AS SongID) AS Source
        ON Target.SongID = Source.SongID
        WHEN MATCHED THEN
          UPDATE SET Title = @Title, Artist = @Artist, Album = @Album,
                     PlaylistName = @PlaylistName, IsDownloaded = @IsDownloaded,
                     DateAdded = @DateAdded
        WHEN NOT MATCHED THEN
          INSERT (Title, Artist, Album, PlaylistName, IsDownloaded, DateAdded)
          VALUES (@Title, @Artist, @Album, @PlaylistName, @IsDownloaded, @DateAdded);
      `);
    }

    console.log('✅ Synced from Google Sheet to SQL Server');
  } catch (err) {
    console.error('❌ Error syncing from Google to SQL:', err);
    throw err;
  }
}


async function syncFromSQLToGoogle() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Songs ORDER BY SongID');

    const rows = result.recordset.map(song => [
      song.SongID,
      song.Title,
      song.Artist,
      song.Album,
      song.PlaylistName,
      song.IsDownloaded,
      song.DateAdded ? new Date(song.DateAdded).toISOString() : ''
    ]);

    rows.unshift([
      'SongID',
      'Title',
      'Artist',
      'Album',
      'PlaylistName',
      'IsDownloaded',
      'DateAdded'
    ]);

    await writeSheetData(rows);
    console.log('✅ Synced from SQL Server to Google Sheet');
  } catch (err) {
    console.error('❌ Error syncing from SQL to Google:', err);
    throw err;
  }
}

module.exports = { syncFromGoogleToSQL, syncFromSQLToGoogle };
