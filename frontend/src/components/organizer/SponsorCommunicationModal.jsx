import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiMessageSquare, FiVideo, FiMail, FiPhone, FiUser, FiBriefcase } from 'react-icons/fi';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import ChatButton from '../chat/ChatButton';

export default function SponsorCommunicationModal({ open, onClose, sponsor, hackathon }) {
  const modalRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener('mousedown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('mousedown', handler);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open || !sponsor) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div ref={modalRef} className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <FiBriefcase className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sponsor.company_name || sponsor.name || 'Sponsor'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Communication - {hackathon?.title || 'Hackathon'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sponsor Information */}
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <FiUser className="mr-2 text-primary" />
                    Sponsor Information
                  </h3>
                  <div className="space-y-3">
                    {sponsor.company_name && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Company Name
                        </label>
                        <p className="text-gray-900 dark:text-white font-medium">{sponsor.company_name}</p>
                      </div>
                    )}
                    {sponsor.contact_person && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Contact Person
                        </label>
                        <p className="text-gray-900 dark:text-white">{sponsor.contact_person}</p>
                      </div>
                    )}
                    {sponsor.contact_email && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Email
                        </label>
                        <a 
                          href={`mailto:${sponsor.contact_email}`}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <FiMail className="w-4 h-4" />
                          {sponsor.contact_email}
                        </a>
                      </div>
                    )}
                    {sponsor.contact_phone && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Phone
                        </label>
                        <a 
                          href={`tel:${sponsor.contact_phone}`}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <FiPhone className="w-4 h-4" />
                          {sponsor.contact_phone}
                        </a>
                      </div>
                    )}
                    {sponsor.status && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Status
                        </label>
                        <Badge 
                          variant={sponsor.status === 'accepted' ? 'primary' : sponsor.status === 'pending' ? 'warning' : 'outline'}
                          className="text-xs"
                        >
                          {sponsor.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Communication Tools */}
              <div className="space-y-4">
                {/* Chat Card */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white flex items-center">
                      <FiMessageSquare className="mr-2 text-primary" />
                      Chat with Sponsor
                    </h3>
                  </div>
                  <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <FiMessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Start a conversation with {sponsor.contact_person || 'the sponsor'}
                    </p>
                    {(sponsor?.id || sponsor?.user_id) ? (
                      <ChatButton
                        userId={sponsor.id || sponsor.user_id}
                        variant="primary"
                        className="w-full text-sm"
                      />
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Sponsor information not available</p>
                    )}
                  </div>
                </Card>

                {/* Video Chat Card */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white flex items-center">
                      <FiVideo className="mr-2 text-primary" />
                      Video Chat
                    </h3>
                  </div>
                  <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <FiVideo className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Start a video call with {sponsor.contact_person || 'the sponsor'}
                    </p>
                    {(sponsor?.id || sponsor?.user_id) ? (
                      <ChatButton
                        userId={sponsor.id || sponsor.user_id}
                        variant="outline"
                        showVideo
                        className="w-full text-sm"
                      />
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Sponsor information not available</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

