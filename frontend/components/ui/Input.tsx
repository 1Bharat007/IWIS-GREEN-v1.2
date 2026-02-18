export default function Input({
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: any) => void;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
    />
  );
}
