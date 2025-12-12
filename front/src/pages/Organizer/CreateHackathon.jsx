// src/pages/Organizer/CreateHackathon.jsx
import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
// import { createHackathon } from '../../api/hackathon';
import { createHackathon } from '../../api/hackathons';
import axiosClient from '../../api/axiosClient';
import { useNavigate } from 'react-router-dom';

export default function CreateHackathon() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'online',
    need_sponsor: false,
    sponsor_visibility: 'public',
    sponsor_listing_expiry: '',
    team_deadline: '',
    submission_deadline: '',
    judging_deadline: '',
    status: 'draft',
    max_team_size: 4,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const payload = { ...form };
      // convert to null if empty
      ['team_deadline', 'submission_deadline', 'judging_deadline','sponsor_listing_expiry'].forEach(k => {
        if (!payload[k]) payload[k] = null;
      });
      const { data } = await createHackathon(payload);
      // redirect to manage page if returned id
      const id = data.data?.id || data.id;
      setMessage('Hackathon created.');
      if (id) navigate(`/organizer/hackathons/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || (err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : 'Failed to create'));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Create hackathon</h1>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Input name="title" label="Title" value={form.title} onChange={handleChange} required />
          <div>
            <label className="text-sm">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded p-2" rows="4" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs">Team deadline</label>
              <input type="datetime-local" name="team_deadline" value={form.team_deadline} onChange={handleChange} className="w-full border rounded p-2" required />
            </div>
            <div>
              <label className="text-xs">Submission deadline</label>
              <input type="datetime-local" name="submission_deadline" value={form.submission_deadline} onChange={handleChange} className="w-full border rounded p-2" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs">Judging deadline</label>
              <input type="datetime-local" name="judging_deadline" value={form.judging_deadline} onChange={handleChange} className="w-full border rounded p-2" required />
            </div>
            <div>
              <label className="text-xs">Sponsor listing expiry</label>
              <input type="datetime-local" name="sponsor_listing_expiry" value={form.sponsor_listing_expiry} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs">Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="w-full border rounded p-2">
                <option value="online">online</option>
                <option value="in_person">in_person</option>
                <option value="hybrid">hybrid</option>
              </select>
            </div>

            <div>
              <label className="text-xs">Max team size</label>
              <input name="max_team_size" type="number" min="1" value={form.max_team_size} onChange={handleChange} className="w-full border rounded p-2" />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" name="need_sponsor" checked={form.need_sponsor} onChange={handleChange} />
                Need sponsors
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs">Sponsor Visibility</label>
            <select name="sponsor_visibility" value={form.sponsor_visibility} onChange={handleChange} className="w-full border rounded p-2">
              <option value="public">Public</option>
              <option value="sponsors_only">Sponsors only</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <Button type="submit">Create Hackathon</Button>
        </form>
      </Card>
    </div>
  );
}
