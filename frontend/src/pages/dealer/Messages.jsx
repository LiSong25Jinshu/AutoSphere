import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { messageAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Messages.css';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

const DealerMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const activeConvRef = useRef(null);

  // keep ref in sync so socket handler always has current conversation id
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await messageAPI.getConversations();
      setConversations(res.data?.data || []);
    } catch {
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect socket once on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('new_message', (msg) => {
      // Append to open conversation
      if (msg.conversationId === activeConvRef.current?.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      // Bump conversation preview + unread count
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessage: { content: msg.content, createdAt: msg.createdAt },
                unreadCount: c.id === activeConvRef.current?.id ? 0 : (c.unreadCount || 0) + 1,
              }
            : c
        )
      );
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectConversation = async (conv) => {
    setActiveConv(conv);
    setMsgLoading(true);
    try {
      const res = await messageAPI.getMessages(conv.id);
      setMessages(res.data?.data || []);
      // mark as read locally
      setConversations((prev) =>
        prev.map((c) => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
      );
    } catch {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const res = await messageAPI.sendMessage(activeConv.id, newMsg.trim());
      const sent = res.data?.data;
      // Only add locally if socket hasn't already delivered it
      setMessages((prev) => prev.some((m) => m.id === sent?.id) ? prev : [...prev, sent]);
      setConversations((prev) =>
        prev.map((c) => c.id === activeConv.id
          ? { ...c, lastMessage: { content: newMsg.trim(), createdAt: new Date().toISOString() } }
          : c
        )
      );
      setNewMsg('');
    } catch {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conv) => {
    if (conv.otherParticipant) return conv.otherParticipant;
    const p1 = conv.firstParticipant;
    const p2 = conv.secondParticipant;
    if (!p1 || !p2) return null;
    return p1.id === user?.id ? p2 : p1;
  };

  const initials = (p) => p ? `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase() : '?';
  const fullName = (p) => p ? `${p.firstName} ${p.lastName}` : 'Unknown';
  const fmt = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const fmtDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts), today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yest = new Date(today); yest.setDate(yest.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  return (
    <div className="dealer-messages-page">
      <div className="dm-sidebar">
        <div className="dm-sidebar-header">
          <h2>Messages</h2>
          {conversations.length > 0 && (
            <span className="dm-count">
              {conversations.reduce((a, c) => a + (c.unreadCount || 0), 0)} unread
            </span>
          )}
        </div>

        {loading ? (
          <div className="dm-loading">Loading...</div>
        ) : error ? (
          <div className="dm-error">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="dm-empty-list">No conversations yet</div>
        ) : (
          <div className="dm-conversations">
            {conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              return (
                <div
                  key={conv.id}
                  className={`dm-conv-item ${activeConv?.id === conv.id ? 'active' : ''}`}
                  onClick={() => selectConversation(conv)}
                >
                  <div className="dm-avatar">{initials(other)}</div>
                  <div className="dm-conv-info">
                    <div className="dm-conv-top">
                      <span className="dm-conv-name">{fullName(other)}</span>
                      <span className="dm-conv-time">{fmtDate(conv.lastMessage?.createdAt || conv.updatedAt)}</span>
                    </div>
                    <p className="dm-conv-preview">{conv.lastMessage?.content || 'No messages yet'}</p>
                  </div>
                  {conv.unreadCount > 0 && <div className="dm-unread">{conv.unreadCount}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="dm-main">
        {activeConv ? (
          <>
            <div className="dm-chat-header">
              <div className="dm-avatar large">{initials(getOtherParticipant(activeConv))}</div>
              <div>
                <h3>{fullName(getOtherParticipant(activeConv))}</h3>
                <span className="dm-chat-sub">Customer</span>
              </div>
            </div>

            <div className="dm-messages">
              {msgLoading ? (
                <div className="dm-loading">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="dm-no-msgs">No messages yet. Start the conversation!</div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === user?.id || msg.sender?.id === user?.id;
                  return (
                    <div key={msg.id} className={`dm-message ${isOwn ? 'own' : 'other'}`}>
                      <div className="dm-bubble">
                        <p>{msg.content}</p>
                        <span className="dm-time">{fmt(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="dm-input-area" onSubmit={sendMessage}>
              <input
                className="dm-input"
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
              />
              <button type="submit" className="dm-send-btn" disabled={!newMsg.trim() || sending}>
                {sending ? '...' : 'Send ➤'}
              </button>
            </form>
          </>
        ) : (
          <div className="dm-empty">
            <div className="dm-empty-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose a customer inquiry from the left to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerMessages;
