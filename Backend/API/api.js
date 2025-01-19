const express = require("express");
const app = express();
app.use(express.json())

const animalRoutes = require('./routes/animals');
const imageRoutes = require('./routes/images');

const port = 8000;

app.use("/api/animals", animalRoutes);
app.use("/api/images", imageRoutes);

app.listen(port, (err) => {
  if (err) console.log(`Error: ${err}`);
  console.log(`Server is running on port ${port}`);
})