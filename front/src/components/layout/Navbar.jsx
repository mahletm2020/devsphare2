import useAuthStore from '../../store/auth';
import Button from '../ui/Button';

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="w-full border-b border-[#E9E9E9] bg-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#00D4D4]" />
          <span className="font-semibold text-lg text-[#1A1A1A]">DevSphere</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-[#1A1A1A]">Hi, {user.name}</span>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}




