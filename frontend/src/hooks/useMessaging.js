import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

export const useMessaging = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  const connect = useCallback(() => {
    if (!user || socket) return;

    const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001', {
      auth: {
        token: localStorage.getItem('token'),
      },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to messaging server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from messaging server');
      setIsConnected(false);
    });

    newSocket.on('conversations', (conversationList) => {
      setConversations(conversationList);
    });

    newSocket.on('messages', (messageList) => {
      setMessages(messageList);
    });

    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      
      // Update unread count if message is not from current user and not in active conversation
      if (message.sender_id !== user.id && 
          (!activeConversation || message.conversation_id !== activeConversation.id)) {
        setUnreadCounts(prev => ({
          ...prev,
          [message.conversation_id]: (prev[message.conversation_id] || 0) + 1
        }));
      }
    });

    newSocket.on('message_read', ({ messageId, conversationId }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    });

    newSocket.on('user_typing', ({ userId, conversationId, isTyping }) => {
      if (activeConversation && conversationId === activeConversation.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      }
    });

    newSocket.on('user_online', (userId) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    newSocket.on('user_offline', (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);
  }, [user, activeConversation]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // Load conversations
  const loadConversations = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('get_conversations');
    }
  }, [socket, isConnected]);

  // Select conversation
  const selectConversation = useCallback((conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
    
    // Clear unread count for this conversation
    setUnreadCounts(prev => ({
      ...prev,
      [conversation.id]: 0
    }));
    
    if (socket && isConnected) {
      socket.emit('join_conversation', conversation.id);
      socket.emit('get_messages', conversation.id);
    }
  }, [socket, isConnected]);

  // Send message
  const sendMessage = useCallback((content, type = 'text') => {
    if (!activeConversation || !socket || !isConnected || !content.trim()) {
      return false;
    }

    const messageData = {
      conversation_id: activeConversation.id,
      content: content.trim(),
      type
    };

    socket.emit('send_message', messageData);
    
    // Stop typing indicator
    socket.emit('typing', {
      conversationId: activeConversation.id,
      isTyping: false
    });

    return true;
  }, [activeConversation, socket, isConnected]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping) => {
    if (!activeConversation || !socket || !isConnected) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit('typing', {
      conversationId: activeConversation.id,
      isTyping
    });

    // Auto-stop typing after 2 seconds if still typing
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', {
          conversationId: activeConversation.id,
          isTyping: false
        });
      }, 2000);
    }
  }, [activeConversation, socket, isConnected]);

  // Mark message as read
  const markMessageAsRead = useCallback((messageId) => {
    if (socket && isConnected) {
      socket.emit('mark_read', messageId);
    }
  }, [socket, isConnected]);

  // Create new conversation
  const createConversation = useCallback((participantId) => {
    if (socket && isConnected) {
      socket.emit('create_conversation', { participantId });
    }
  }, [socket, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    // Connection state
    isConnected,
    connect,
    disconnect,
    
    // Data
    conversations,
    activeConversation,
    messages,
    unreadCounts,
    onlineUsers,
    typingUsers,
    
    // Actions
    loadConversations,
    selectConversation,
    sendMessage,
    sendTypingIndicator,
    markMessageAsRead,
    createConversation,
    
    // Utilities
    getTotalUnreadCount: () => Object.values(unreadCounts).reduce((sum, count) => sum + count, 0),
  };
};