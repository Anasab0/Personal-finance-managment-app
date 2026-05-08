import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";

// ─── Colour palette for categories ───────────────────────────────────────────
const CAT_COLOURS = [
  "#6366f1", // indigo
  "#fb7185", // rose
  "#10b981", // emerald
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#a78bfa", // violet
  "#f97316", // orange
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

// ─── Monthly bar + savings line chart ─────────────────────────────────────────
function MonthlyChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.offsetWidth;
    const H   = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 16, right: 16, bottom: 28, left: 44 };
    const cW  = W - pad.left - pad.right;
    const cH  = H - pad.top  - pad.bottom;

    const allVals = data.flatMap((d) => [d.income, d.expenses]);
    const maxVal  = Math.max(...allVals) * 1.15 || 100;

    const xOf  = (i) => pad.left + (i + 0.5) * (cW / data.length);
    const yOf  = (v) => pad.top  + cH - (v / maxVal) * cH;
    const barW = Math.min((cW / data.length) * 0.22, 14);

    ctx.clearRect(0, 0, W, H);

    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const v = (maxVal / ticks) * i;
      const y = yOf(v);
      ctx.strokeStyle = "#f3f4f6";
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cW, y);
      ctx.stroke();
      ctx.fillStyle  = "#d1d5db";
      ctx.font       = "9px system-ui";
      ctx.textAlign  = "right";
      const label = v >= 1000 ? `£${(v / 1000).toFixed(0)}k` : `£${Math.round(v)}`;
      ctx.fillText(label, pad.left - 6, y + 3);
    }

    const baseY = yOf(0);

    data.forEach((d, i) => {
      const x = xOf(i) - barW - 1.5;
      const y = yOf(d.income);
      ctx.fillStyle = "#6366f1";
      ctx.beginPath();
      ctx.roundRect(x, y, barW, baseY - y, [2, 2, 0, 0]);
      ctx.fill();
    });

    data.forEach((d, i) => {
      const x = xOf(i) + 1.5;
      const y = yOf(d.expenses);
      ctx.fillStyle = "#fb7185";
      ctx.beginPath();
      ctx.roundRect(x, y, barW, baseY - y, [2, 2, 0, 0]);
      ctx.fill();
    });

    const savPts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.income - d.expenses) }));
    ctx.beginPath();
    ctx.moveTo(savPts[0].x, savPts[0].y);
    for (let i = 1; i < savPts.length; i++) {
      const prev = savPts[i - 1];
      const curr = savPts[i];
      const cpX  = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
    }
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = "round";
    ctx.stroke();

    savPts.forEach(({ x, y }) => {
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981"; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
    });

    ctx.fillStyle  = "#d1d5db";
    ctx.font       = "9px system-ui";
    ctx.textAlign  = "center";
    data.forEach((d, i) => {
      ctx.fillText(d.month, xOf(i), H - pad.bottom + 14);
    });
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Monthly income vs expenses bar chart"
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

