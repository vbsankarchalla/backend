import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import express from 'express';
import router from './routes/syncRoutes.js';
import { getSheetClient } from "./services/googleSheetsService.js";

const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SHEET_NAME || "Songs";
console.log("✅ ENV LOADED:", spreadsheetId, sheetName);

// Now pass spreadsheetId and sheetName as needed
const sheets = await getSheetClient(); // returns authenticated client
await syncFromGoogleToSQL(spreadsheetId, sheetName);

const app = express();
app.use(express.json());
app.use('/api/sync', router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
