// src/pages/Organizer/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
// import { getHackathons } from '../../api/hackathon';
import { getHackathon } from '../../api/hackathons';

export default function OrganizerDashboard() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await getHackathons();
        setHackathons(data.data || data);
      } catch (err) {
        setHackathons([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Organizer dashboard</h1>
          <p className="text-sm text-gray-500">Manage your hackathons and teams.</p>
        </div>
        <Link to="/organizer/hackathons/create">
          <Button>Create hackathon</Button>
        </Link>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hackathons.map(h => (
            <Card key={h.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold mb-1">{h.title}</h2>
                  <p className="text-xs text-gray-500 mb-2">{h.organization?.name}</p>
                  <p className="text-xs text-gray-600 line-clamp-3">{h.description}</p>
                </div>
                <div>
                  <Link to={`/organizer/hackathons/${h.id}`}>
                    <Button variant="outline">Manage</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
