/**
 * MessagingLayout — shared WhatsApp-style messaging UI used by all roles.
 *
 * Features:
 *  - Real-time messages via Socket.io (useMessaging hook)
 *  - Conversation list with search, unread badges, online indicators
 *  - Message bubbles with timestamps, read receipts, typing indicator
 *  - Reply-to (double-click a bubble)
 *  - Emoji picker
 *  - Start new conversation with user search
 *  - Mobile-responsive (sidebar ↔ chat toggle)
 *  - Date separators between message groups
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useMessaging } from '../hooks/useMessaging';
import { useAuth } from '../contexts/AuthContext';
import axios from '../utils/axiosConfig.js';
import EmojiPicker from './EmojiPicker';
import PhoneLink from './PhoneLink';
import './MessagingLayout.css';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const ROLE_LABELS = {
  dealer:           { label: 'Dealer',           color: '#1565c0', bg: '#e3f2fd' },
  service_provider: { label: 'Service Provider', color: '#6a1b9a', bg: '#f3e5f5' },
  user:             { label: 'Customer',          color: '#2e7d32', bg: '#e8f5e9' },
  admin:            { label: 'Admin',             color: '#b71c1c', bg: '#fce4ec' },
};

const RoleBadge = ({ role }) => {
  if (!role) return null;
  const meta = ROLE_LABELS[role] || { label: role, color: '#555', bg: '#f5f5f5' };
  return (
    <span
      className="ml-role-badge"
      style={{ color: meta.color, background: meta.bg }}
    >
      {meta.label}
    </span>
  );
};
const fmtTime = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const fmtDate = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

const initials = (name = '') =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

const groupByDate = (messages) => {
  const groups = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const d = fmtDate(msg.createdAt || msg.created_at);
    if (d !== lastDate) {
      groups.push({ type: 'separator', label: d, key: `sep-${d}-${msg.id}` });
      lastDate = d;
    }
    groups.push({ type: 'message', data: msg, key: `msg-${msg.id}` });
  });
  return groups;
};

/* ─── Typing indicator ────────────────────────────────────────────────────── */
const TypingIndicator = () => (
  <div className="ml-bubble-wrap other">
    <div className="ml-typing">
      <span className="ml-typing-dot" />
      <span className="ml-typing-dot" />
      <span className="ml-typing-dot" />
    </div>
  </div>
);

/* ─── Single message bubble ───────────────────────────────────────────────── */
const Bubble = ({ msg, isOwn, onReply }) => {
  const time = fmtTime(msg.createdAt || msg.created_at);
  const isRead = msg.isRead || msg.is_read;

  return (
    <div className={`ml-bubble-wrap ${isOwn ? 'own' : 'other'}`}>
      <div
        className={`ml-bubble ${isOwn ? 'own' : 'other'}`}
        onDoubleClick={() => onReply(msg)}
        title="Double-click to reply"
      >
        {/* Reply preview */}
        {msg.replyTo && (
          <div className={`ml-reply-preview ${isOwn ? 'own' : ''}`}>
            <strong>{msg.replyTo.sender?.firstName || 'Message'}</strong>
            <div className="ml-reply-text">{msg.replyTo.content}</div>
          </div>
        )}

        {/* Sender name (for other's messages) */}
        {!isOwn && msg.sender && (
          <div className="ml-sender-name">
            {msg.sender.firstName} {msg.sender.lastName}
          </div>
        )}

        <div className="ml-text">{msg.content}</div>

        <div className="ml-meta">
          <span className="ml-time">{time}</span>
          {isOwn && (
            <span className={`ml-ticks ${isRead ? 'read' : ''}`}>
              {isRead ? '✓✓' : '✓'}
            </span>
          )}
          {msg.isEdited && <span className="ml-edited">(edited)</span>}
        </div>
      </div>
    </div>
  );
};

