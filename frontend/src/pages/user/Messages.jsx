import { useState, useEffect, useRef } from 'react';
import { useMessaging } from '../../hooks/useMessaging';
import './Messages.css';

const TYPE_LABELS = { service_provider: 'Service Provider', dealer: 'Dealer', user: 'User' };
const TYPE_COLORS = { service_provider: '#9c27b0', dealer: '#ff9800', user: '#2196f3' };

const UserMessages = () => {
  const messaging = useMessaging();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messaging.messages]);

  const filtered = messaging.conversations.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleInput = (e) => {
    setInput(e.target.value);
    if (!typing) {
      setTyping(true);
      messaging.sendTypingIndicator(true);
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setTyping(false);
      messaging.sendTypingIndicator(false);
    }, 1500);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await messaging.sendMessage(input.trim());
    setInput('');
    setTyping(false);
  };

  const isOnline = (conv) => messaging.onlineUsers.has(conv.otherParticipant?.id);

  return (
    <div className="um-page">
      <div className="um-sidebar">
        <div className="um-sidebar-top">
          <h2>Messages</h2>
          {messaging.isConnected && <span className="um-live-badge">Live</span>}
        </div>
        <div className="um-search-wrap">
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="um-search"
          />
        </div>
        <div className="um-conv-list">
          {messaging.loadingConversations && (
            <div className="um-empty-list">Loading...</div>
          )}
          {!messaging.loadingConversations && filtered.length === 0 && (
            <div className="um-empty-list">No conversations yet</div>
          )}
          {filtered.map((conv) => {
            const unread = messaging.unreadCounts[conv.id] || 0;
            const online = isOnline(conv);
            const isActive = messaging.activeConversation?.id === conv.id;
            const role = conv.otherParticipant?.role;
            return (
              <div
                key={conv.id}
                className={'um-conv-item' + (isActive ? ' active' : '')}
                onClick={() => messaging.selectConversation(conv)}
              >
                <div className="um-conv-avatar-wrap">
                  <div className="um-conv-avatar">{conv.avatar}</div>
                  {online && <span className="um-online-dot" />}
                </div>
                <div className="um-conv-info">
                  <div className="um-conv-top">
                    <span className="um-conv-name">{conv.name}</span>
                    <span className="um-conv-time">{conv.timestamp}</span>
                  </div>
                  <div className="um-conv-bottom">
                    <span className="um-conv-preview">{conv.lastMessage}</span>
                    {unread > 0 && <span className="um-unread-badge">{unread}</span>}
                  </div>
                  {role && (
                    <span
                      className="um-type-tag"
                      style={{ background: TYPE_COLORS[role] || '#666' }}
                    >
                      {TYPE_LABELS[role] || role}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="um-chat">
        {messaging.activeConversation ? (
          <>
            <div className="um-chat-header">
              <div className="um-chat-avatar-wrap">
                <div className="um-chat-avatar">{messaging.activeConversation.avatar}</div>
                {isOnline(messaging.activeConversation) && <span className="um-online-dot" />}
              </div>
              <div className="um-chat-info">
                <div className="um-chat-name">{messaging.activeConversation.name}</div>
                <div className="um-chat-status">
                  {isOnline(messaging.activeConversation)
                    ? <span className="um-status-online">Online</span>
                    : <span className="um-status-offline">Offline</span>}
                </div>
              </div>
            </div>

            <div className="um-messages">
              {messaging.loadingMessages && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#999' }}>
                  Loading messages...
                </div>
              )}
              {messaging.messages.map((msg) => {
                const isMe = msg.senderId === messaging.activeConversation?.participant1;
                return (
                  <div key={msg.id} className={'um-msg-wrap' + (isMe ? ' me' : '')}>
                    <div className={'um-msg' + (isMe ? ' me' : '')}>
                      <p>{msg.content}</p>
                      <span className="um-msg-time">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
              {messaging.typingUsers.size > 0 && (
                <div className="um-typing-indicator"><span /><span /><span /></div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="um-input-row" onSubmit={sendMessage}>
              <input
                type="text"
                className="um-input"
                placeholder="Type a message..."
                value={input}
                onChange={handleInput}
              />
              <button type="submit" className="um-send-btn" disabled={!input.trim()}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="um-no-chat">
            <div className="um-no-chat-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose from your conversations to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMessages;
