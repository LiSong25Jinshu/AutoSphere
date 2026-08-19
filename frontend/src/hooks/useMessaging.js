import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { messageAPI } from '../services/api';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const useMessaging = () => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const typingTimeoutRef = useRef(null);
  const activeConvRef = useRef(null);
  activeConvRef.current = activeConversation;

  // ── REST: load conversations from DB ──────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!token) return;
    setLoadingConversations(true);
    try {
      const res = await messageAPI.getConversations({ limit: 50 });
      if (res.data.success) {
        const convs = res.data.data.map((c) => {
          const other = c.otherParticipant;
          const otherName = other
            ? [`${other.firstName || ''}`, `${other.lastName || ''}`]
                .filter(Boolean)
                .join(' ')
                .trim() || other.email || 'Unknown'
            : 'Unknown';
          return {
          ...c,
          // Normalise the "other participant" for display
          name: otherName,
          avatar: other
            ? `${other.firstName?.[0] || ''}${other.lastName?.[0] || ''}`
            : '?',
          // Expose contact details for the chat header
          otherPhone:       other?.phone       || null,
          otherRole:        other?.role        || null,
          otherBusinessName: other?.businessName || null,
          lastMessage: c.lastMessage?.content || '',
          timestamp: c.lastMessage?.createdAt
            ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
          unread: c.unreadCount || 0,
          };
        });
        setConversations(convs);
        // Seed unread counts
        const counts = {};
        convs.forEach((c) => { counts[c.id] = c.unread; });
        setUnreadCounts(counts);
      }
    } catch (err) {
      console.error('loadConversations error:', err.message);
    } finally {
      setLoadingConversations(false);
    }
  }, [token]);

  // ── REST: load messages for a conversation ────────────────────────────────
  const loadMessages = useCallback(async (conversationId) => {
    if (!token) return;
    setLoadingMessages(true);
    try {
      const res = await messageAPI.getMessages(conversationId, { limit: 100 });
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('loadMessages error:', err.message);
    } finally {
      setLoadingMessages(false);
    }
  }, [token]);

  // ── Socket connection ─────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!user || !token || socket) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('message:new', (message) => {
      // Enrich with sender info from the active conversation participants
      // so the Bubble component can display the sender name
      const conv = activeConvRef.current;
      if (conv && !message.sender) {
        // Determine which participant sent it
        const isFromParticipant1 = message.senderId === conv.participant1 ||
                                   message.sender_id === conv.participant1;
        const senderParticipant = isFromParticipant1
          ? conv.firstParticipant
          : conv.secondParticipant;
        if (senderParticipant) {
          message.sender = {
            id: senderParticipant.id,
            firstName: senderParticipant.firstName,
            lastName: senderParticipant.lastName,
          };
        }
      }

      if (activeConvRef.current?.id === message.conversationId) {
        setMessages((prev) => [...prev, message]);
      }
      if (!activeConvRef.current || message.conversationId !== activeConvRef.current.id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.conversationId]: (prev[message.conversationId] || 0) + 1,
        }));
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === message.conversationId
            ? { ...c, lastMessage: message.content, timestamp: 'Just now' }
            : c
        )
      );
    });

    newSocket.on('typing:user', ({ userId, conversationId, isTyping }) => {
      if (activeConvRef.current?.id === conversationId) {
        setTypingUsers((prev) => {
          const s = new Set(prev);
          isTyping ? s.add(userId) : s.delete(userId);
          return s;
        });
      }
    });

    newSocket.on('user:online', ({ userId }) =>
      setOnlineUsers((prev) => new Set([...prev, userId]))
    );
    newSocket.on('user:offline', ({ userId }) =>
      setOnlineUsers((prev) => { const s = new Set(prev); s.delete(userId); return s; })
    );

    newSocket.on('connect_error', (err) => console.warn('Messaging socket error:', err.message));

    setSocket(newSocket);
  }, [user, token, socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // Auto-connect when authenticated
  useEffect(() => {
    if (user && token && !socket) connect();
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [user, token]);

  // Load conversations on mount
  useEffect(() => {
    if (token) loadConversations();
  }, [token, loadConversations]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const selectConversation = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
    setTypingUsers(new Set());
    setUnreadCounts((prev) => ({ ...prev, [conversation.id]: 0 }));

    // Join socket room
    if (socket && isConnected) {
      socket.emit('conversation:join', conversation.id);
    }

    // Load messages from DB
    await loadMessages(conversation.id);
  }, [socket, isConnected, loadMessages]);

  const sendMessage = useCallback(async (content) => {
    if (!activeConvRef.current || !content.trim()) return false;
    const convId = activeConvRef.current.id;

    try {
      const res = await messageAPI.sendMessage(convId, content.trim());
      if (res.data.success) {
        // The API response includes sender — use it directly
        const msg = res.data.data;
        // Ensure sender is populated (fallback to current user if missing)
        if (!msg.sender && user) {
          msg.sender = { id: user.id, firstName: user.firstName, lastName: user.lastName };
        }
        setMessages((prev) => [...prev, msg]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, lastMessage: content.trim(), timestamp: 'Just now' } : c
          )
        );
      }
    } catch (err) {
      console.error('sendMessage error:', err.message);
      return false;
    }

    if (socket && isConnected) {
      socket.emit('typing:stop', { conversationId: convId });
    }
    return true;
  }, [socket, isConnected, user]);

  const sendTypingIndicator = useCallback((isTyping) => {
    if (!activeConvRef.current || !socket || !isConnected) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
      conversationId: activeConvRef.current.id,
    });
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', { conversationId: activeConvRef.current?.id });
      }, 2000);
    }
  }, [socket, isConnected]);

  const createConversation = useCallback(async (participantId, initialMessage) => {
    try {
      const res = await messageAPI.startConversation(participantId, initialMessage);
      if (res.data.success) {
        await loadConversations();
        return res.data.data;
      }
    } catch (err) {
      console.error('createConversation error:', err.message);
    }
    return null;
  }, [loadConversations]);

  return {
    isConnected,
    connect,
    disconnect,
    conversations,
    activeConversation,
    messages,
    unreadCounts,
    onlineUsers,
    typingUsers,
    loadingConversations,
    loadingMessages,
    loadConversations,
    selectConversation,
    sendMessage,
    sendTypingIndicator,
    createConversation,
    getTotalUnreadCount: () => Object.values(unreadCounts).reduce((s, c) => s + c, 0),
  };
};
