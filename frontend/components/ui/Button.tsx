export default function Button({
  children,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition text-white font-medium"
    >
      {children}
    </button>
  );
}
