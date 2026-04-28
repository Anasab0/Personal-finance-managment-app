import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const { user, getToken } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${getToken()}` };
        const [txRes, catRes] = await Promise.all([
          fetch("http://localhost:5000/transactions", { headers }),
          fetch("http://localhost:5000/categories", { headers }),
        ]);
        setTransactions(await txRes.json());
        setCategories(await catRes.json());
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalIncome = transactions
    .filter((t) => categories.find((c) => c.id === t.category_id)?.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => categories.find((c) => c.id === t.category_id)?.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const spendingByCategory = transactions
    .filter((t) => categories.find((c) => c.id === t.category_id)?.type === "expense")
    .reduce((acc, t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      const name = cat ? `${cat.icon} ${cat.name}` : "Other";
      acc[name] = (acc[name] || 0) + t.amount;
      return acc;
    }, {});

  const maxExpense = Math.max(...Object.values(spendingByCategory), 1);

  return (
    <div className="max-w-4xl mx-auto">

      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800 mb-1">
          Good morning, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-gray-400">Here's your financial summary</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Total balance</p>
          <p className="text-2xl font-semibold text-gray-800">£{balance.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Total income</p>
          <p className="text-2xl font-semibold text-green-600">£{totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Total expenses</p>
          <p className="text-2xl font-semibold text-red-500">£{totalExpenses.toFixed(2)}</p>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-2 gap-4">

        {/* Spending by category */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Spending by category</h2>
          {Object.keys(spendingByCategory).length === 0 ? (
            <p className="text-sm text-gray-400">No expenses yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(spendingByCategory).map(([name, amount]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-28 shrink-0 truncate">{name}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(amount / maxExpense) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-12 text-right shrink-0">£{amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Recent transactions</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-gray-400">No transactions yet.</p>
          ) : (
            <div className="space-y-1">
              {transactions.slice(0, 5).map((tx) => {
                const cat = categories.find((c) => c.id === tx.category_id);
                return (
                  <div key={tx.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm text-gray-800">{cat ? `${cat.icon} ${cat.name}` : "Unknown"}</p>
                      <p className="text-xs text-gray-300">{tx.date}</p>
                      {tx.note && <p className="text-xs text-gray-400">{tx.note}</p>}
                    </div>
                    <span className={`text-sm font-medium ${cat?.type === "expense" ? "text-red-500" : "text-green-600"}`}>
                      {cat?.type === "expense" ? "-" : "+"}£{Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}