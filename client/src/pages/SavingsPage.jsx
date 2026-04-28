import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const icons = ["🎯", "🛡️", "✈️", "💻", "🏠", "🚗", "🎓", "💰"];

export default function SavingsPage() {
  const { getToken } = useAuth();
  const [goals, setGoals] = useState([]);
  const [contributions, setContributions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [contributeError, setContributeError] = useState("");
  const [form, setForm] = useState({ name: "", target_amount: "", deadline: "", icon: "🎯" });
  const [contributeForm, setContributeForm] = useState({ amount: "", note: "" });
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };

      // Fetch goals, transactions and categories in parallel
      const [goalsRes, txRes, catRes] = await Promise.all([
        fetch("http://localhost:5000/goals", { headers }),
        fetch("http://localhost:5000/transactions", { headers }),
        fetch("http://localhost:5000/categories", { headers }),
      ]);

      const goalsData = await goalsRes.json();
      const txData = await txRes.json();
      const catData = await catRes.json();

      // Calculate balance
      const bal = txData.reduce((sum, t) => {
        const cat = catData.find((c) => c.id === t.category_id);
        return cat?.type === "income" ? sum + t.amount : sum - t.amount;
      }, 0);
      setBalance(bal);
      setGoals(goalsData);

      // Fetch contributions for each goal
      const contribMap = {};
      await Promise.all(
        goalsData.map(async (goal) => {
          const res = await fetch(`http://localhost:5000/goals/${goal.id}/contributions`, { headers });
          const data = await res.json();
          contribMap[goal.id] = data;
        })
      );
      setContributions(contribMap);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const getGoalSaved = (goalId) => {
    return (contributions[goalId] || []).reduce((sum, c) => sum + c.amount, 0);
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: form.name,
          target_amount: parseFloat(form.target_amount),
          deadline: form.deadline || null,
          icon: form.icon,
        }),
      });
      if (res.ok) {
        const newGoal = await res.json();
        setGoals((prev) => [
          { id: newGoal.id, ...form, target_amount: parseFloat(form.target_amount), status: "active" },
          ...prev,
        ]);
        setContributions((prev) => ({ ...prev, [newGoal.id]: [] }));
        setForm({ name: "", target_amount: "", deadline: "", icon: "🎯" });
        setShowModal(false);
      }
    } catch (err) {
      console.error("Failed to add goal", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setContributeError("");
    try {
      const res = await fetch(`http://localhost:5000/goals/${selectedGoal.id}/contribute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          amount: parseFloat(contributeForm.amount),
          note: contributeForm.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setContributeError(data.error);
      } else {
        // Update contributions and balance
        const today = new Date().toISOString().split("T")[0];
        setContributions((prev) => ({
          ...prev,
          [selectedGoal.id]: [
            { amount: parseFloat(contributeForm.amount), date: today },
            ...(prev[selectedGoal.id] || []),
          ],
        }));
        setBalance((prev) => prev - parseFloat(contributeForm.amount));
        setContributeForm({ amount: "", note: "" });
        setShowContributeModal(false);
        setSelectedGoal(null);
      }
    } catch (err) {
      console.error("Failed to contribute", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/goals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      console.error("Failed to delete goal", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 mb-1">Savings Goals</h1>
          <p className="text-sm text-gray-400">
            {goals.length === 0
              ? "Create your first savings goal to get started"
              : `You have ${goals.length} active goal${goals.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Balance: <span className="font-medium text-gray-700">£{balance.toFixed(2)}</span></span>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Goal
          </button>
        </div>
      </div>

      {/* Goals */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-sm text-gray-400">No savings goals yet. Click "New Goal" to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {goals.map((goal) => {
            const saved = getGoalSaved(goal.id);
            const percent = Math.min((saved / goal.target_amount) * 100, 100);
            return (
              <div key={goal.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">
                      {goal.icon || "🎯"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{goal.name}</p>
                      {goal.deadline && <p className="text-xs text-gray-400">Due {goal.deadline}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-xs"
                  >✕</button>
                </div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-400">Progress</span>
                    <span className="text-xs text-gray-400">£{saved.toFixed(2)} / £{parseFloat(goal.target_amount).toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <p className="text-xs text-gray-400">{percent.toFixed(0)}% complete</p>
                    {percent >= 100 && <p className="text-xs text-green-500 font-medium">🎉 Goal reached!</p>}
                  </div>
                </div>

                {/* Add money button */}
                {percent < 100 && (
                  <button
                    onClick={() => { setSelectedGoal(goal); setShowContributeModal(true); setContributeError(""); }}
                    className="mt-4 w-full py-2 rounded-lg border border-indigo-200 text-indigo-600 text-xs font-medium hover:bg-indigo-50 transition-colors"
                  >
                    + Add Money
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      {showModal && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.35)" }} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm mx-4">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-semibold text-gray-800">Create Savings Goal</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>
            <p className="text-sm text-gray-400 mb-6">Set a target and start saving</p>

            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Goal Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Holiday Fund"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Target Amount (£)</label>
                <input
                  type="number"
                  value={form.target_amount}
                  onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
                  placeholder="e.g. 5000"
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Deadline (optional)</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-colors ${
                        form.icon === icon ? "bg-indigo-100 ring-2 ring-indigo-400" : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors mt-2"
              >
                {submitting ? "Creating..." : "Create Goal"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContributeModal && selectedGoal && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.35)" }} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm mx-4">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-semibold text-gray-800">Add Money</h2>
              <button onClick={() => { setShowContributeModal(false); setContributeError(""); }} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>
            <p className="text-sm text-gray-400 mb-1">Contributing to: <span className="font-medium text-gray-600">{selectedGoal.icon} {selectedGoal.name}</span></p>
            <p className="text-sm text-gray-400 mb-6">Available balance: <span className="font-medium text-gray-600">£{balance.toFixed(2)}</span></p>

            {contributeError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                {contributeError}
              </div>
            )}

            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Amount (£)</label>
                <input
                  type="number"
                  value={contributeForm.amount}
                  onChange={(e) => setContributeForm({ ...contributeForm, amount: e.target.value })}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Note (optional)</label>
                <input
                  type="text"
                  value={contributeForm.note}
                  onChange={(e) => setContributeForm({ ...contributeForm, note: e.target.value })}
                  placeholder="e.g. Monthly savings"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowContributeModal(false); setContributeError(""); }}
                  className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {submitting ? "Saving..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}