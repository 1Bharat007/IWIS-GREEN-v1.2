export default function Home() {
  return (
    <div className="max-w-5xl mx-auto py-32 text-center space-y-8">

      <h1 className="text-5xl font-semibold tracking-tight">
        Intelligent Waste Intelligence System
      </h1>

      <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
        Scan waste. Track impact. Improve sustainability.
        Simple, precise, powerful.
      </p>

      <div className="flex justify-center gap-6 mt-10">
        <a
          href="/scan"
          className="px-6 py-3 bg-black text-white rounded-xl dark:bg-white dark:text-black"
        >
          Start Scanning
        </a>

        <a
          href="/dashboard"
          className="px-6 py-3 border border-gray-300 rounded-xl"
        >
          View Dashboard
        </a>
      </div>

      <div className="grid md:grid-cols-3 gap-10 mt-20 text-left">
        <div>
          <h3 className="font-semibold text-lg mb-2">AI Classification</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Deterministic image-based waste categorization.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Impact Tracking</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Real-time CO₂ impact calculations.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Sustainability Growth</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Build eco habits with measurable data.
          </p>
        </div>
      </div>
    </div>
  );
}
