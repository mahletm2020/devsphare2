// src/components/TeamCard.jsx
import React from 'react';

export default function TeamCard({ team, checked, onToggle }) {
  const leader = team.leader?.name || '—';
  const mentors = (team.mentors || []).map(m => m.name).join(', ');
  const judges = (team.judges || []).map(j => j.name).join(', ');

  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={checked} onChange={() => onToggle(team.id)} className="mt-1" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{team.name}</h3>
            <small className="text-xs text-gray-400">Leader: {leader}</small>
          </div>
          <p className="text-xs text-gray-600 mt-1">{team.description}</p>
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div><span className="font-semibold">Mentors:</span> {mentors || 'none'}</div>
            <div><span className="font-semibold">Judges:</span> {judges || 'none'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
