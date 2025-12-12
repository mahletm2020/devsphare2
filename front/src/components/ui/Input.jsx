export default function Input({
  id,
  label,
  type = 'text',
  className = '',
  ...props
}) {
  return (
    <div className={`relative w-full ${className}`}>
      <input
        id={id}
        type={type}
        placeholder=" "
        className="peer w-full rounded-xl border border-[#E9E9E9] bg-white px-3 pt-4 pb-1 text-sm text-[#1A1A1A] focus:border-[#00D4D4] focus:outline-none focus:ring-1 focus:ring-[#00D4D4]"
        {...props}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#009C9C]"
      >
        {label}
      </label>
    </div>
  );
}




