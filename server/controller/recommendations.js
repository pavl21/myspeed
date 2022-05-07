const db = require('../index').database;

// Gets the current recommendations
module.exports.get = () => {
    return db.prepare("SELECT * FROM recommendations").get();
}

// Sets new recommendations
module.exports.set = (ping, download, upload) => {
    if (this.get() === undefined) {
        return db.prepare("INSERT INTO recommendations (ping, download, upload) VALUES (?, ?, ?)").run(ping, download, upload);
    } else {
        return db.prepare("UPDATE recommendations SET ping = ?, download = ?, upload = ?").run(ping, download, upload);
    }
}