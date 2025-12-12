import { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function SubmitProject() {
  const [teamId, setTeamId] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    github_url: '',
    video_url: '',
    file: null,
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFile = (e) => {
    setForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('description', form.description);
      data.append('github_url', form.github_url);
      data.append('video_url', form.video_url);
      if (form.file) {
        data.append('file', form.file);
      }
      await axiosClient.post(`/teams/${teamId}/submit`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Submission uploaded successfully.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Submission failed');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-[#1A1A1A]">Submit project</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            id="teamId"
            name="teamId"
            label="Team ID"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            required
          />
          <Input
            id="title"
            name="title"
            label="Title"
            value={form.title}
            onChange={handleChange}
            required
          />
          <Input
            id="description"
            name="description"
            label="Description"
            value={form.description}
            onChange={handleChange}
            required
          />
          <Input
            id="github_url"
            name="github_url"
            label="GitHub URL"
            value={form.github_url}
            onChange={handleChange}
            required
          />
          <Input
            id="video_url"
            name="video_url"
            label="Demo video URL"
            value={form.video_url}
            onChange={handleChange}
            required
          />
          <div className="mt-2">
            <label className="block text-xs text-gray-500 mb-1">
              Optional file upload
            </label>
            <input type="file" onChange={handleFile} className="text-xs" />
          </div>
          <Button type="submit">Submit project</Button>
        </form>
        {message && <p className="mt-2 text-xs text-gray-600">{message}</p>}
      </Card>
    </div>
  );
}




