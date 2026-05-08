import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Small status badge ───────────────────────────────────────────────────────
function StatusBadge({ pct }) {
  if (pct >= 100) return <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Over budget</span>;
  if (pct >= 80)  return <span className="text-xs font-medium text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Near limit</span>;
  return <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">On track</span>;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ pct }) {
  const clamped = Math.min(pct, 100);
  const colour  = pct >= 100 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#6366f1";
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        style={{ width: `${clamped}%`, background: colour, transition: "width 0.4s ease" }}
        className="h-full rounded-full"
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BudgetPage() {
  const { getToken } = useAuth();
  const now = new Date();

  const [month,      setMonth]      = useState(now.getMonth() + 1);
  const [year,       setYear]       = useState(now.getFullYear());
  const [data,       setData]       = useState(null);   // { period, categories }
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // Form state
  const [formCatId,  setFormCatId]  = useState("");
  const [formLimit,  setFormLimit]  = useState("");
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState(null);

  const headers = { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" };

  // ── Fetch budget data ──────────────────────────────────────────────────────
  const fetchBudgets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/budgets?month=${month}&year=${year}`, { headers });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBudgets(); }, [month, year]);

  // ── Save budget ────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!formCatId) return setFormError("Please select a category.");
    const limit = parseFloat(formLimit);
    if (!limit || limit <= 0) return setFormError("Enter a valid amount greater than 0.");

    setSaving(true);
    try {
      const res = await fetch(`${API}/budgets`, {
        method: "POST",
        headers,
        body: JSON.stringify({ category_id: parseInt(formCatId), limit_amount: limit, month, year }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save.");
      setFormCatId("");
      setFormLimit("");
      await fetchBudgets();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Remove budget ──────────────────────────────────────────────────────────
  const handleDelete = async (budgetId) => {
    try {
      await fetch(`${API}/budgets/${budgetId}`, { method: "DELETE", headers });
      await fetchBudgets();
    } catch (e) {
      console.error(e);
    }
  };

  // ── Derived: only categories that have a budget set ───────────────────────
  const budgeted   = data?.categories.filter((c) => c.budget_id)   ?? [];
  const unbudgeted = data?.categories.filter((c) => !c.budget_id)  ?? [];

  const totalLimit  = budgeted.reduce((s, c) => s + c.limit_amount,  0);
  const totalActual = budgeted.reduce((s, c) => s + c.actual_spend,  0);
  const totalPct    = totalLimit > 0 ? (totalActual / totalLimit) * 100 : 0;

  // Years to show in selector
  const years = [year - 1, year, year + 1];

  return (
    <div className="max-w-3xl mx-auto">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800 mb-1">Budget</h1>
        <p className="text-sm text-gray-400">Set monthly spending limits and track your actual spend.</p>
      </div>

      {/* ── Month / year picker ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex items-center gap-3">
        <span className="text-sm text-gray-500 mr-1">Viewing</span>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* ── Set budget form ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Set a budget limit</h2>

        <form onSubmit={handleSave} className="flex items-end gap-3 flex-wrap">
          {/* Category */}
          <div className="flex flex-col gap-1 flex-1 min-w-40">
            <label className="text-xs text-gray-400">Category</label>
            <select
              value={formCatId}
              onChange={(e) => setFormCatId(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">Select category…</option>
              {data?.categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_icon} {c.category_name}
                  {c.budget_id ? " (edit)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Limit */}
          <div className="flex flex-col gap-1 w-36">
            <label className="text-xs text-gray-400">Monthly limit (£)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formLimit}
              onChange={(e) => setFormLimit(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save budget"}
          </button>
        </form>

        {formError && <p className="text-xs text-red-500 mt-2">{formError}</p>}
      </div>

      {/* ── Budget vs actual ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Budget vs actual</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {MONTH_NAMES[month - 1]} {year}
            </p>
          </div>

          {/* Overall summary pill */}
          {budgeted.length > 0 && (
            <div className="bg-gray-50 rounded-xl px-4 py-2 text-right">
              <p className="text-xs text-gray-400">Total spend</p>
              <p className="text-sm font-semibold text-gray-700">
                £{totalActual.toFixed(2)}
                <span className="text-gray-300 font-normal"> / £{totalLimit.toFixed(2)}</span>
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>
        ) : error ? (
          <p className="text-sm text-red-400 py-8 text-center">{error}</p>
        ) : budgeted.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-2xl mb-2">📊</p>
            <p className="text-sm text-gray-500 font-medium">No budgets set yet</p>
            <p className="text-xs text-gray-400 mt-1">Use the form above to add a spending limit for a category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgeted.map((c) => {
              const pct       = c.limit_amount > 0 ? (c.actual_spend / c.limit_amount) * 100 : 0;
              const remaining = c.limit_amount - c.actual_spend;

              return (
                <div key={c.category_id} className="group">
                  {/* Row header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.category_icon}</span>
                      <span className="text-sm text-gray-700 font-medium">{c.category_name}</span>
                      <StatusBadge pct={pct} />
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        £{c.actual_spend.toFixed(2)}
                        <span className="text-gray-300"> / £{c.limit_amount.toFixed(2)}</span>
                      </span>
                      <span className={`text-xs font-medium ${remaining >= 0 ? "text-gray-500" : "text-red-500"}`}>
                        {remaining >= 0 ? `£${remaining.toFixed(2)} left` : `£${Math.abs(remaining).toFixed(2)} over`}
                      </span>
                      {/* Delete button — visible on hover */}
                      <button
                        onClick={() => handleDelete(c.budget_id)}
                        title="Remove budget"
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <ProgressBar pct={pct} />
                </div>
              );
            })}
          </div>
        )}

        {/* Categories with no budget set — subtle hint */}
        {unbudgeted.length > 0 && budgeted.length > 0 && (
          <p className="text-xs text-gray-300 mt-5 text-center">
            {unbudgeted.length} categor{unbudgeted.length === 1 ? "y has" : "ies have"} no budget set yet.
          </p>
        )}
      </div>
    </div>
  );
}