// ─── Donut category breakdown chart ──────────────────────────────────────────
function DonutChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.offsetWidth;
    const H   = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    const cx      = W / 2;
    const cy      = H / 2;
    const radius  = Math.min(W, H) / 2 - 8;
    const inner   = radius * 0.58; // donut hole
    const total   = data.reduce((s, d) => s + d.amount, 0);

    let startAngle = -Math.PI / 2;

    data.forEach((d, i) => {
      const slice = (d.amount / total) * 2 * Math.PI;
      const end   = startAngle + slice;

      // Slice
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, end);
      ctx.closePath();
      ctx.fillStyle = CAT_COLOURS[i % CAT_COLOURS.length];
      ctx.fill();

      // Thin white separator
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, end);
      ctx.closePath();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth   = 2;
      ctx.stroke();

      startAngle = end;
    });

    // Cut inner hole
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    // Centre label
    ctx.fillStyle  = "#111827";
    ctx.font       = `600 14px system-ui`;
    ctx.textAlign  = "center";
    ctx.fillText(`£${Math.round(total).toLocaleString()}`, cx, cy + 2);
    ctx.fillStyle  = "#9ca3af";
    ctx.font       = `10px system-ui`;
    ctx.fillText("total", cx, cy + 16);

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Expense breakdown donut chart"
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, getToken } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [monthlyData,  setMonthlyData]  = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${getToken()}` };
        const [txRes, catRes, summaryRes] = await Promise.all([
          fetch("http://localhost:5000/transactions",                 { headers }),
          fetch("http://localhost:5000/categories",                   { headers }),
          fetch("http://localhost:5000/transactions/monthly-summary", { headers }),
        ]);
        setTransactions(await txRes.json());
        setCategories(await catRes.json());
        setMonthlyData(await summaryRes.json());
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

  // Spending grouped by category (for bar rows + donut)
  const spendingByCategory = transactions
    .filter((t) => categories.find((c) => c.id === t.category_id)?.type === "expense")
    .reduce((acc, t) => {
      const cat  = categories.find((c) => c.id === t.category_id);
      const name = cat ? `${cat.icon} ${cat.name}` : "Other";
      acc[name]  = (acc[name] || 0) + t.amount;
      return acc;
    }, {});

  const maxExpense = Math.max(...Object.values(spendingByCategory), 1);

  // Sorted array for donut
  const donutData = Object.entries(spendingByCategory)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  const netSavings  = monthlyData.reduce((s, d) => s + (d.income - d.expenses), 0);
  const avgIncome   = monthlyData.length ? Math.round(monthlyData.reduce((s, d) => s + d.income,   0) / monthlyData.length) : 0;
  const avgExpenses = monthlyData.length ? Math.round(monthlyData.reduce((s, d) => s + d.expenses, 0) / monthlyData.length) : 0;

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
      <div className="grid grid-cols-3 gap-3 mb-5">
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

      {/* ── Monthly Overview ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Monthly overview</h2>
            <p className="text-xs text-gray-400 mt-0.5">Income vs expenses over 6 months</p>
          </div>
          <div className="flex items-center gap-3">
            {[
              { color: "#6366f1", label: "Income"   },
              { color: "#fb7185", label: "Expenses" },
              { color: "#10b981", label: "Savings"  },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {[
            { label: "Avg income",   value: `£${avgIncome.toLocaleString()}`,   color: "" },
            { label: "Avg expenses", value: `£${avgExpenses.toLocaleString()}`, color: "" },
            { label: "Net savings",  value: `${netSavings >= 0 ? "+" : ""}£${Math.round(netSavings).toLocaleString()}`, color: netSavings >= 0 ? "text-emerald-600" : "text-red-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400">{label}</p>
              <p className={`text-sm font-semibold ${color || "text-gray-700"}`}>{value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-10">Loading…</p>
        ) : monthlyData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No data yet — add transactions to see your chart.</p>
        ) : (
          <div style={{ height: 180 }}>
            <MonthlyChart data={monthlyData} />
          </div>
        )}
      </div>

      {/* ── Bottom panels ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">

        {/* ── Category breakdown (donut + legend) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Category breakdown</h2>
          <p className="text-xs text-gray-400 mb-4">Expenses split by category</p>

          {donutData.length === 0 ? (
            <p className="text-sm text-gray-400">No expenses yet.</p>
          ) : (
            <div className="flex items-center gap-5">
              {/* Donut */}
              <div style={{ width: 120, height: 120, flexShrink: 0 }}>
                <DonutChart data={donutData} />
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                {donutData.map((d, i) => {
                  const pct = ((d.amount / donutData.reduce((s, x) => s + x.amount, 0)) * 100).toFixed(1);
                  return (
                    <div key={d.name} className="flex items-center gap-2">
                      <span
                        style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLOURS[i % CAT_COLOURS.length], flexShrink: 0 }}
                      />
                      <span className="text-xs text-gray-500 truncate flex-1">{d.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">{pct}%</span>
                      <span className="text-xs font-medium text-gray-600 shrink-0 w-14 text-right">
                        £{d.amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
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