import React, { useEffect, useState } from 'react';
import { Chat, Channel, Window, ChannelHeader, MessageList, MessageInput, Thread } from 'stream-chat-react';
import { useChat } from '../../contexts/ChatContext';
import { chatAPI } from '../../api/chatAPI';

/**
 * Reusable Stream Chat Wrapper Component
 * 
 * This component uses the shared ChatContext client and can be used anywhere in the app.
 * It handles different channel types: direct, team, and hackathon.
 * 
 * @param {string} channelType - Type of channel: 'direct', 'team', or 'hackathon'
 * @param {string} otherUserId - User ID for direct messages (required if channelType is 'direct')
 * @param {string|number} teamId - Team ID for team chat (required if channelType is 'team')
 * @param {string|number} hackathonId - Hackathon ID for hackathon chat (required if channelType is 'hackathon')
 * @param {string} className - Additional CSS classes
 * @param {object} style - Additional inline styles
 */
export default function StreamChatWrapper({ 
  channelType, 
  otherUserId = null, 
  teamId = null, 
  hackathonId = null,
  className = '',
  style = {}
}) {
  const { client, isInitialized, isLoading: contextLoading, error: contextError } = useChat();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadChannel = async () => {
      if (!isInitialized || !client) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get or create channel based on type
        let channelData;
        if (channelType === 'direct' && otherUserId) {
          channelData = await chatAPI.getDirectChannel(otherUserId);
        } else if (channelType === 'team' && teamId) {
          channelData = await chatAPI.getTeamChannel(teamId);
        } else if (channelType === 'hackathon' && hackathonId) {
          channelData = await chatAPI.getHackathonChannel(hackathonId);
        } else {
          setError('Invalid channel configuration');
          setLoading(false);
          return;
        }

        if (channelData) {
          const chatChannel = client.channel(channelData.channel_type, channelData.channel_id);
          await chatChannel.watch();
          setChannel(chatChannel);
        }
      } catch (err) {
        console.warn('Failed to load channel:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadChannel();
  }, [client, isInitialized, channelType, otherUserId, teamId, hackathonId]);

  // Show loading state
  if (contextLoading || loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`} style={style}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error state if chat is not configured
  if (!isInitialized || !client) {
    const errorMsg = contextError?.response?.data?.message || contextError?.message || 'Chat service is not configured';
    const isConfigError = contextError?.response?.status === 503 || errorMsg.includes('not configured') || errorMsg.includes('credentials');
    
    return (
      <div className={`text-center py-8 px-4 ${className}`} style={style}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chat Not Available</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{errorMsg}</p>
        {isConfigError && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
            Please configure Stream Chat credentials in the backend .env file
          </p>
        )}
      </div>
    );
  }

  // Show error state if channel failed to load
  if (error || !channel) {
    return (
      <div className={`text-center py-8 px-4 ${className}`} style={style}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <svg className="w-8 h-8 text-red-400 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Failed to Load Chat</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Unable to connect to the chat channel. Please try again later.</p>
      </div>
    );
  }

  // Render chat interface
  // Stream Chat's ChannelHeader includes video call buttons when configured
  return (
    <div className={`h-full ${className}`} style={style}>
      <Chat client={client} theme="messaging dark">
        <Channel channel={channel}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
}