/* ─── New conversation modal ──────────────────────────────────────────────── */
const NewConvModal = ({ onClose, onCreate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimer = useRef(null);
  const messageRef = useRef(null);

  const searchUsers = useCallback(async (q) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    try {
      const res = await axios.get('/api/users/search', { params: { q, limit: 10 } });
      const data = res.data?.data || [];
      setResults(data);
      setShowResults(data.length > 0);
    } catch {
      setResults([]);
      setShowResults(false);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(null);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchUsers(val), 350);
  };

  // Use mousedown (fires before blur) so the click registers before dropdown hides
  const handleSelectMouseDown = (e, user) => {
    e.preventDefault(); // prevent input blur
    setSelected(user);
    setQuery(`${user.firstName} ${user.lastName}`);
    setResults([]);
    setShowResults(false);
    setTimeout(() => messageRef.current?.focus(), 50);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected || !message.trim()) return;
    setLoading(true);
    await onCreate(selected.id, message.trim());
    setLoading(false);
    onClose();
  };

  return (
    <div
      className="ml-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ml-modal-card">
        <div className="ml-modal-header">
          <h3>New Conversation</h3>
          <button className="ml-icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* User search */}
          <div className="ml-modal-field">
            <label className="ml-modal-label">To</label>
            <div className="ml-user-search-wrap">
              <input
                className="ml-modal-input"
                type="text"
                placeholder="Search by name or email…"
                value={query}
                onChange={handleQueryChange}
                onFocus={() => results.length > 0 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 150)}
                autoFocus
                autoComplete="off"
              />
              {searching && <span className="ml-search-spinner">⟳</span>}
              {showResults && results.length > 0 && (
                <ul className="ml-user-results">
                  {results.map((u) => (
                    <li
                      key={u.id}
                      className="ml-user-result-item"
                      onMouseDown={(e) => handleSelectMouseDown(e, u)}
                    >
                      <div className="ml-user-result-avatar">
                        {initials(`${u.firstName} ${u.lastName}`)}
                      </div>
                      <div className="ml-user-result-info">
                        <span className="ml-user-result-name">
                          {u.firstName} {u.lastName}
                        </span>
                        <span className="ml-user-result-role">{u.role}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selected ? (
              <div className="ml-selected-user">
                <span className="ml-selected-avatar">
                  {initials(`${selected.firstName} ${selected.lastName}`)}
                </span>
                <span>{selected.firstName} {selected.lastName}</span>
                <span className="ml-selected-role">{selected.role}</span>
                <button
                  type="button"
                  className="ml-icon-btn small"
                  onClick={() => { setSelected(null); setQuery(''); }}
                  aria-label="Remove selected user"
                >
                  ✕
                </button>
              </div>
            ) : query.length > 0 && !searching && results.length === 0 && (
              <p className="ml-no-results">No users found. Try a different name or email.</p>
            )}
          </div>

          {/* Message */}
          <div className="ml-modal-field">
            <label className="ml-modal-label">Message</label>
            <textarea
              ref={messageRef}
              className="ml-modal-textarea"
              placeholder="Type your first message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="ml-modal-actions">
            <button type="button" className="ml-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="ml-btn-start"
              disabled={loading || !selected || !message.trim()}
              title={!selected ? 'Select a recipient first' : !message.trim() ? 'Type a message' : ''}
            >
              {loading ? 'Starting…' : 'Start Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Main MessagingLayout ────────────────────────────────────────────────── */
const MessagingLayout = ({ title = 'Messages', roleLabel = '' }) => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    typingUsers,
    onlineUsers,
    unreadCounts,
    isConnected,
    loadingConversations,
    loadingMessages,
    selectConversation,
    sendMessage,
    sendTypingIndicator,
    createConversation,
    getTotalUnreadCount,
  } = useMessaging();

  const [search, setSearch] = useState('');
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showNewConv, setShowNewConv] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimerRef = useRef(null);

  /* Auto-scroll on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* Auto-resize textarea */
  const resizeTextarea = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    resizeTextarea();
    // Typing indicator
    clearTimeout(typingTimerRef.current);
    sendTypingIndicator(true);
    typingTimerRef.current = setTimeout(() => sendTypingIndicator(false), 2000);
  };

  const handleSend = useCallback(async () => {
    if (!text.trim()) return;
    const ok = await sendMessage(text.trim());
    if (ok !== false) {
      setText('');
      setReplyTo(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      sendTypingIndicator(false);
    }
  }, [text, sendMessage, sendTypingIndicator]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectConv = (conv) => {
    selectConversation(conv);
    setMobileChatOpen(true);
  };

  const handleBackToList = () => {
    setMobileChatOpen(false);
  };

  const handleCreateConversation = async (participantId, initialMessage) => {
    const conv = await createConversation(participantId, initialMessage);
    if (conv) {
      setMobileChatOpen(true);
    }
  };

  /* Filtered conversations */
  const filteredConvs = conversations.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  /* Grouped messages with date separators */
  const grouped = groupByDate(messages);

  /* Is the other participant online? */
  const otherUserId = activeConversation
    ? activeConversation.participant1 === user?.id
      ? activeConversation.participant2
      : activeConversation.participant1
    : null;
  const isOtherOnline = otherUserId != null && onlineUsers.has(otherUserId);
  const isTyping = typingUsers.size > 0;
  const totalUnread = getTotalUnreadCount();

  return (
    <div className="ml-page">
      {/* ── Sidebar ── */}
      <div className={`ml-sidebar ${mobileChatOpen ? 'ml-hidden' : ''}`}>
        {/* Header */}
        <div className="ml-sidebar-header">
          <div className="ml-sidebar-title-row">
            <h2 className="ml-sidebar-title">
              {title}
              {totalUnread > 0 && (
                <span className="ml-total-unread">{totalUnread}</span>
              )}
            </h2>
            {isConnected && <span className="ml-live-badge">Live</span>}
          </div>
          <button
            className="ml-icon-btn"
            title="New conversation"
            onClick={() => setShowNewConv(true)}
            aria-label="New conversation"
          >
            ✏️
          </button>
        </div>

        {/* Search */}
        <div className="ml-search-wrap">
          <div className="ml-search">
            <span className="ml-search-icon">🔍</span>
            <input
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search conversations"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="ml-conv-list" role="list">
          {loadingConversations ? (
            <div className="ml-state-msg">
              <span className="ml-spinner" />
              Loading…
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="ml-state-msg">
              {search ? 'No results' : 'No conversations yet'}
              {!search && (
                <button
                  className="ml-btn-start"
                  style={{ marginTop: 12 }}
                  onClick={() => setShowNewConv(true)}
                >
                  Start one
                </button>
              )}
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const unread = unreadCounts[conv.id] || 0;
              const isActive = activeConversation?.id === conv.id;
              const convOtherId =
                conv.participant1 === user?.id ? conv.participant2 : conv.participant1;
              const convIsOnline = onlineUsers.has(convOtherId);

              return (
                <div
                  key={conv.id}
                  className={`ml-conv-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectConv(conv)}
                  role="listitem"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectConv(conv)}
                >
                  <div className="ml-conv-avatar">
                    {initials(conv.name)}
                    {convIsOnline && <span className="ml-online-dot" />}
                  </div>
                  <div className="ml-conv-info">
                    <div className="ml-conv-top">
                      <span className={`ml-conv-name ${unread > 0 ? 'bold' : ''}`}>
                        {conv.name}
                      </span>
                      <span className={`ml-conv-time ${unread > 0 ? 'unread' : ''}`}>
                        {conv.timestamp}
                      </span>
                    </div>
                    <div className="ml-conv-bottom">
                      <span className="ml-conv-preview">{conv.lastMessage}</span>
                      {unread > 0 && (
                        <span className="ml-unread-badge">{unread > 99 ? '99+' : unread}</span>
                      )}
                    </div>
                    <div className="ml-conv-meta-row">
                      {conv.otherRole && <RoleBadge role={conv.otherRole} />}
                      {conv.otherPhone && (
                        <PhoneLink
                          phone={conv.otherPhone}
                          size="sm"
                          className="ml-conv-phone"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      {activeConversation ? (
        <div className={`ml-chat ${!mobileChatOpen ? 'ml-hidden' : ''}`}>
          {/* Chat header */}
          <div className="ml-chat-header">
            <div className="ml-chat-header-left">
              <button
                className="ml-icon-btn ml-back-btn"
                onClick={handleBackToList}
                aria-label="Back to conversations"
              >
                ←
              </button>
              <div className="ml-chat-avatar">
                {initials(activeConversation.name)}
                {isOtherOnline && <span className="ml-online-dot" />}
              </div>
              <div className="ml-chat-info">
                <div className="ml-chat-name-row">
                  <h3 className="ml-chat-name">{activeConversation.name}</h3>
                  <RoleBadge role={activeConversation.otherRole} />
                </div>
                {activeConversation.otherBusinessName && (
                  <p className="ml-chat-business">
                    🏢 {activeConversation.otherBusinessName}
                  </p>
                )}
                <p className={`ml-chat-status ${isOtherOnline ? 'online' : ''}`}>
                  {isTyping ? 'typing…' : isOtherOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="ml-chat-header-actions">
              {activeConversation.otherPhone && (
                <PhoneLink
                  phone={activeConversation.otherPhone}
                  showIcon={true}
                  label=""
                  size="sm"
                  className="ml-call-btn"
                />
              )}
              <button className="ml-icon-btn" title="Search in chat" aria-label="Search in chat">
                🔍
              </button>
              <button className="ml-icon-btn" title="More options" aria-label="More options">
                ⋮
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="ml-messages" role="log" aria-live="polite">
            {loadingMessages ? (
              <div className="ml-state-msg">
                <span className="ml-spinner" />
                Loading messages…
              </div>
            ) : grouped.length === 0 ? (
              <div className="ml-state-msg">No messages yet. Say hello!</div>
            ) : (
              grouped.map((item) =>
                item.type === 'separator' ? (
                  <div key={item.key} className="ml-date-sep">
                    <span>{item.label}</span>
                  </div>
                ) : (
                  <Bubble
                    key={item.key}
                    msg={item.data}
                    isOwn={
                      (item.data.senderId || item.data.sender_id) === user?.id
                    }
                    onReply={setReplyTo}
                  />
                )
              )
            )}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply bar */}
          {replyTo && (
            <div className="ml-reply-bar">
              <div className="ml-reply-bar-content">
                <div className="ml-reply-bar-name">
                  {replyTo.sender?.firstName || 'Message'}
                </div>
                <div className="ml-reply-bar-text">{replyTo.content}</div>
              </div>
              <button
                className="ml-icon-btn"
                onClick={() => setReplyTo(null)}
                aria-label="Cancel reply"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input area */}
          <div className="ml-input-area">
            <button
              className="ml-icon-btn"
              title="Attach file"
              aria-label="Attach file"
            >
              📎
            </button>
            <div className="ml-input-wrap">
              <button
                className="ml-icon-btn"
                title="Emoji"
                aria-label="Open emoji picker"
                onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
              >
                😊
              </button>
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Type a message"
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                aria-label="Message input"
              />
            </div>
            <button
              className="ml-send-btn"
              onClick={handleSend}
              disabled={!text.trim()}
              aria-label="Send message"
            >
              ➤
            </button>
          </div>

          {/* Emoji picker */}
          <EmojiPicker
            anchorEl={emojiAnchorEl}
            open={Boolean(emojiAnchorEl)}
            onClose={() => setEmojiAnchorEl(null)}
            onEmojiSelect={(emoji) => {
              setText((prev) => prev + emoji);
              setEmojiAnchorEl(null);
              textareaRef.current?.focus();
            }}
          />
        </div>
      ) : (
        /* Empty state */
        <div className={`ml-chat ml-chat-empty ${mobileChatOpen ? '' : ''}`}>
          <div className="ml-empty-icon">💬</div>
          <h3>AutoSphere Messages</h3>
          <p>Select a conversation or start a new one</p>
          <button
            className="ml-btn-start"
            style={{ marginTop: 16 }}
            onClick={() => setShowNewConv(true)}
          >
            New Conversation
          </button>
        </div>
      )}

      {/* New conversation modal */}
      {showNewConv && (
        <NewConvModal
          onClose={() => setShowNewConv(false)}
          onCreate={handleCreateConversation}
        />
      )}
    </div>
  );
};

export default MessagingLayout;
