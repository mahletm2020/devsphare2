/**
 * Chat Components - Centralized Reusable Chat System
 * 
 * This module exports all chat-related components and hooks for use throughout the application.
 * 
 * The chat system uses a centralized ChatContext provider that manages a single Stream Chat client
 * instance, ensuring efficient resource usage and consistent chat behavior across all components.
 * 
 * Usage:
 * 1. The ChatProvider is already wrapped around the App in App.jsx
 * 2. Use StreamChatWrapper component to display chat UI anywhere
 * 3. Use ChatButton component for "Start Chat" or "Video Call" buttons
 * 4. Use useChat hook to access the chat client directly
 * 5. Use useChatChannel hook for advanced channel management
 * 
 * Example:
 * ```jsx
 * import StreamChatWrapper from '@/components/chat/StreamChatWrapper';
 * 
 * // Direct chat with a user
 * <StreamChatWrapper channelType="direct" otherUserId={userId} />
 * 
 * // Team chat
 * <StreamChatWrapper channelType="team" teamId={teamId} />
 * 
 * // Hackathon chat
 * <StreamChatWrapper channelType="hackathon" hackathonId={hackathonId} />
 * ```
 */

export { default as StreamChatWrapper } from './StreamChatWrapper';
export { default as ChatButton } from './ChatButton';
export { useChat } from '../../contexts/ChatContext';
export { useChatChannel } from '../../hooks/useChatChannel';




