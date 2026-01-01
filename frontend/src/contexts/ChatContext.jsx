import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { StreamChat } from 'stream-chat';
import { chatAPI } from '../api/chatAPI';
import { useAuthStore } from '../stores/authStore';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuthStore();
  const [client, setClient] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const initializeChat = async () => {
      if (!user) {
        setIsLoading(false);
        setIsInitialized(false);
        return;
      }

      // If client already exists and same user, no need to reconnect
      if (clientRef.current && clientRef.current.userID === String(user.id)) {
        if (isMounted) {
          setIsInitialized(true);
          setIsLoading(false);
        }
        return;
      }
      
      // Disconnect previous user if client exists but user changed
      if (clientRef.current) {
        try {
          await clientRef.current.disconnectUser();
        } catch (err) {
          console.warn('Failed to disconnect previous user:', err);
        }
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get Stream Chat token
        const tokenResponse = await chatAPI.getToken();
        const { token, api_key } = tokenResponse;

        // Initialize Stream Chat client (singleton instance)
        const chatClient = StreamChat.getInstance(api_key);

        // Connect user to Stream Chat
        await chatClient.connectUser(
          {
            id: String(user.id),
            name: user.name,
            avatar: user.avatar_url || user.avatar,
          },
          token
        );

        if (isMounted) {
          clientRef.current = chatClient;
          setClient(chatClient);
          setIsInitialized(true);
          setError(null);
        }
      } catch (err) {
        // Log all chat errors for debugging
        console.error('Chat initialization failed:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        
        if (isMounted) {
          setError(err);
          setIsInitialized(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeChat();

    return () => {
      isMounted = false;
      // Don't disconnect on unmount - we want to keep the client alive
      // The client will be cleaned up when user logs out
    };
  }, [user]);

  // Disconnect when user logs out
  useEffect(() => {
    if (!user && clientRef.current) {
      clientRef.current.disconnectUser().catch(console.error);
      clientRef.current = null;
      setClient(null);
      setIsInitialized(false);
    }
  }, [user]);

  const value = {
    client,
    isInitialized,
    isLoading,
    error,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;

