import { useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function AssignJudges() {
  const { id } = useParams();
  const [userIds, setUserIds] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const parsed = userIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((n) => Number(n));
      await axiosClient.post(`/hackathons/${id}/assign-judges`, {
        user_ids: parsed,
      });
      setMessage('Judges assigned.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to assign judges');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-[#1A1A1A]">Assign judges</h1>
      <Card>
        <form onSubmit={submit} className="space-y-3">
          <Input
            id="user_ids"
            name="user_ids"
            label="Judge user IDs (comma separated)"
            value={userIds}
            onChange={(e) => setUserIds(e.target.value)}
          />
          <Button type="submit">Save</Button>
        </form>
        {message && <p className="mt-2 text-xs text-gray-600">{message}</p>}
      </Card>
    </div>
  );
}




