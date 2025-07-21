const express = require('express');
const bodyParser = require('body-parser');
const syncRoutes = require('./routes/syncRoutes');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.use('/api', syncRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
