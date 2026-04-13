const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./finance.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    amount REAL,
    type TEXT,
    date TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    currency TEXT DEFAULT 'GBP',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`ALTER TABLE transactions ADD COLUMN user_id INTEGER`, () => {});

module.exports = db;