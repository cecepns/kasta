export default function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-clay-700">{label}</span>
      {children}
    </label>
  );
}
