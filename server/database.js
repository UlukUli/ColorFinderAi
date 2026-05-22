const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./db.sqlite");

db.serialize(() => {

db.run(`
CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT UNIQUE,
password TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS palettes (
id INTEGER PRIMARY KEY AUTOINCREMENT,
userId INTEGER,
name TEXT,
colors TEXT,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(userId)
REFERENCES users(id)
)
`);

});

module.exports = db;