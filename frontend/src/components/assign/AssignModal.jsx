// src/components/assign/AssignModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { searchUsers } from '../../api/users';
import { FiRefreshCw } from 'react-icons/fi';

export default function AssignModal({ open, onClose, onAssign, type = 'mentor', hackathonId = null }) {
  // type: 'mentor' or 'judge'
  // hackathonId: optional hackathon ID to exclude participants from search
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]); // array of users (object)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef();

  useEffect(() => {
    if (!open) {
      setQ('');
      setResults([]);
      setSelected([]);
      setError('');
    }
  }, [open]);

  // Clear results when search query changes (but don't search automatically)
  useEffect(() => {
    if (open && q.trim().length === 0) {
      setResults([]);
      setError('');
    }
  }, [q, open]);

  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  const doSearch = async (ev) => {
    ev?.preventDefault();
    const searchTerm = q.trim();
    
    // Clear results if no search term
    if (!searchTerm) {
      setResults([]);
      setError('');
      return;
    }
    
    await performSearch(searchTerm);
  };

  const performSearch = async (searchTerm) => {
    setLoading(true);
    setError('');
    // Clear previous results while searching
    setResults([]);
    try {
      const params = {};
      // Exclude participants from this hackathon if hackathonId is provided
      if (hackathonId) {
        params.exclude_hackathon = hackathonId;
      }
      const response = await searchUsers(searchTerm, null, params);
      
      // API returns paginated response: {data: [...], current_page: 1, ...}
      // axios wraps it, so response.data is the paginated object
      const users = response?.data?.data || [];
      setResults(users);
      if (users.length === 0) {
        setError('No users found. Try a different search term.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
      const errorMessage = err.response?.data?.message || err.message || 'Search failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    const searchTerm = q.trim();
    if (searchTerm) {
      await performSearch(searchTerm);
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
        <div ref={modalRef} className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{type === 'mentor' ? 'Assign Mentor' : 'Assign Judges'}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Search users by name or email and select {type === 'mentor' ? 'one' : 'one or more'}.
              </p>
            </div>
            <button onClick={onClose} aria-label="Close" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
          </div>

          <div className="p-4">
            <form onSubmit={doSearch} className="flex gap-2">
              <Input 
                placeholder="Search users by name or email..." 
                value={q} 
                onChange={(e)=>setQ(e.target.value)}
                className="flex-1"
              />
              <Button 
                type="button"
                variant="outline"
                onClick={handleRefresh}
                disabled={!q.trim() || loading}
                title="Refresh search results"
                className="px-3 min-w-[44px]"
              >
                <FiRefreshCw className={`text-lg ${loading && q.trim() ? 'animate-spin' : ''}`} />
              </Button>
              <Button type="submit" disabled={loading}>Search</Button>
            </form>
            {!q.trim() && !error && !loading && results.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Enter a name or email to search for {type === 'mentor' ? 'mentors' : 'judges'}
              </p>
            )}
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {error}
              </p>
            )}

            <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
              {loading && q.trim() && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">Searching...</div>
              )}
              {!loading && results.length === 0 && q.trim() && !error && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No users found</div>
              )}
              {!loading && results.length > 0 && (
                results.map((u) => {
                  const sel = !!selected.find((s) => s.id === u.id);
                  return (
                    <div key={u.id} className={`flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${sel ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'border-gray-200 dark:border-gray-700'}`}>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{u.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                      </div>
                      <div>
                        <button
                          onClick={() => toggle(u)}
                          className={`text-xs px-3 py-1 rounded transition-colors ${sel ? 'bg-blue-600 text-white' : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
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
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded text-sm border border-gray-200 dark:border-gray-700">
                <div className="font-medium mb-1 text-gray-900 dark:text-white">Selected</div>
                <div className="space-y-1">
                  {selected.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                      <div>{s.name} <span className="text-xs text-gray-500 dark:text-gray-400">({s.email})</span></div>
                      <button onClick={() => toggle(s)} className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
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




