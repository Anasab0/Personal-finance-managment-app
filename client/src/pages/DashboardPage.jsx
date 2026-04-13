import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("http://localhost:5000/transactions", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        setTransactions(data);
      } catch (err) {
        console.error("Failed to fetch transactions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const categories = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.title] = (acc[t.title] || 0) + t.amount;
      return acc;
    }, {});

  const maxExpense = Math.max(...Object.values(categories), 1);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Top bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">£</div>
            <span className="text-base font-semibold text-gray-800">Spendly</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            {user?.name} · Sign out
          </button>
        </div>

        {/* Greeting */}
        <h1 className="text-xl font-semibold text-gray-800 mb-1">
          Good morning, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-gray-400 mb-6">Here's your financial summary</p>

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
            {Object.keys(categories).length === 0 ? (
              <p className="text-sm text-gray-400">No expenses yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(categories).map(([name, amount]) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-20 shrink-0 truncate">{name}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(amount / maxExpense) * 100}%` }}
                      />
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
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm text-gray-800">{tx.title}</p>
                      <p className="text-xs text-gray-300">{tx.date}</p>
                    </div>
                    <span className={`text-sm font-medium ${tx.type === "expense" ? "text-red-500" : "text-green-600"}`}>
                      {tx.type === "expense" ? "-" : "+"}£{Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}