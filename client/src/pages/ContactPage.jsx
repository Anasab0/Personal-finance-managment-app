import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  const contacts = [
    { icon: "✉️", label: "Email", value: "hello@spendly.co.uk" },
    { icon: "💬", label: "Live Chat", value: "Available 9am-6pm GMT" },
    { icon: "📍", label: "Office", value: "London, United Kingdom" },
  ];

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Get in Touch</h1>
        <p className="text-sm text-gray-400">Have a question or feedback? We'd love to hear from you.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">

        {/* Contact info */}
        <div className="flex flex-col gap-3">
          {contacts.map((c) => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-base shrink-0">
                {c.icon}
              </div>
              <div>
                <p className="text-xs text-gray-400">{c.label}</p>
                <p className="text-sm text-gray-700 font-medium">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          {sent ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-3xl">✅</p>
              <p className="text-sm font-semibold text-gray-800">Message sent!</p>
              <p className="text-xs text-gray-400">We'll get back to you as soon as possible.</p>
              <button
                onClick={() => setSent(false)}
                className="mt-2 text-xs text-indigo-600 hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="How can we help?"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us more..."
                  required
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}