// src/components/assign/AssignModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { searchUsers } from '../../api/users';

export default function AssignModal({ open, onClose, onAssign, type = 'mentor' }) {
  // type: 'mentor' or 'judge'
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]); // array of users (object)
  const [loading, setLoading] = useState(false);
  const modalRef = useRef();

  useEffect(() => {
    if (!open) {
      setQ('');
      setResults([]);
      setSelected([]);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  const doSearch = async (ev) => {
    ev?.preventDefault();
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await searchUsers(q);
      // API returns array of users
      setResults(data.data || data);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (user) => {
    const exists = selected.find((s) => s.id === user.id);
    if (exists) setSelected((s) => s.filter((x) => x.id !== user.id));
    else {
      if (type === 'mentor') setSelected([user]); // single mentor
      else setSelected((s) => [...s, user]);
    }
  };

  const handleAssign = () => {
    if (!selected.length) return;
    onAssign(selected.map((u) => u.id));
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div ref={modalRef} className="w-full max-w-xl bg-white rounded-lg shadow-lg">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{type === 'mentor' ? 'Assign Mentor' : 'Assign Judges'}</h3>
              <p className="text-xs text-gray-500">
                Search users by name or email and select {type === 'mentor' ? 'one' : 'one or more'}.
              </p>
            </div>
            <button onClick={onClose} aria-label="Close" className="text-gray-500">✕</button>
          </div>

          <div className="p-4">
            <form onSubmit={doSearch} className="flex gap-2">
              <Input placeholder="Search name or email" value={q} onChange={(e)=>setQ(e.target.value)} />
              <Button type="submit" loading={loading}>Search</Button>
            </form>

            <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
              {results.length === 0 ? (
                <div className="text-xs text-gray-500">No results</div>
              ) : (
                results.map((u) => {
                  const sel = !!selected.find((s) => s.id === u.id);
                  return (
                    <div key={u.id} className={`flex items-center justify-between p-2 border rounded ${sel ? 'bg-blue-50' : ''}`}>
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                      <div>
                        <button
                          onClick={() => toggle(u)}
                          className={`text-xs px-3 py-1 rounded ${sel ? 'bg-blue-600 text-white' : 'border'}`}
                        >
                          {sel ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {selected.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                <div className="font-medium mb-1">Selected</div>
                <div className="space-y-1">
                  {selected.map((s) => (
                    <div key={s.id} className="flex items-center justify-between">
                      <div>{s.name} <span className="text-xs text-gray-500">({s.email})</span></div>
                      <button onClick={() => toggle(s)} className="text-xs text-red-500">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleAssign} disabled={selected.length === 0}>
              {type === 'mentor' ? 'Assign Mentor' : `Assign ${selected.length} Judge${selected.length>1?'s':''}`}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
