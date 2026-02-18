export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-lg transition hover:shadow-emerald-500/10 ${className}`}
    >
      {children}
    </div>
  );
}
