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

app.listen(5000, () => console.log("Server running on port 5000"));