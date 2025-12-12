import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/auth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'participant',
  });
  const [error, setError] = useState('');
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRoleChange = (role) => {
    setForm((prev) => ({ ...prev, role }));
  };

  const getDefaultDashboard = (user) => {
    const roles = user.roles?.map((r) => r.name) || [];
    if (roles.includes('organizer') || roles.includes('super_admin')) return '/organizer/dashboard';
    if (roles.includes('sponsor')) return '/sponsor/dashboard';
    if ((user.judgeHackathons || []).length) return '/judge/dashboard';
    return '/participant/dashboard';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await register(form); // returns { user, token }
      navigate(getDefaultDashboard(data.user), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-semibold mb-2 text-[#1A1A1A]">
          Create your DevSphere account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="name" name="name" label="Full name" value={form.name} onChange={handleChange} required />

          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-600">I am signing up as</p>
            <div className="grid grid-cols-3 gap-2">
              {['participant', 'organizer', 'sponsor'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(role)}
                  className={`rounded-lg border px-2 py-2 text-xs capitalize transition ${
                    form.role === role
                      ? 'bg-[#00D4D4] text-white border-[#00D4D4]'
                      : 'bg-white text-[#1A1A1A] border-[#E9E9E9] hover:bg-[#D9FFFF]'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <Input id="email" name="email" label="Email" type="email" value={form.email} onChange={handleChange} required />

          <Input id="password" name="password" label="Password" type="password" value={form.password} onChange={handleChange} required />

          <Input id="password_confirmation" name="password_confirmation" label="Confirm password" type="password" value={form.password_confirmation} onChange={handleChange} required />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="mt-4 text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-[#00D4D4] hover:text-[#009C9C]">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
