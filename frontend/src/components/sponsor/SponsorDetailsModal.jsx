import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiMessageSquare, FiVideo, FiDollarSign, FiPackage, FiBriefcase, FiMail, FiPhone, FiGift, FiFileText, FiUsers, FiAward } from 'react-icons/fi';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import ChatButton from '../chat/ChatButton';

export default function SponsorDetailsModal({ open, onClose, hackathon, onSponsor, loading = false }) {
  const modalRef = useRef();
  const navigate = useNavigate();


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

  if (!open || !hackathon) return null;

  const getSponsorshipTypeLabel = (type) => {
    const types = {
      financial: 'Financial',
      in_kind: 'In-Kind',
      both: 'Both (Financial + In-Kind)',
    };
    return types[type] || type;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div ref={modalRef} className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{hackathon.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sponsorship Opportunity</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content - Two Column Layout */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              {/* Main Content - Takes 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                {/* Hackathon Overview */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <FiAward className="mr-2 text-primary" />
                    Hackathon Overview
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{hackathon.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {hackathon.type}
                    </Badge>
                    {hackathon.organization && (
                      <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                        {hackathon.organization.name}
                      </Badge>
                    )}
                  </div>
                </Card>

                {/* Sponsorship Requirements - Only show if details are available */}
                {hackathon.sponsorship_type_preferred ? (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <FiBriefcase className="mr-2 text-primary" />
                      Sponsorship Requirements
                    </h3>
                    <div className="space-y-4">
                      {/* Preferred Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Preferred Sponsorship Type
                        </label>
                        <div className="flex items-center gap-2">
                          {hackathon.sponsorship_type_preferred === 'financial' && (
                            <FiDollarSign className="text-green-600 dark:text-green-400" />
                          )}
                          {hackathon.sponsorship_type_preferred === 'in_kind' && (
                            <FiPackage className="text-blue-600 dark:text-blue-400" />
                          )}
                          {hackathon.sponsorship_type_preferred === 'both' && (
                            <FiBriefcase className="text-purple-600 dark:text-purple-400" />
                          )}
                          <span className="text-gray-900 dark:text-white font-medium">
                            {getSponsorshipTypeLabel(hackathon.sponsorship_type_preferred)}
                          </span>
                        </div>
                      </div>

                      {/* Preferred Amount */}
                      {(hackathon.sponsorship_type_preferred === 'financial' || hackathon.sponsorship_type_preferred === 'both') && hackathon.sponsorship_amount_preferred && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Preferred Amount
                          </label>
                          <p className="text-gray-900 dark:text-white font-semibold text-lg">
                            ${parseFloat(hackathon.sponsorship_amount_preferred).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}

                      {/* Sponsorship Details */}
                      {hackathon.sponsorship_details && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            What We're Looking For
                          </label>
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {hackathon.sponsorship_details}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Benefits Offered */}
                      {hackathon.sponsor_benefits_offered && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                            <FiGift className="mr-2" />
                            Benefits We Offer
                          </label>
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {hackathon.sponsor_benefits_offered}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Requirements */}
                      {hackathon.sponsor_requirements && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Requirements/Qualifications
                          </label>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {hackathon.sponsor_requirements}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Contact Information */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h4>
                        <div className="space-y-2">
                          {hackathon.sponsor_contact_email && (
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <FiMail className="text-gray-500 dark:text-gray-400" />
                              <a href={`mailto:${hackathon.sponsor_contact_email}`} className="hover:text-primary hover:underline">
                                {hackathon.sponsor_contact_email}
                              </a>
                            </div>
                          )}
                          {hackathon.sponsor_contact_phone && (
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <FiPhone className="text-gray-500 dark:text-gray-400" />
                              <a href={`tel:${hackathon.sponsor_contact_phone}`} className="hover:text-primary hover:underline">
                                {hackathon.sponsor_contact_phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-6">
                    <div className="text-center py-8">
                      <FiBriefcase className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Sponsorship details are not available. Please contact the organizer for more information.
                      </p>
                    </div>
                  </Card>
                )}

                {/* Action Button */}
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    onClick={onSponsor}
                    isLoading={loading}
                    disabled={loading}
                    className="px-8"
                  >
                    Apply to Sponsor
                  </Button>
                </div>
              </div>

              {/* Chat/Video Chat Sidebar - Takes 1 column */}
              <div className="lg:col-span-1 space-y-4">
                {/* Chat Card */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white flex items-center">
                      <FiMessageSquare className="mr-2 text-primary" />
                      Chat with Organizer
                    </h3>
                  </div>
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <FiMessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Start a conversation with the organizer
                    </p>
                    {hackathon?.organizer?.id || hackathon?.created_by ? (
                      <ChatButton
                        userId={hackathon?.organizer?.id || hackathon?.created_by}
                        variant="primary"
                        className="w-full text-sm"
                      />
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Organizer information not available</p>
                    )}
                  </div>
                </Card>

                {/* Video Call Card */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white flex items-center">
                      <FiVideo className="mr-2 text-primary" />
                      Video Call
                    </h3>
                  </div>
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <FiVideo className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Start a video call with the organizer
                    </p>
                    {hackathon?.organizer?.id || hackathon?.created_by ? (
                      <ChatButton
                        userId={hackathon?.organizer?.id || hackathon?.created_by}
                        variant="outline"
                        showVideo
                        className="w-full text-sm"
                      />
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Organizer information not available</p>
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

