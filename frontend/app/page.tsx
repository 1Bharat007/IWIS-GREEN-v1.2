import Link from "next/link";

export default function Home() {
  return (
    <div className="relative overflow-hidden w-full max-w-full">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-gradient-to-b from-emerald-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto pt-32 pb-24 text-center space-y-10 px-4 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Tackling India's 62M Tonne Waste Crisis
        </div>

        <h1 className="text-6xl md:text-8xl font-bold tracking-tight animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          Intelligent <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 bg-clip-text text-transparent">
            Waste Management
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          A Next-Generation AI & IoT Ecosystem accelerating India’s Net Zero 2070 Mission through gamified carbon accounting and computer vision.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <Link
            href="/scan"
            className="group relative px-8 py-4 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/40 hover:-translate-y-1"
          >
            <span className="flex items-center justify-center gap-2">
              Launch AI Scanner
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="px-8 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm hover:-translate-y-1"
          >
            View Dashboard
          </Link>
        </div>
      </div>

      {/* Real-world Impact Grid */}
      <div className="max-w-6xl mx-auto px-4 py-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Technology</h2>
          <p className="text-neutral-500 max-w-2xl mx-auto">Built to solve real-world problems at scale, from the individual household to city-level administration.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: "📸",
              title: "Computer Vision AI",
              color: "from-emerald-500 to-teal-400",
              desc: "Instant multi-class classification determining organic, plastic, metal & glass composition with confidence scores."
            },
            {
              icon: "🌱",
              title: "Scope 3 Accounting",
              color: "from-blue-500 to-cyan-400",
              desc: "Calculate avoided CO₂ emissions per batch, aligning with India's NDC commitments and BRSR reporting."
            },
            {
              icon: "♻️",
              title: "Circular Marketplace",
              color: "from-amber-500 to-orange-400",
              desc: "Connects users to MRF operators directly to create a transparent, zero-waste reverse supply chain."
            },
            {
              icon: "🗺️",
              title: "Geospatial Heatmaps",
              color: "from-purple-500 to-indigo-400",
              desc: "City-level simulation tracking illegal dumping hotspots to optimize dispatch routes and interventions."
            },
            {
              icon: "🏆",
              title: "Gamified Incentives",
              color: "from-rose-500 to-pink-400",
              desc: "Dynamic Leaderboards and 'Green Points' drive long-term community behavioral changes."
            },
            {
              icon: "🤖",
              title: "EcoBot Assistant",
              color: "from-sky-500 to-blue-400",
              desc: "24/7 intelligent LLM chatbot trained on local waste management policies and segregation guidelines."
            }
          ].map((feature, i) => (
            <div key={i} className="group relative p-8 rounded-3xl bg-white dark:bg-[#1E293B] border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fadeIn" style={{ animationDelay: \`\${0.4 + i * 0.1}s\` }}>
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity rounded-3xl" />
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-2xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
