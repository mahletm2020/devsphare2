import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function HackathonDetail() {
  const { id } = useParams();
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    category_id: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await axiosClient.get(`/hackathons/${id}`);
      setHackathon(data.data || data);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    setTeamForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await axiosClient.post(`/hackathons/${id}/teams`, teamForm);
      setMessage('Team created successfully.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create team');
    }
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto py-8 px-4">
        <p className="text-sm text-gray-500">Loading hackathon...</p>
      </main>
    );
  }

  if (!hackathon) {
    return (
      <main className="max-w-4xl mx-auto py-8 px-4">
        <p className="text-sm text-gray-500">Hackathon not found.</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">
              {hackathon.title}
            </h1>
            <p className="text-xs text-gray-500 mb-2">
              {hackathon.organization?.name || 'Unassigned organization'}
            </p>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {hackathon.description}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge>{hackathon.type}</Badge>
            <span className="text-xs text-gray-500">{hackathon.status}</span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-3">
          Categories
        </h2>
        <div className="flex flex-wrap gap-2">
          {(hackathon.categories || []).map((cat) => (
            <Badge key={cat.id}>{cat.name}</Badge>
          ))}
          {!hackathon.categories?.length && (
            <p className="text-xs text-gray-500">No categories configured yet.</p>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-3">
          Create a team
        </h2>
        <form onSubmit={handleCreateTeam} className="space-y-3">
          <Input
            id="name"
            name="name"
            label="Team name"
            value={teamForm.name}
            onChange={handleChange}
            required
          />
          <Input
            id="description"
            name="description"
            label="Description"
            value={teamForm.description}
            onChange={handleChange}
          />
          <Input
            id="category_id"
            name="category_id"
            label="Category ID"
            value={teamForm.category_id}
            onChange={handleChange}
            required
          />
          <Button type="submit">Create team</Button>
        </form>
        {message && <p className="mt-2 text-xs text-gray-600">{message}</p>}
      </Card>
    </main>
  );
}




