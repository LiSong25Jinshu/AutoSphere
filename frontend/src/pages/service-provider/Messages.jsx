import { useState, useEffect, useRef, useCallback } from 'react';
import { messageAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Messages.css';

const ServiceProviderMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await messageAPI.getConversations();
      setConversations(res.data?.data || []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const selectConv = async (conv) => {
    setActiveConv(conv);
    setMsgLoading(true);
    try {
      const res = await messageAPI.getMessages(conv.id);
      setMessages(res.data?.data || []);
      setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
    } catch { setMessages([]); }
    finally { setMsgLoading(false); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const res = await messageAPI.sendMessage(activeConv.id, input.trim());
      const sent = res.data?.data || res.data;
      setMessages((prev) => [...prev, sent]);
      setConversations((prev) =>
        prev.map((c) => c.id === activeConv.id
          ? { ...c, lastMessage: { content: input.trim(), createdAt: new Date().toISOString() } }
          : c
        )
      );
      setInput('');
    } catch { alert('Failed to send'); }
    finally { setSending(false); }
  };

  const getOther = (conv) => {
    if (conv.otherParticipant) return conv.otherParticipant;
    const p1 = conv.firstParticipant, p2 = conv.secondParticipant;
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

  const filtered = conversations.filter((c) => {
    const other = getOther(c);
    return fullName(other).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="sp-messages-page">
      <div className="sp-msg-sidebar">
        <div className="sp-msg-sidebar-header">
          <h2>Messages</h2>
          <input type="text" placeholder="Search..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="sp-msg-search" />
        </div>
        <div className="sp-msg-list">
          {loading ? (
            <div className="sp-msg-loading">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="sp-msg-empty-list">No conversations</div>
          ) : (
            filtered.map((c) => {
              const other = getOther(c);
              return (
                <div key={c.id}
                  className={'sp-msg-item' + (c.id === activeConv?.id ? ' active' : '')}
                  onClick={() => selectConv(c)}
                >
                  <div className="sp-msg-avatar">{initials(other)}</div>
                  <div className="sp-msg-info">
                    <div className="sp-msg-name-row">
                      <span className="sp-msg-name">{fullName(other)}</span>
                      <span className="sp-msg-time">{fmtDate(c.lastMessage?.createdAt || c.updatedAt)}</span>
                    </div>
                    <div className="sp-msg-preview-row">
                      <span className="sp-msg-preview">{c.lastMessage?.content || 'No messages yet'}</span>
                      {c.unreadCount > 0 && <span className="sp-msg-badge">{c.unreadCount}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="sp-msg-chat">
        {activeConv ? (
          <>
            <div className="sp-msg-chat-header">
              <div className="sp-msg-avatar">{initials(getOther(activeConv))}</div>
              <div>
                <div className="sp-msg-chat-name">{fullName(getOther(activeConv))}</div>
                <div className="sp-msg-chat-status">Customer</div>
              </div>
            </div>

            <div className="sp-msg-chat-body">
              {msgLoading ? (
                <div className="sp-msg-loading">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="sp-msg-no-msgs">No messages yet</div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.id || msg.sender?.id === user?.id;
                  return (
                    <div key={msg.id} className={'sp-msg-bubble-wrap' + (isMe ? ' me' : '')}>
                      <div className={'sp-msg-bubble' + (isMe ? ' me' : '')}>
                        <p>{msg.content}</p>
                        <span className="sp-msg-bubble-time">{fmt(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            <form className="sp-msg-input-row" onSubmit={sendMessage}>
              <input type="text" placeholder="Type a message..." value={input}
                onChange={(e) => setInput(e.target.value)} className="sp-msg-input" disabled={sending} />
              <button type="submit" className="sp-msg-send-btn" disabled={!input.trim() || sending}>
                {sending ? '...' : 'Send'}
              </button>
            </form>
          </>
        ) : (
          <div className="sp-msg-empty">Select a conversation to start messaging</div>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderMessages;
