export default function Badge({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-[#D9FFFF] px-3 py-1 text-xs font-medium text-[#009C9C] ${className}`}
    >
      {children}
    </span>
  );
}




