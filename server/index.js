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
    if (err) return res.status(500).json(err);
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
      if (err) return res.status(500).json(err);
      res.json({ id: this.lastID });
    }
  );
});

// Delete transaction
app.delete("/transactions/:id", authMiddleware, (req, res) => {
  db.run(
    "DELETE FROM transactions WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ deleted: this.changes });
    }
  );
});

// Get all categories
app.get("/categories", authMiddleware, (req, res) => {
  db.all("SELECT * FROM categories", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// Get all goals for logged in user
app.get("/goals", authMiddleware, (req, res) => {
  db.all("SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json(err);
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
      if (err) return res.status(500).json(err);
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
      if (err) return res.status(500).json(err);
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
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

// Add money to a goal
app.post("/goals/:id/contribute", authMiddleware, (req, res) => {
  const { amount, note } = req.body;
  const userId = req.user.id;
  const goalId = req.params.id;

  // First check if the goal belongs to this user
  db.get("SELECT * FROM goals WHERE id = ? AND user_id = ?", [goalId, userId], (err, goal) => {
    if (err) return res.status(500).json({ error: "Server error." });
    if (!goal) return res.status(404).json({ error: "Goal not found." });

    // Check user's current balance
    db.all("SELECT t.amount, c.type FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.user_id = ?", [userId], (err, txs) => {
      if (err) return res.status(500).json({ error: "Server error." });

      const balance = txs.reduce((sum, t) => {
        return t.type === "income" ? sum + t.amount : sum - t.amount;
      }, 0);

      if (amount > balance) {
        return res.status(400).json({ error: `Insufficient balance. Your current balance is £${balance.toFixed(2)}.` });
      }

      // Find "Other Expense" category id
      db.get("SELECT id FROM categories WHERE name = 'Other Expense'", [], (err, cat) => {
        if (err) return res.status(500).json({ error: "Server error." });

        const today = new Date().toISOString().split("T")[0];

        // Create a transaction for the contribution
        db.run(
          "INSERT INTO transactions (user_id, category_id, amount, date, note) VALUES (?, ?, ?, ?, ?)",
          [userId, cat.id, amount, today, note || `Contribution to ${goal.name}`],
          function (err) {
            if (err) return res.status(500).json({ error: "Server error." });

            const transactionId = this.lastID;

            // Create the goal contribution
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

app.listen(5000, () => console.log("Server running on port 5000"));