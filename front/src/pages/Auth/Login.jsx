import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/auth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);

  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
      const data = await login(form); // returns { user, token }
      const target =
        location.state?.from?.pathname && location.state.from.pathname !== '/login'
          ? location.state.from.pathname
          : getDefaultDashboard(data.user);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-semibold mb-2 text-[#1A1A1A]">Welcome back</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="email" name="email" label="Email" type="email" value={form.email} onChange={handleChange} required />
          <Input id="password" name="password" label="Password" type="password" value={form.password} onChange={handleChange} required />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-4 text-xs text-gray-500">
          Don't have an account? <Link to="/register" className="text-[#00D4D4]">Register</Link>
        </p>
      </Card>
    </div>
  );
}
