import React, { useState } from 'react';
import { FiMessageSquare, FiVideo, FiBriefcase, FiDollarSign, FiPackage, FiMail, FiPhone, FiGift, FiUser } from 'react-icons/fi';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import StreamChatWrapper from '../chat/StreamChatWrapper';

export default function SponsorTab({ hackathon, user, onSponsor, sponsoringId }) {
  const [showChat, setShowChat] = useState(false);
  const [showVideoChat, setShowVideoChat] = useState(false);

  const getSponsorshipTypeLabel = (type) => {
    const types = {
      financial: 'Financial',
      in_kind: 'In-Kind',
      both: 'Both (Financial + In-Kind)',
    };
    return types[type] || type;
  };

  // Check if user has already sponsored this hackathon
  const isSponsored = false; // You may need to check this from props or API

  return (
    <div className="space-y-6">
      {/* Sponsorship Requirements Section */}
      {hackathon.need_sponsor && hackathon.sponsorship_type_preferred ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <FiBriefcase className="mr-3 text-primary" />
              Sponsorship Opportunity
            </h3>
            {!isSponsored && (
              <Button
                variant="primary"
                onClick={onSponsor}
                isLoading={sponsoringId === hackathon.id}
                disabled={sponsoringId === hackathon.id}
                className="flex items-center"
              >
                <FiBriefcase className="mr-2" />
                Apply to Sponsor
              </Button>
            )}
          </div>

          <div className="space-y-6">
            {/* Preferred Type */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Preferred Sponsorship Type
              </label>
              <div className="flex items-center gap-3">
                {hackathon.sponsorship_type_preferred === 'financial' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <FiDollarSign className="text-green-600 dark:text-green-400 text-xl" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getSponsorshipTypeLabel(hackathon.sponsorship_type_preferred)}
                    </span>
                  </div>
                )}
                {hackathon.sponsorship_type_preferred === 'in_kind' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <FiPackage className="text-blue-600 dark:text-blue-400 text-xl" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getSponsorshipTypeLabel(hackathon.sponsorship_type_preferred)}
                    </span>
                  </div>
                )}
                {hackathon.sponsorship_type_preferred === 'both' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <FiBriefcase className="text-purple-600 dark:text-purple-400 text-xl" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getSponsorshipTypeLabel(hackathon.sponsorship_type_preferred)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Preferred Amount */}
            {(hackathon.sponsorship_type_preferred === 'financial' || hackathon.sponsorship_type_preferred === 'both') && 
             hackathon.sponsorship_amount_preferred && (
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Preferred Amount
                </label>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
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
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
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
                  <FiGift className="mr-2 text-primary" />
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
          </div>
        </Card>
      ) : (
        <Card className="p-8">
          <div className="text-center py-8">
            <FiBriefcase className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Sponsorship Opportunities
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This hackathon is not currently seeking sponsors.
            </p>
          </div>
        </Card>
      )}

      {/* Communication Section */}
      {hackathon.need_sponsor && (hackathon.sponsor_contact_email || hackathon.sponsor_contact_phone) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chat Card */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FiMessageSquare className="mr-2 text-primary" />
                Chat with Organizer
              </h3>
              {showChat && (
                <button
                  onClick={() => setShowChat(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <span className="text-gray-500">×</span>
                </button>
              )}
            </div>

            {!showChat ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <FiMessageSquare className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Start a conversation with the organizer
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowChat(true)}
                  className="w-full text-sm"
                >
                  Open Chat
                </Button>
              </div>
            ) : (
              <div className="h-96 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {hackathon.author?.id ? (
                  <StreamChatWrapper 
                    channelType="direct" 
                    otherUserId={hackathon.author.id}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <p>Organizer information not available</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Video Chat Card */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FiVideo className="mr-2 text-primary" />
                Video Chat
              </h3>
              {showVideoChat && (
                <button
                  onClick={() => setShowVideoChat(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <span className="text-gray-500">×</span>
                </button>
              )}
            </div>

            {!showVideoChat ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <FiVideo className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Schedule a video call with the organizer
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowVideoChat(true)}
                  className="w-full text-sm"
                >
                  Start Video Chat
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg p-3 h-48 flex flex-col items-center justify-center border-2 border-gray-700 dark:border-gray-600 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-primary/20 opacity-50"></div>
                  <div className="relative z-10 text-center text-white">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-4 border-2 border-red-500/30">
                      <FiVideo className="w-10 h-10 text-red-400" />
                    </div>
                    <p className="text-sm font-medium mb-2">Video Call Placeholder</p>
                    <p className="text-xs text-gray-300 mb-3">
                      Integrated video calling feature coming soon
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Ready to connect</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" disabled className="flex-1 text-sm">
                    Mute
                  </Button>
                  <Button variant="outline" disabled className="flex-1 text-sm">
                    Camera
                  </Button>
                  <Button variant="primary" disabled className="flex-1 text-sm bg-red-600 hover:bg-red-700">
                    End Call
                  </Button>
                </div>
                <p className="text-[10px] text-center text-gray-500 dark:text-gray-400">
                  Schedule a call via email: {hackathon.sponsor_contact_email || 'organizer@hackathon.com'}
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Contact Information */}
      {(hackathon.sponsor_contact_email || hackathon.sponsor_contact_phone) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FiUser className="mr-2 text-primary" />
            Organizer Contact Information
          </h3>
          <div className="space-y-3">
            {hackathon.sponsor_contact_email && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <FiMail className="text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <a 
                    href={`mailto:${hackathon.sponsor_contact_email}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {hackathon.sponsor_contact_email}
                  </a>
                </div>
              </div>
            )}
            {hackathon.sponsor_contact_phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <FiPhone className="text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                  <a 
                    href={`tel:${hackathon.sponsor_contact_phone}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {hackathon.sponsor_contact_phone}
                  </a>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

