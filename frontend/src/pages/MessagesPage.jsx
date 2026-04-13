import { useState, useEffect, useRef, useCallback } from 'react';
import { useMessaging } from '../hooks/useMessaging';
import { useAuth } from '../contexts/AuthContext';
import './MessagesPage.css';

/* ── helpers ── */
const formatTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

const getInitials = (name = '') =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

const groupByDate = (messages) => {
  const groups = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const d = formatDate(msg.createdAt || msg.created_at);
    if (d !== lastDate) {
      groups.push({ type: 'separator', label: d });
      lastDate = d;
    }
    groups.push({ type: 'message', data: msg });
  });
  return groups;
};

/* ── Typing indicator ── */
const TypingIndicator = () => (
  <div className="msg-bubble-wrap other">
    <div className="typing-indicator">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  </div>
);

/* ── Single message bubble ── */
const Bubble = ({ msg, isOwn, onReply }) => {
  const time = formatTime(msg.createdAt || msg.created_at);
  const isRead = msg.isRead || msg.is_read;

  return (
    <div className={`msg-bubble-wrap ${isOwn ? 'own' : 'other'}`}>
      <div
        className={`msg-bubble ${isOwn ? 'own' : 'other'}`}
        onDoubleClick={() => onReply(msg)}
        title="Double-click to reply"
      >
        {/* Reply preview */}
        {msg.replyTo && (
          <div className={`msg-reply-preview ${isOwn ? 'own' : ''}`}>
            <strong>{msg.replyTo.sender?.firstName || 'Message'}</strong>
            <div>{msg.replyTo.content}</div>
          </div>
        )}

        {!isOwn && msg.sender && (
          <div className="msg-sender-name">
            {msg.sender.firstName} {msg.sender.lastName}
          </div>
        )}

        <div className="msg-text">{msg.content}</div>

        <div className="msg-meta">
          <span className="msg-time">{time}</span>
          {isOwn && (
            <span className={`msg-ticks ${isRead ? 'read' : ''}`}>
              {isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── New conversation modal ── */
const NewConvModal = ({ onClose, onCreate }) => {
  const [participantId, setParticipantId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!participantId || !message.trim()) return;
    setLoading(true);
    await onCreate(parseInt(participantId), message.trim());
    setLoading(false);
    onClose();
  };

  return (
    <div className="new-conv-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="new-conv-card">
        <h3>New Conversation</h3>
        <form onSubmit={handleSubmit}>
          <input
            className="new-conv-input"
            type="number"
            placeholder="Recipient User ID"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            required
          />
          <textarea
            className="new-conv-textarea"
            placeholder="Type your first message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <div className="new-conv-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn-start"
              disabled={loading || !participantId || !message.trim()}
            >
              {loading ? 'Starting...' : 'Start Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main MessagesPage ── */
const MessagesPage = () => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    typingUsers,
    onlineUsers,
    unreadCounts,
    loadingConversations,
    loadingMessages,
    selectConversation,
    sendMessage,
    sendTypingIndicator,
    createConversation,
  } = useMessaging();

  const [search, setSearch] = useState('');
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showNewConv, setShowNewConv] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleTextChange = (e) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
    }
    // Typing indicator
    if (typingRef.current) clearTimeout(typingRef.current);
    sendTypingIndicator(true);
    typingRef.current = setTimeout(() => sendTypingIndicator(false), 2000);
  };

  const handleSend = useCallback(async () => {
    if (!text.trim()) return;
    const ok = await sendMessage(text.trim());
    if (ok) {
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

  const filteredConvs = conversations.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = groupByDate(messages);
  const isTyping = typingUsers.size > 0;
  const otherUserId = activeConversation
    ? (activeConversation.participant1 === user?.id
        ? activeConversation.participant2
        : activeConversation.participant1)
    : null;
  const isOnline = otherUserId && onlineUsers.has(otherUserId);

  return (
    <div className="messages-page">
      {/* ── Sidebar ── */}
      <div className={`msg-sidebar ${mobileChatOpen ? 'hidden' : ''}`}>
        <div className="msg-sidebar-header">
          <h2 className="msg-sidebar-title">Messages</h2>
          <div className="msg-sidebar-actions">
            <button
              className="msg-icon-btn"
              title="New conversation"
              onClick={() => setShowNewConv(true)}
            >
              ✏️
            </button>
          </div>
        </div>

        <div className="msg-search-wrap">
          <div className="msg-search">
            <span className="msg-search-icon">🔍</span>
            <input
              placeholder="Search or start new chat"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="conv-list">
          {loadingConversations ? (
            <div className="msg-loading">Loading conversations...</div>
          ) : filteredConvs.length === 0 ? (
            <div className="msg-loading">
              {search ? 'No results' : 'No conversations yet'}
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const unread = unreadCounts[conv.id] || 0;
              const isActive = activeConversation?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  className={`conv-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectConv(conv)}
                >
                  <div className="conv-avatar">
                    {getInitials(conv.name)}
                    {onlineUsers.has(otherUserId) && isActive && (
                      <span className="online-dot" />
                    )}
                  </div>
                  <div className="conv-info">
                    <div className="conv-info-top">
                      <span className="conv-name">{conv.name}</span>
                      <span className={`conv-time ${unread > 0 ? 'unread' : ''}`}>
                        {conv.timestamp}
                      </span>
                    </div>
                    <div className="conv-info-bottom">
                      <span className="conv-preview">{conv.lastMessage}</span>
                      {unread > 0 && (
                        <span className="unread-badge">{unread}</span>
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
        <div className={`msg-chat ${!mobileChatOpen ? 'hidden' : ''}`}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <button
                className="msg-icon-btn"
                onClick={handleBackToList}
                style={{ display: 'none' }}
                id="back-btn"
              >
                ←
              </button>
              <div className="conv-avatar" style={{ width: 40, height: 40, fontSize: '0.875rem' }}>
                {getInitials(activeConversation.name)}
                {isOnline && <span className="online-dot" />}
              </div>
              <div className="chat-header-info">
                <h3>{activeConversation.name}</h3>
                <p className={isOnline ? 'online' : ''}>
                  {isTyping ? 'typing...' : isOnline ? 'online' : 'offline'}
                </p>
              </div>
            </div>
            <div className="msg-sidebar-actions">
              <button className="msg-icon-btn" title="Search in chat">🔍</button>
              <button className="msg-icon-btn" title="More options">⋮</button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {loadingMessages ? (
              <div className="msg-loading">Loading messages...</div>
            ) : (
              grouped.map((item, i) =>
                item.type === 'separator' ? (
                  <div key={`sep-${i}`} className="date-separator">
                    <span>{item.label}</span>
                  </div>
                ) : (
                  <Bubble
                    key={item.data.id}
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
            <div className="reply-bar">
              <div className="reply-bar-content">
                <div className="reply-bar-name">
                  {replyTo.sender?.firstName || 'Message'}
                </div>
                <div className="reply-bar-text">{replyTo.content}</div>
              </div>
              <button className="msg-icon-btn" onClick={() => setReplyTo(null)}>✕</button>
            </div>
          )}

          {/* Input */}
          <div className="chat-input-area">
            <button className="msg-icon-btn" title="Attach file">📎</button>
            <div className="chat-input-wrap">
              <button className="msg-icon-btn" title="Emoji">😊</button>
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Type a message"
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!text.trim()}
              title="Send"
            >
              ➤
            </button>
          </div>
        </div>
      ) : (
        <div className={`msg-chat chat-empty ${mobileChatOpen ? '' : ''}`}>
          <div className="chat-empty-icon">💬</div>
          <h3>AutoSphere Messages</h3>
          <p>Select a conversation or start a new one</p>
          <button
            className="btn-start"
            style={{ marginTop: 8 }}
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
          onCreate={createConversation}
        />
      )}
    </div>
  );
};

export default MessagesPage;
