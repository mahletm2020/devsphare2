import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

export default function Home() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', organization_id: '', category: '' });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await axiosClient.get('/hackathons', {
        params: {
          type: filters.type || undefined,
          organization_id: filters.organization_id || undefined,
          category: filters.category || undefined,
        },
      });
      setHackathons(data.data || data);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [filters]);

  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-[220px,minmax(0,1fr),220px] gap-6">
        {/* Left sponsor rail */}
        <aside className="hidden lg:block space-y-3">
          <Card>
            <p className="text-xs font-semibold text-[#1A1A1A] mb-1">
              Featured sponsor
            </p>
            <p className="text-xs text-gray-600">
              Showcase your brand to hundreds of builders during hackathons.
            </p>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-[#1A1A1A] mb-1">
              Promote your API
            </p>
            <p className="text-xs text-gray-600">
              Add prize tracks and API challenges to drive adoption.
            </p>
          </Card>
        </aside>

        {/* Center content */}
        <section>
          <section className="mb-6">
            <h1 className="text-3xl font-semibold text-[#1A1A1A] mb-2">
              Host and join world‑class hackathons
            </h1>
            <p className="text-sm text-gray-500">
              Organizers launch events, sponsors get visibility, and participants build
              winning projects—all in one place.
            </p>
          </section>

          <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              id="type"
              name="type"
              label="Type (online / in_person / hybrid)"
              value={filters.type}
              onChange={handleChange}
              className="md:col-span-1"
            />
            <Input
              id="organization_id"
              name="organization_id"
              label="Organization ID (optional)"
              value={filters.organization_id}
              onChange={handleChange}
              className="md:col-span-1"
            />
            <Input
              id="category"
              name="category"
              label="Category name (optional)"
              value={filters.category}
              onChange={handleChange}
              className="md:col-span-1"
            />
          </section>

          {loading ? (
            <p className="text-sm text-gray-500">Loading hackathons...</p>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hackathons.map((h) => (
                <Link key={h.id} to={`/hackathons/${h.id}`}>
                  <Card className="hover:shadow-md transition-shadow h-full flex flex-col justify-between">
                    <div>
                      <h2 className="text-lg font-semibold mb-1 text-[#1A1A1A]">
                        {h.title}
                      </h2>
                      <p className="text-xs text-gray-500 mb-2">
                        {h.organization?.name || 'Unassigned organization'}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                        {h.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge>{h.type}</Badge>
                      <span className="text-xs text-gray-500">{h.status}</span>
                    </div>
                  </Card>
                </Link>
              ))}
              {!hackathons.length && (
                <p className="text-sm text-gray-500 col-span-full">
                  No hackathons found. Organizers can create one from their dashboard.
                </p>
              )}
            </section>
          )}
        </section>

        {/* Right sponsor rail */}
        <aside className="hidden lg:block space-y-3">
          <Card>
            <p className="text-xs font-semibold text-[#1A1A1A] mb-1">
              Looking to sponsor?
            </p>
            <p className="text-xs text-gray-600 mb-2">
              Browse sponsor‑only events and upload your materials from the sponsor
              dashboard.
            </p>
            <Link
              to="/sponsor/dashboard"
              className="inline-block text-xs text-[#00D4D4] hover:text-[#009C9C]"
            >
              Go to sponsor dashboard
            </Link>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-[#1A1A1A] mb-1">
              Become an organizer
            </p>
            <p className="text-xs text-gray-600">
              Create branded hackathons with mentor and judge workflows.
            </p>
          </Card>
        </aside>
      </div>
    </main>
  );
}


