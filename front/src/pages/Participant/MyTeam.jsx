import { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function MyTeam() {
  const [teamId, setTeamId] = useState('');
  const [team, setTeam] = useState(null);
  const [message, setMessage] = useState('');

  const loadTeam = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const { data } = await axiosClient.get(`/teams/${teamId}`);
      setTeam(data.data || data);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to load team');
    }
  };

  const joinTeam = async () => {
    setMessage('');
    try {
      const { data } = await axiosClient.post(`/teams/${teamId}/join`);
      setTeam(data.data || data);
      setMessage('Joined team successfully.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to join team');
    }
  };

  const leaveTeam = async () => {
    setMessage('');
    try {
      await axiosClient.post(`/teams/${teamId}/leave`);
      setMessage('Left team.');
      setTeam(null);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to leave team');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-[#1A1A1A]">My team</h1>
      <Card>
        <form onSubmit={loadTeam} className="flex flex-col md:flex-row gap-3">
          <Input
            id="team_id"
            name="team_id"
            label="Team ID"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" className="md:self-end">
            Load
          </Button>
        </form>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" onClick={joinTeam}>
            Join team
          </Button>
          <Button variant="ghost" onClick={leaveTeam}>
            Leave team
          </Button>
        </div>
        {message && <p className="mt-2 text-xs text-gray-600">{message}</p>}
      </Card>

      {team && (
        <Card>
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-2">
            {team.name}
          </h2>
          <p className="text-xs text-gray-500 mb-2">
            Leader ID: {team.leader_id} • Hackathon: {team.hackathon_id}
          </p>
          <p className="text-xs text-gray-600 mb-3">{team.description}</p>
          <h3 className="text-xs font-semibold text-[#1A1A1A] mb-1">Members</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            {(team.members || []).map((m) => (
              <li key={m.id}>{m.name}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}




