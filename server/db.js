const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./finance.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.serialize(() => {

  // Users
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

  // Categories
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
      icon TEXT,
      colour TEXT
    )
  `);

  // Budget periods
  db.run(`
    CREATE TABLE IF NOT EXISTS budget_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL
    )
  `);

  // Recurring rules
  db.run(`
    CREATE TABLE IF NOT EXISTS recurring_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER,
      interval TEXT NOT NULL CHECK(interval IN ('daily', 'weekly', 'monthly')),
      amount REAL NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      note TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Transactions
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER,
      recurring_rule_id INTEGER,
      amount REAL NOT NULL,
      date DATE NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (recurring_rule_id) REFERENCES recurring_rules(id)
    )
  `);

  // Budgets
  db.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      period_id INTEGER NOT NULL,
      limit_amount REAL NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (period_id) REFERENCES budget_periods(id)
    )
  `);

  // Goals
  db.run(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      deadline DATE,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Goal contributions
  db.run(`
    CREATE TABLE IF NOT EXISTS goal_contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER NOT NULL,
      transaction_id INTEGER,
      amount REAL NOT NULL,
      date DATE NOT NULL,
      note TEXT,
      FOREIGN KEY (goal_id) REFERENCES goals(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    )
  `);

  // Bills
  db.run(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      due_day INTEGER NOT NULL,
      frequency TEXT DEFAULT 'monthly' CHECK(frequency IN ('monthly', 'quarterly', 'yearly')),
      next_due_date DATE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Bill payments
  db.run(`
    CREATE TABLE IF NOT EXISTS bill_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      transaction_id INTEGER NOT NULL,
      paid_date DATE NOT NULL,
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    )
  `);

});

module.exports = db;