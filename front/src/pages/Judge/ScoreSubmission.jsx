import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ScoreSubmission() {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [form, setForm] = useState({
    innovation: 5,
    execution: 5,
    ux_ui: 5,
    feasibility: 5,
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await axiosClient.get(`/submissions/${id}`);
      setSubmission(data.data || data);
    };
    load().catch(() => {});
  }, [id]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: Number(e.target.value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await axiosClient.post(`/submissions/${id}/ratings`, form);
      setMessage('Rating saved.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save rating');
    }
  };

  if (!submission) {
    return (
      <div>
        <p className="text-sm text-gray-500">Loading submission...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-[#1A1A1A]">Score submission</h1>
      <Card>
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-1">
          {submission.title}
        </h2>
        <p className="text-xs text-gray-500 mb-1">
          Team: {submission.team?.name}
        </p>
        <p className="text-xs text-gray-600 mb-2">{submission.description}</p>
        <p className="text-xs text-[#00D4D4] mb-1">
          <a href={submission.github_url} target="_blank" rel="noreferrer">
            GitHub
          </a>{' '}
          •{' '}
          <a href={submission.video_url} target="_blank" rel="noreferrer">
            Demo video
          </a>
        </p>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            id="innovation"
            name="innovation"
            label="Innovation (1-10)"
            type="number"
            value={form.innovation}
            onChange={handleChange}
            required
          />
          <Input
            id="execution"
            name="execution"
            label="Execution (1-10)"
            type="number"
            value={form.execution}
            onChange={handleChange}
            required
          />
          <Input
            id="ux_ui"
            name="ux_ui"
            label="UX/UI (1-10)"
            type="number"
            value={form.ux_ui}
            onChange={handleChange}
            required
          />
          <Input
            id="feasibility"
            name="feasibility"
            label="Feasibility (1-10)"
            type="number"
            value={form.feasibility}
            onChange={handleChange}
            required
          />
          <div className="md:col-span-2">
            <Button type="submit">Save score</Button>
          </div>
        </form>
        {message && <p className="mt-2 text-xs text-gray-600">{message}</p>}
      </Card>
    </div>
  );
}




