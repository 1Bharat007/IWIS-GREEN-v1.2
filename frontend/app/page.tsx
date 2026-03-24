import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto py-24 text-center space-y-12">
      <div className="space-y-6">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent pb-2">
          India Waste Intelligence System
        </h1>

        <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed">
          A Next-Generation AI, IoT & Digital Twin Enabled Waste Management Ecosystem accelerating India’s Net Zero 2070 Mission.
        </p>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <Link
          href="/scan"
          className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20"
        >
          AI Waste Scanner
        </Link>

        <Link
          href="/dashboard"
          className="px-8 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition shadow-sm"
        >
          View Dashboard
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 text-left">
        <div className="p-6 bg-white dark:bg-[#1E293B] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center mb-4">
            <span className="text-2xl">📸</span>
          </div>
          <h3 className="font-semibold text-lg mb-2">AI Classification</h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Instant Multi-class AI Waste Scanner determining organic, plastic, metal & glass composition.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-[#1E293B] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center mb-4">
            <span className="text-2xl">🌱</span>
          </div>
          <h3 className="font-semibold text-lg mb-2">Carbon Accounting</h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Calculate avoided emissions (kg CO₂e) per batch, aligning with India's NDC commitments.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-[#1E293B] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center mb-4">
            <span className="text-2xl">♻️</span>
          </div>
          <h3 className="font-semibold text-lg mb-2">Circular Recycler Market</h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Connects users to MRF operators and recyclers to create a zero-waste reverse supply chain.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-[#1E293B] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="font-semibold text-lg mb-2">Digital Twin Integration</h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            City-level geospatial simulation to direct interventions, routing, and pinpoint hotspot vulnerabilities.
          </p>
        </div>
      </div>
    </div>
  );
}
