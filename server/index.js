const express = require("express");
const cors = require("cors");
const db = require("./db");
const authMiddleware = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Get transactions
app.get("/transactions", authMiddleware, (req, res) => {
  db.all("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add transaction
app.post("/transactions", authMiddleware, (req, res) => {
  const { category_id, amount, date, note } = req.body;
  db.run(
    "INSERT INTO transactions (user_id, category_id, amount, date, note) VALUES (?, ?, ?, ?, ?)",
    [req.user.id, category_id, amount, date, note],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Monthly summary for dashboard chart (last 6 months)
app.get("/transactions/monthly-summary", authMiddleware, (req, res) => {
  const query = `
    SELECT
      strftime('%Y-%m', t.date) AS month_key,
      SUM(CASE WHEN c.type = 'income'  THEN t.amount ELSE 0 END) AS income,
      SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END) AS expenses
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
      AND t.date >= date('now', '-5 months', 'start of month')
    GROUP BY month_key
    ORDER BY month_key ASC
  `;
  db.all(query, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map((r) => ({
      month: new Date(r.month_key + "-01").toLocaleString("default", { month: "short" }),
      income: r.income || 0,
      expenses: r.expenses || 0,
    }));
    res.json(formatted);
  });
});

// Delete transaction
app.delete("/transactions/:id", authMiddleware, (req, res) => {
  db.run(
    "DELETE FROM transactions WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    }
  );
});

// Get all categories (global defaults + user's custom ones)
app.get("/categories", authMiddleware, (req, res) => {
  db.all(
    "SELECT * FROM categories WHERE user_id IS NULL OR user_id = ? ORDER BY type, name",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Create a custom category
app.post("/categories", authMiddleware, (req, res) => {
  const { name, type, icon } = req.body;
  if (!name || !type) return res.status(400).json({ error: "Name and type are required." });
  if (!["expense", "income"].includes(type)) return res.status(400).json({ error: "Type must be expense or income." });

  db.run(
    "INSERT INTO categories (name, type, icon, user_id) VALUES (?, ?, ?, ?)",
    [name.trim(), type, icon || "🏷️", req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name: name.trim(), type, icon: icon || "🏷️", user_id: req.user.id });
    }
  );
});

// Rename a custom category (only the owner can rename their own)
app.put("/categories/:id", authMiddleware, (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required." });

  db.get("SELECT * FROM categories WHERE id = ?", [req.params.id], (err, cat) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!cat) return res.status(404).json({ error: "Category not found." });
    if (cat.user_id !== req.user.id) return res.status(403).json({ error: "You can only edit your own categories." });

    db.run(
      "UPDATE categories SET name = ?, icon = ? WHERE id = ?",
      [name.trim(), icon || cat.icon, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updated: this.changes });
      }
    );
  });
});

// Delete a custom category (only the owner can delete their own)
app.delete("/categories/:id", authMiddleware, (req, res) => {
  db.get("SELECT * FROM categories WHERE id = ?", [req.params.id], (err, cat) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!cat) return res.status(404).json({ error: "Category not found." });
    if (cat.user_id !== req.user.id) return res.status(403).json({ error: "You can only delete your own categories." });

    db.run("DELETE FROM categories WHERE id = ?", [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    });
  });
});

