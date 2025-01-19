const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

