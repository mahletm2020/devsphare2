import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import Card from '../../components/ui/Card';

export default function SponsorDashboard() {
  const [hackathons, setHackathons] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await axiosClient.get('/hackathons', {
        params: { type: 'online' },
      });
      const list = data.data || data;
      setHackathons(
        list.filter(
          (h) => h.need_sponsor && h.sponsor_visibility === 'sponsors_only',
        ),
      );
    };
    load().catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-[#1A1A1A]">Sponsor dashboard</h1>
      <p className="text-sm text-gray-500">
        Browse hackathons that are actively looking for sponsors.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hackathons.map((h) => (
          <Card key={h.id}>
            <h2 className="text-sm font-semibold text-[#1A1A1A] mb-1">
              {h.title}
            </h2>
            <p className="text-xs text-gray-500 mb-2">
              {h.organization?.name}
            </p>
            <p className="text-xs text-gray-600 line-clamp-3">{h.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}




