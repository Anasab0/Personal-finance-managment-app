const db = require("./db");

const categories = [
  { name: "Food & Dining", type: "expense", icon: "🍔", colour: "#f97316" },
  { name: "Transport", type: "expense", icon: "🚗", colour: "#3b82f6" },
  { name: "Rent", type: "expense", icon: "🏠", colour: "#8b5cf6" },
  { name: "Entertainment", type: "expense", icon: "🎬", colour: "#ec4899" },
  { name: "Shopping", type: "expense", icon: "🛍️", colour: "#14b8a6" },
  { name: "Health", type: "expense", icon: "💊", colour: "#ef4444" },
  { name: "Utilities", type: "expense", icon: "💡", colour: "#f59e0b" },
  { name: "Other Expense", type: "expense", icon: "📦", colour: "#6b7280" },
  { name: "Salary", type: "income", icon: "💼", colour: "#22c55e" },
  { name: "Freelance", type: "income", icon: "💻", colour: "#10b981" },
  { name: "Investment", type: "income", icon: "📈", colour: "#06b6d4" },
  { name: "Other Income", type: "income", icon: "💰", colour: "#84cc16" },
];

db.serialize(() => {
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO categories (name, type, icon, colour) VALUES (?, ?, ?, ?)"
  );
  categories.forEach((cat) => {
    stmt.run(cat.name, cat.type, cat.icon, cat.colour);
  });
  stmt.finalize();
  console.log("Categories seeded successfully!");
});