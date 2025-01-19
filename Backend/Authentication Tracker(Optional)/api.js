// set up express
const express = require("express");
const app = express();

const port = 8000;

app.get('/api/test', (req, res) => {
    return res.status(200).send({
        "worked": true
    })
})

app.listen(port, (err) => {
    if (err) console.log(`Error: ${err}`);
    console.log(`Server is running on port ${port}`);
})