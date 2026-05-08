import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const EMOJI_OPTIONS = [
  "🏷️","🍔","🚗","🛍️","🏠","💊","🎮","✈️","📚","🎵",
  "⚡","🐾","💪","🎁","🍕","☕","🛒","🎬","🌿","💻",
  "📱","🏋️","🎯","🏦","💰","💼","🎓","❤️","🌟","🔧",
];

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

  const [showNewCat, setShowNewCat] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", type: "expense", icon: "🏷️" });
  const [newCatError, setNewCatError] = useState("");
  const [savingCat, setSavingCat] = useState(false);

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
        setShowNewCat(false);
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

  const handleCreateCategory = async () => {
    if (!newCat.name.trim()) { setNewCatError("Please enter a category name."); return; }
    setSavingCat(true);
    setNewCatError("");
    try {
      const res = await fetch("http://localhost:5000/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name: newCat.name.trim(), type: newCat.type, icon: newCat.icon }),
      });
      if (!res.ok) {
        const data = await res.json();
        setNewCatError(data.error || "Failed to create category.");
        return;
      }
      const created = await res.json();
      setCategories((prev) => [...prev, created]);
      setForm((prev) => ({ ...prev, category_id: String(created.id) }));
      setNewCat({ name: "", type: "expense", icon: "🏷️" });
      setShowNewCat(false);
    } catch (err) {
      setNewCatError("Something went wrong.");
    } finally {
      setSavingCat(false);
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

  const closeModal = () => {
    setShowModal(false);
    setShowNewCat(false);
    setNewCat({ name: "", type: "expense", icon: "🏷️" });
    setNewCatError("");
    setForm({ category_id: "", amount: "", date: "", note: "" });
  };

  return (
    <div className="max-w-4xl mx-auto">

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

      {showModal && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.35)" }} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm mx-4 max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Add transaction</h2>
            <p className="text-sm text-gray-400 mb-6">Record a new income or expense</p>

            <form onSubmit={handleAddTransaction} className="space-y-4">

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  required={!showNewCat}
                  disabled={showNewCat}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition disabled:opacity-50"
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

                {!showNewCat ? (
                  <button
                    type="button"
                    onClick={() => { setShowNewCat(true); setNewCatError(""); }}
                    className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                  >
                    + Create new category
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setShowNewCat(false); setNewCatError(""); }}
                    className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕ Cancel new category
                  </button>
                )}
              </div>

              {showNewCat && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 space-y-3">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">New category</p>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                    <input
                      type="text"
                      value={newCat.name}
                      onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                      placeholder="e.g. Gym, Pet Care, Freelance..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                    <div className="flex gap-2">
                      {["expense", "income"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNewCat({ ...newCat, type: t })}
                          className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors capitalize ${
                            newCat.type === t
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Icon  <span className="text-base">{newCat.icon}</span>
                    </label>
                    <div className="grid grid-cols-10 gap-1 p-2 bg-white rounded-lg border border-gray-200 max-h-20 overflow-y-auto">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewCat({ ...newCat, icon: emoji })}
                          className={`text-base p-0.5 rounded hover:bg-indigo-100 transition-colors ${
                            newCat.icon === emoji ? "bg-indigo-100 ring-2 ring-indigo-400" : ""
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {newCatError && <p className="text-xs text-red-500">{newCatError}</p>}

                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={savingCat}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {savingCat ? "Creating..." : "Create & select category"}
                  </button>
                </div>
              )}

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
                  onClick={closeModal}
                  className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || showNewCat}
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