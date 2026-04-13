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

// Get transactions for logged in user
app.get("/transactions", authMiddleware, (req, res) => {
  db.all("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// Add transaction for logged in user
app.post("/transactions", authMiddleware, (req, res) => {
  const { title, amount, type, date } = req.body;
  db.run(
    "INSERT INTO transactions (title, amount, type, date, user_id) VALUES (?, ?, ?, ?, ?)",
    [title, amount, type, date, req.user.id],
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

app.listen(5000, () => console.log("Server running on port 5000"));