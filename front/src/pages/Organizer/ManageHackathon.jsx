// src/pages/Organizer/ManageHackathon.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
// import TeamCard from '../../components/TeamCard';
import TeamCard from '../../components/hackathon/TeamCard';
import AssignModal from '../../components/assign/AssignModal';
// import { getHackathon, getHackathonTeams, assignMentorToTeams, assignJudgesToTeams } 
import { getHackathon , getHackathonTeams, assignMentorToTeams, assignJudgesToTeams } from '../../api/hackathons';

export default function ManageHackathon() {
  const { id } = useParams();
  const [hackathon, setHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selected, setSelected] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignType, setAssignType] = useState('mentor');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const { data } = await getHackathon(id);
      const h = data.data || data;
      setHackathon(h);
    } catch (err) {
      setHackathon(null);
    }
    try {
      const res = await getHackathonTeams(id);
      setTeams(res.data.data || res.data || []);
    } catch (err) {
      setTeams([]);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const toggleSelect = (teamId) => {
    setSelected((s) => (s.includes(teamId) ? s.filter((x) => x !== teamId) : [...s, teamId]));
  };

  const openAssign = (type) => {
    if (!selected.length) {
      setMessage('Select one or more teams first');
      setTimeout(()=>setMessage(''), 2500);
      return;
    }
    setAssignType(type);
    setShowAssignModal(true);
  };

  const handleAssign = async (userIds) => {
    setMessage('');
    try {
      if (assignType === 'mentor') {
        // userIds is array with single id
        const mentorId = userIds[0];
        await assignMentorToTeams(id, selected, mentorId);
        setMessage('Mentor assigned to selected teams.');
      } else {
        // judges
        await assignJudgesToTeams(id, selected, userIds);
        setMessage('Judge(s) assigned to selected teams.');
      }
      // reload teams to reflect mentors/judges
      const res = await getHackathonTeams(id);
      setTeams(res.data.data || res.data || []);
      setSelected([]);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Assignment failed');
    } finally {
      setShowAssignModal(false);
      setTimeout(()=>setMessage(''), 3000);
    }
  };

  if (!hackathon) return <p>Loading hackathon...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-semibold">Manage: {hackathon.title}</h1>
          <p className="text-xs text-gray-500">Status: {hackathon.status} • Max team size: {hackathon.max_team_size}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openAssign('mentor')}>Assign Mentor</Button>
          <Button onClick={() => openAssign('judge')}>Assign Judges</Button>
        </div>
      </div>

      <Card>
        <h2 className="font-semibold mb-2">Teams</h2>
        <p className="text-xs text-gray-500 mb-3">Select teams then click assign to add mentors/judges.</p>
        <div className="grid gap-3">
          {teams.map(team => (
            <TeamCard key={team.id} team={team} checked={selected.includes(team.id)} onToggle={toggleSelect} />
          ))}
          {!teams.length && <p className="text-sm text-gray-500">No teams yet</p>}
        </div>
      </Card>

      {message && <div className="text-sm text-green-600">{message}</div>}

      <AssignModal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssign}
        type={assignType === 'mentor' ? 'mentor' : 'judge'}
      />
    </div>
  );
}
