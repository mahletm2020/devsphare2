import React, { useState, useEffect, useRef } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { searchUsers } from '../../api/users';

export default function AssignModal({ open, onClose, type = 'mentor', onAssign }) {
  // type: 'mentor' | 'judge'
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!q.trim()) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await searchUsers(q);
      setResults(data);
    } catch (err) {
      setResults([]);
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectUser = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(s => s.id === user.id);
      
      if (isSelected) {
        return prev.filter(s => s.id !== user.id);
      } else {
        // For mentor: single selection (only one mentor per assignment)
        if (type === 'mentor') return [user];
        // For judges: multiple selection allowed
        return [...prev, user];
      }
    });
  };

  const handleAssign = () => {
    if (selectedUsers.length === 0) return;
    
    onAssign(selectedUsers.map(u => u.id));
    handleClose();
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setResults([]);
    setQ('');
    onClose();
  };

  // Don't render anything if modal is not open
  if (!open) return null;

  return (
    <>
      {/* Backdrop - dark overlay that covers entire screen */}
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"></div>
      
      {/* Modal Container - centered with absolute positioning */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Modal Content - the actual modal box */}
        <div 
          ref={modalRef}
          className="relative w-full max-w-md bg-white rounded-xl shadow-2xl animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h3 id="modal-title" className="text-xl font-semibold text-gray-900">
                {type === 'mentor' ? 'Assign Mentor' : 'Assign Judges'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {type === 'mentor' 
                  ? 'Select one mentor to assign to teams'
                  : 'Select one or more judges to assign'
                }
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder={type === 'mentor' ? "Search mentors..." : "Search judges..."}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button type="submit" loading={loading}>
                  Search
                </Button>
              </div>
              {!q.trim() && (
                <p className="text-xs text-gray-500 mt-2">
                  Start typing to search for {type === 'mentor' ? 'mentors' : 'judges'}
                </p>
              )}
            </form>

            {/* Search Results */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Search Results</h4>
                {selectedUsers.length > 0 && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {selectedUsers.length} selected
                  </span>
                )}
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex items-center p-3 border rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gray-200 mr-3"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-sm text-gray-500">
                    {q.trim() ? 'No users found' : 'Search for users to display results'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {results.map(user => {
                    const isSelected = selectedUsers.find(s => s.id === user.id);
                    return (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleSelectUser(user)}
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold mr-3">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                            {user.roles && (
                              <div className="flex items-center gap-1 mt-1">
                                {user.roles.map(role => (
                                  <span key={role} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                    {role}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectUser(user);
                          }}
                          className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Users Preview */}
            {selectedUsers.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {type === 'mentor' ? 'Selected Mentor' : 'Selected Judges'}
                </h5>
                <div className="space-y-2">
                  {selectedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs mr-2">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-900">{user.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSelectUser(user)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Remove user"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-xl">
            <div className="text-sm text-gray-500">
              {selectedUsers.length === 0
                ? `Select ${type === 'mentor' ? 'a mentor' : 'one or more judges'} to continue`
                : `${selectedUsers.length} ${type === 'mentor' ? 'mentor' : 'judge'}${selectedUsers.length > 1 ? 's' : ''} selected`
              }
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={selectedUsers.length === 0}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
              >
                {type === 'mentor'
                  ? 'Assign Mentor'
                  : `Assign ${selectedUsers.length} Judge${selectedUsers.length > 1 ? 's' : ''}`
                }
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}