export default function BadgeCard({ title }: { title: string }) {
  return (
    <div className="px-5 py-3 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-sm font-medium shadow-sm">
      {title}
    </div>
  );
}
