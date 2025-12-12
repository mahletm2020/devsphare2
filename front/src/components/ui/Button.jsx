export default function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary:
      'bg-[#00D4D4] text-white hover:bg-[#009C9C] focus:ring-[#00D4D4] focus:ring-offset-white',
    outline:
      'border border-[#E9E9E9] text-[#1A1A1A] bg-white hover:bg-[#D9FFFF] focus:ring-[#00D4D4] focus:ring-offset-white',
    ghost:
      'text-[#1A1A1A] hover:bg-[#D9FFFF] focus:ring-[#00D4D4] focus:ring-offset-white',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      type={props.type || 'button'}
      {...props}
    >
      {children}
    </button>
  );
}




