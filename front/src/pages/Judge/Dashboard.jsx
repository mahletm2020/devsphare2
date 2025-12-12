import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function JudgeDashboard() {
  const [hackathons, setHackathons] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedHackathonId = searchParams.get('hackathon');

  useEffect(() => {
    const load = async () => {
      const { data } = await axiosClient.get('/judge/hackathons');
      setHackathons(data.data || data);
    };
    load().catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!selectedHackathonId) {
        setSubmissions([]);
        return;
      }
      const { data } = await axiosClient.get(
        `/hackathons/${selectedHackathonId}/submissions`,
      );
      setSubmissions(data.data || data);
    };
    load().catch(() => {});
  }, [selectedHackathonId]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-[#1A1A1A]">Judge dashboard</h1>
      <p className="text-sm text-gray-500">
        Review submissions and assign scores for your assigned hackathons.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hackathons.map((h) => (
          <Card key={h.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[#1A1A1A] mb-1">
                  {h.title}
                </h2>
                <p className="text-xs text-gray-500 mb-2">
                  {h.organization?.name}
                </p>
              </div>
              <Button
                variant={String(h.id) === selectedHackathonId ? 'primary' : 'outline'}
                onClick={() => setSearchParams({ hackathon: h.id })}
              >
                View submissions
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {selectedHackathonId && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">
            Submissions for hackathon #{selectedHackathonId}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {submissions.map((s) => (
              <Card key={s.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">
                      {s.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1">
                      Team: {s.team?.name}
                    </p>
                  </div>
                  <Link to={`/judge/submissions/${s.id}`}>
                    <Button variant="outline">Score</Button>
                  </Link>
                </div>
              </Card>
            ))}
            {!submissions.length && (
              <p className="text-xs text-gray-500 col-span-full">
                No submissions yet for this hackathon.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


