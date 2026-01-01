import { useEffect, useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { chatAPI } from '../api/chatAPI';

/**
 * Reusable Hook for Chat Channels
 * 
 * This hook manages channel loading and state for any chat channel type.
 * Use this hook in components that need chat functionality without the full UI.
 * 
 * @param {string} channelType - Type of channel: 'direct', 'team', or 'hackathon'
 * @param {string|number} otherUserId - User ID for direct messages
 * @param {string|number} teamId - Team ID for team chat
 * @param {string|number} hackathonId - Hackathon ID for hackathon chat
 * @returns {object} - { channel, loading, error }
 */
export function useChatChannel({ channelType, otherUserId, teamId, hackathonId }) {
  const { client, isInitialized } = useChat();
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

  return { channel, loading, error };
}

export default useChatChannel;




