import { useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

// Note: backend does not define a dedicated sponsor ads API,
// so this page currently just collects content locally.

export default function SponsorAds() {
  const [form, setForm] = useState({
    headline: '',
    copy: '',
    link: '',
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-[#1A1A1A]">Sponsor materials</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            id="headline"
            name="headline"
            label="Ad headline"
            value={form.headline}
            onChange={handleChange}
          />
          <Input
            id="copy"
            name="copy"
            label="Short description / copy"
            value={form.copy}
            onChange={handleChange}
          />
          <Input
            id="link"
            name="link"
            label="Link URL"
            value={form.link}
            onChange={handleChange}
          />
          <Button type="submit">Save locally</Button>
        </form>
        {saved && (
          <p className="mt-2 text-xs text-gray-600">
            Ad content saved in this session (no backend endpoint defined yet).
          </p>
        )}
      </Card>
    </div>
  );
}




