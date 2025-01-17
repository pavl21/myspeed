const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.port || 5216;

if (!fs.existsSync("data")) {
    try {
        fs.mkdirSync("data", {recursive: true});
    } catch (e) {
        console.error("Could not create the data folder. Please check the permission");
        process.exit(0);
    }
}

let db;
try {
    db = require('better-sqlite3')('data/storage.db');
    console.log("Successfully connected to the database file");
} catch (e) {
    console.error("Could not open the database file. Maybe it is damaged?");
    process.exit();
}

module.exports.database = db;

let interval = setInterval(async () => require('./tasks/speedtest').create(), 3600000); // run a speedtest every 1 hour
let removeInterval = setInterval(async () => require('./tasks/speedtest').removeOld(), 60000);

// Create all tables & insert the defaults
require("./controller/tables").create();
require("./controller/tables").insert();

// Register middlewares
app.use(express.json());
app.use("/api/*", require('./middlewares/password'));

// Register routes
app.use("/api/config", require('./routes/config'));
app.use("/api/speedtests", require('./routes/speedtests'));
app.use("/api/info", require('./routes/system'));
app.use("/api/recommendations", require('./routes/recommendations'));
app.use("/api*", (req, res) => res.status(404).json({message: "Route not found"}));

// Enable production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../build')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../build', 'index.html'));
    });
}

// Make a speedtest
require('./tasks/speedtest').create();

app.listen(port, () => console.log(`Server listening on port ${port}`));