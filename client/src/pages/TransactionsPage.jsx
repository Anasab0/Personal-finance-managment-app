import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function TransactionsPage() {
  const { getToken } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ category_id: "", amount: "", date: "", note: "" });

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

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/transactions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete transaction", err);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  const filteredTransactions = transactions.filter((tx) => {
    const cat = categories.find((c) => c.id === tx.category_id);
    const matchesSearch =
      cat?.name.toLowerCase().includes(search.toLowerCase()) ||
      tx.note?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "income" && cat?.type === "income") ||
      (filter === "expense" && cat?.type === "expense");
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 mb-1">Transactions</h1>
          <p className="text-sm text-gray-400">Track your income and expenses</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Transaction
        </button>
      </div>

      {/* Search and filter */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      {/* Transactions list */}
      <div className="bg-white rounded-2xl border border-gray-100">
        {loading ? (
          <p className="text-sm text-gray-400 p-6">Loading...</p>
        ) : filteredTransactions.length === 0 ? (
          <p className="text-sm text-gray-400 p-6 text-center">
            {transactions.length === 0
              ? "No transactions yet. Click \"Add Transaction\" to get started."
              : "No transactions match your search."}
          </p>
        ) : (
          <div>
            {filteredTransactions.map((tx, index) => {
              const cat = categories.find((c) => c.id === tx.category_id);
              return (
                <div
                  key={tx.id}
                  className={`flex justify-between items-center px-5 py-4 ${
                    index !== filteredTransactions.length - 1 ? "border-b border-gray-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-base">
                      {cat?.icon || "💸"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{cat?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-400">{tx.date}{tx.note ? ` · ${tx.note}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-medium ${cat?.type === "expense" ? "text-red-500" : "text-green-600"}`}>
                      {cat?.type === "expense" ? "-" : "+"}£{Math.abs(tx.amount).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.35)" }} className="fixed inset-0 flex items-center justify-center z-50">
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