import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category_id: "", amount: "", date: "", note: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${getToken()}` };

        const [txRes, catRes] = await Promise.all([
          fetch("http://localhost:5000/transactions", { headers }),
          fetch("http://localhost:5000/categories", { headers }),
        ]);

        const txData = await txRes.json();
        const catData = await catRes.json();

        setTransactions(txData);
        setCategories(catData);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalIncome = transactions
    .filter((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      return cat?.type === "income";
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      return cat?.type === "expense";
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const spendingByCategory = transactions
    .filter((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      return cat?.type === "expense";
    })
    .reduce((acc, t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      const name = cat ? `${cat.icon} ${cat.name}` : "Other";
      acc[name] = (acc[name] || 0) + t.amount;
      return acc;
    }, {});

  const maxExpense = Math.max(...Object.values(spendingByCategory), 1);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const selectedCategory = categories.find((c) => c.id === parseInt(form.category_id));

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          category_id: parseInt(form.category_id),
          amount: parseFloat(form.amount),
          date: form.date,
          note: form.note,
        }),
      });
      if (res.ok) {
        const newTx = await res.json();
        setTransactions((prev) => [
          { id: newTx.id, category_id: parseInt(form.category_id), amount: parseFloat(form.amount), date: form.date, note: form.note },
          ...prev,
        ]);
        setForm({ category_id: "", amount: "", date: "", note: "" });
        setShowModal(false);
      }
    } catch (err) {
      console.error("Failed to add transaction", err);
    } finally {
      setSubmitting(false);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

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

        {/* Greeting + Add button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 mb-1">
              Good morning, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-gray-400">Here's your financial summary</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Add Transaction
          </button>
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

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Add transaction</h2>
            <p className="text-sm text-gray-400 mb-6">Record a new income or expense</p>

            <form onSubmit={handleAddTransaction} className="space-y-4">

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                >
                  <option value="">Select a category</option>
                  <optgroup label="Expenses">
                    {expenseCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Income">
                    {incomeCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Amount (£)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Note (optional)</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="e.g. Weekly shop"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}