// Get all goals for logged in user
app.get("/goals", authMiddleware, (req, res) => {
  db.all("SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a goal
app.post("/goals", authMiddleware, (req, res) => {
  const { name, target_amount, deadline, icon } = req.body;
  db.run(
    "INSERT INTO goals (user_id, name, target_amount, deadline, icon) VALUES (?, ?, ?, ?, ?)",
    [req.user.id, name, target_amount, deadline, icon],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Delete a goal
app.delete("/goals/:id", authMiddleware, (req, res) => {
  db.run(
    "DELETE FROM goals WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    }
  );
});

// Get contributions for a goal
app.get("/goals/:id/contributions", authMiddleware, (req, res) => {
  db.all(
    "SELECT * FROM goal_contributions WHERE goal_id = ? ORDER BY date DESC",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Add money to a goal
app.post("/goals/:id/contribute", authMiddleware, (req, res) => {
  const { amount, note } = req.body;
  const userId = req.user.id;
  const goalId = req.params.id;

  db.get("SELECT * FROM goals WHERE id = ? AND user_id = ?", [goalId, userId], (err, goal) => {
    if (err) return res.status(500).json({ error: "Server error." });
    if (!goal) return res.status(404).json({ error: "Goal not found." });

    db.all("SELECT t.amount, c.type FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.user_id = ?", [userId], (err, txs) => {
      if (err) return res.status(500).json({ error: "Server error." });

      const balance = txs.reduce((sum, t) => {
        return t.type === "income" ? sum + t.amount : sum - t.amount;
      }, 0);

      if (amount > balance) {
        return res.status(400).json({ error: `Insufficient balance. Your current balance is £${balance.toFixed(2)}.` });
      }

      db.get("SELECT id FROM categories WHERE name = 'Other Expense'", [], (err, cat) => {
        if (err) return res.status(500).json({ error: "Server error." });

        const today = new Date().toISOString().split("T")[0];

        db.run(
          "INSERT INTO transactions (user_id, category_id, amount, date, note) VALUES (?, ?, ?, ?, ?)",
          [userId, cat.id, amount, today, note || `Contribution to ${goal.name}`],
          function (err) {
            if (err) return res.status(500).json({ error: "Server error." });

            const transactionId = this.lastID;

            db.run(
              "INSERT INTO goal_contributions (goal_id, transaction_id, amount, date, note) VALUES (?, ?, ?, ?, ?)",
              [goalId, transactionId, amount, today, note || null],
              function (err) {
                if (err) return res.status(500).json({ error: "Server error." });
                res.json({ success: true, contribution_id: this.lastID, transaction_id: transactionId });
              }
            );
          }
        );
      });
    });
  });
});

// get or create a budget_period row for a given month/year
function getOrCreatePeriod(month, year, cb) {
  db.get(
    "SELECT id FROM budget_periods WHERE month = ? AND year = ?",
    [month, year],
    (err, row) => {
      if (err) return cb(err);
      if (row) return cb(null, row.id);
      db.run(
        "INSERT INTO budget_periods (month, year) VALUES (?, ?)",
        [month, year],
        function (err) {
          if (err) return cb(err);
          cb(null, this.lastID);
        }
      );
    }
  );
}
 
// GET /budgets?month=5&year=2026
// Returns every expense category with its budget limit (if set) + actual spend
app.get("/budgets", authMiddleware, (req, res) => {
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year  = parseInt(req.query.year)  || new Date().getFullYear();
 
  getOrCreatePeriod(month, year, (err, periodId) => {
    if (err) return res.status(500).json({ error: err.message });
 
    const sql = `
      SELECT
        c.id          AS category_id,
        c.name        AS category_name,
        c.icon        AS category_icon,
        c.colour      AS category_colour,
        b.id          AS budget_id,
        b.limit_amount,
        COALESCE(
          (SELECT SUM(t.amount)
           FROM transactions t
           WHERE t.user_id     = ?
             AND t.category_id = c.id
             AND strftime('%m', t.date) = printf('%02d', ?)
             AND strftime('%Y', t.date) = ?
          ), 0
        ) AS actual_spend
      FROM categories c
      LEFT JOIN budgets b
        ON b.category_id = c.id
       AND b.user_id     = ?
       AND b.period_id   = ?
      WHERE c.type = 'expense'
      ORDER BY c.name ASC
    `;
 
    db.all(
      sql,
      [req.user.id, month, String(year), req.user.id, periodId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ period: { id: periodId, month, year }, categories: rows });
      }
    );
  });
});
 
// POST /budgets  — create or update a budget limit
// Body: { category_id, limit_amount, month, year }
app.post("/budgets", authMiddleware, (req, res) => {
  const { category_id, limit_amount, month, year } = req.body;
  if (!category_id || !limit_amount || !month || !year) {
    return res.status(400).json({ error: "category_id, limit_amount, month and year are required." });
  }
 
  getOrCreatePeriod(month, year, (err, periodId) => {
    if (err) return res.status(500).json({ error: err.message });
 
    // Upsert: update if exists, insert if not
    db.get(
      "SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND period_id = ?",
      [req.user.id, category_id, periodId],
      (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
 
        if (existing) {
          db.run(
            "UPDATE budgets SET limit_amount = ? WHERE id = ?",
            [limit_amount, existing.id],
            (err) => {
              if (err) return res.status(500).json({ error: err.message });
              res.json({ id: existing.id, updated: true });
            }
          );
        } else {
          db.run(
            "INSERT INTO budgets (user_id, category_id, period_id, limit_amount) VALUES (?, ?, ?, ?)",
            [req.user.id, category_id, periodId, limit_amount],
            function (err) {
              if (err) return res.status(500).json({ error: err.message });
              res.json({ id: this.lastID, updated: false });
            }
          );
        }
      }
    );
  });
});
 
// DELETE /budgets/:id  — remove a budget limit
app.delete("/budgets/:id", authMiddleware, (req, res) => {
  db.run(
    "DELETE FROM budgets WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    }
  );
});

app.listen(5000, () => console.log("Server running on port 5000"));