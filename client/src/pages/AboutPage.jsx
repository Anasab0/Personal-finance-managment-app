export default function AboutPage() {
  const features = [
    { icon: "📊", title: "Expense Tracking", desc: "Automatically categorise and track every penny you spend." },
    { icon: "🐖", title: "Smart Savings", desc: "Set goals and watch your savings grow with visual progress." },
  ];

  return (
    <div className="max-w-2xl mx-auto text-center">

      {/* Header */}
      <div className="mb-10">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">£</div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">About Spendly</h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          Spendly helps you take control of your finances with beautiful, intuitive tools.<br />
          Built for UK residents who want a simple way to budget, save, and invest.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-left">
        {features.map((f) => (
          <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-lg mb-3">
              {f.icon}
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">{f.title}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Our Mission</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          We believe everyone deserves financial clarity. Spendly combines smart technology with beautiful design to make managing your money feel effortless and empowering.
        </p>
      </div>

    </div>
  );
}