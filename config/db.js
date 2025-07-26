const sql = require('mssql');

const config = {
  user: 'sankar',
  password: 'Its,15@09',
  server: 'localhost',
  port: 1433, // Or whatever your SQL Server is listening on
  database: 'MusicLibrary',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ SQL Server connected');
    return pool;
  })
  .catch(err => {
    console.error('❌ SQL Server connection failed', err);
    throw err;
  });

module.exports = { sql, poolPromise };
