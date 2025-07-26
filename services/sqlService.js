const { sql, poolPromise } = require('../config/db');

async function getAllSongs() {
  const pool = await poolPromise;
  const result = await pool.request().query('SELECT * FROM Songs');
  return result.recordset;
}

async function deleteDuplicateSongs() {
  const pool = await poolPromise;
  await pool.request().query(`
    WITH CTE AS (
      SELECT *, 
             ROW_NUMBER() OVER (PARTITION BY SongID ORDER BY DateAdded DESC) AS rn
      FROM Songs
    )
    DELETE FROM CTE WHERE rn > 1;
  `);
}

async function insertOrUpdateSong(song) {
  const pool = await poolPromise;
  await pool.request()
    .input('SongID', sql.Int, song.SongID)
    .input('Title', sql.NVarChar, song.Title)
    .input('Artist', sql.NVarChar, song.Artist)
    .input('Album', sql.NVarChar, song.Album)
    .input('PlaylistName', sql.NVarChar, song.PlaylistName)
    .input('IsDownloaded', sql.NVarChar, song.IsDownloaded)
    .input('DateAdded', sql.DateTime, new Date(song.DateAdded))
    .query(`
      MERGE Songs AS target
      USING (SELECT @SongID AS SongID) AS source
      ON (target.SongID = source.SongID)
      WHEN MATCHED THEN 
        UPDATE SET Title=@Title, Artist=@Artist, Album=@Album,
                   PlaylistName=@PlaylistName, IsDownloaded=@IsDownloaded, DateAdded=@DateAdded
      WHEN NOT MATCHED THEN
        INSERT (SongID, Title, Artist, Album, PlaylistName, IsDownloaded, DateAdded)
        VALUES (@SongID, @Title, @Artist, @Album, @PlaylistName, @IsDownloaded, @DateAdded);
    `);
}

module.exports = {
  getAllSongs,
  insertOrUpdateSong,
  deleteDuplicateSongs
};
