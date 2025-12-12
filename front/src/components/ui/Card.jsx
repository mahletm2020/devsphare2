export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-[#F8F8F8] rounded-xl shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}




