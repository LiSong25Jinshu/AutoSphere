import { useState, useEffect, useRef } from 'react';
import { useMessaging } from '../../hooks/useMessaging';
import './Messages.css';

const MOCK_CONVERSATIONS = [
  {
    id: 1,
    name: 'QuickFix Motors',
    type: 'service_provider',
    avatar: 'QF',
    online: true,
    lastMessage: 'Your oil change is confirmed for tomorrow at 10 AM.',
    timestamp: '2 hours ago',
    unread: 2,
    messages: [
      { id: 1, sender: 'other', content: 'Hello! Thank you for booking with us.', timestamp: '10:00 AM' },
      { id: 2, sender: 'me', content: 'Hi, I wanted to confirm my appointment time.', timestamp: '10:15 AM' },
      { id: 3, sender: 'other', content: 'Your oil change is confirmed for tomorrow at 10 AM.', timestamp: '2:30 PM' },
    ],
  },
  {
    id: 2,
    name: 'AutoCare Plus',
    type: 'service_provider',
    avatar: 'AC',
    online: false,
    lastMessage: 'We have your brake pads in stock now.',
    timestamp: 'Yesterday',
    unread: 0,
    messages: [
      { id: 1, sender: 'me', content: 'Do you have brake pads for a 2020 Civic?', timestamp: 'Yesterday 4:00 PM' },
      { id: 2, sender: 'other', content: 'We have your brake pads in stock now.', timestamp: 'Yesterday 4:45 PM' },
    ],
  },
  {
    id: 3,
    name: 'City Motors Dealer',
    type: 'dealer',
    avatar: 'CM',
    online: true,
    lastMessage: 'The Honda Civic you inquired about is still available.',
    timestamp: '2 days ago',
    unread: 1,
    messages: [
      { id: 1, sender: 'me', content: 'Is the 2022 Honda Civic still available?', timestamp: '2 days ago' },
      { id: 2, sender: 'other', content: 'The Honda Civic you inquired about is still available.', timestamp: '2 days ago' },
    ],
  },
  {
    id: 4,
    name: 'Premium Auto Group',
    type: 'dealer',
    avatar: 'PA',
    online: false,
    lastMessage: 'We can schedule a test drive this weekend.',
    timestamp: '3 days ago',
    unread: 0,
    messages: [
      { id: 1, sender: 'other', content: 'We can schedule a test drive this weekend.', timestamp: '3 days ago' },
    ],
  },
];

const TYPE_LABELS = { service_provider: 'Service Provider', dealer: 'Dealer' };
const TYPE_COLORS = { service_provider: '#9c27b0', dealer: '#ff9800' };

const UserMessages = () => {
  const messaging = useMessaging();
  const [useMock, setUseMock] = useState(true);
  const [mockConversations, setMockConversations] = useState(MOCK_CONVERSATIONS);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Try to connect to real socket
  useEffect(() => {
    try {
      messaging.connect();
    } catch {
      // stay in mock mode
    }
  }, []);

  // Switch to real mode if socket connects
  useEffect(() => {
    if (messaging.isConnected) {
      setUseMock(false);
      messaging.loadConversations();
    }
  }, [messaging.isConnected]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, mockConversations, messaging.messages]);

  const conversations = useMock ? mockConversations : messaging.conversations;

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeConv = useMock
    ? mockConversations.find((c) => c.id === activeId)
    : messaging.activeConversation;

  const activeMessages = useMock
    ? (activeConv?.messages || [])
    : messaging.messages;

  const selectConversation = (conv) => {
    if (useMock) {
      setActiveId(conv.id);
      // Clear unread
      setMockConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread: 0 } : c))
      );
    } else {
      messaging.selectConversation(conv);
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    if (!useMock) {
      if (!typing) {
        setTyping(true);
        messaging.sendTypingIndicator(true);
      }
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setTyping(false);
        messaging.sendTypingIndicator(false);
      }, 1500);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (useMock) {
      if (!activeId) return;
      const msg = { id: Date.now(), sender: 'me', content: input.trim(), timestamp: 'Just now' };
      setMockConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, msg], lastMessage: input.trim(), timestamp: 'Just now' }
            : c
        )
      );
    } else {
      messaging.sendMessage(input.trim());
    }
    setInput('');
    setTyping(false);
  };

  const getUnread = (conv) => {
    if (useMock) return conv.unread || 0;
    return messaging.unreadCounts[conv.id] || 0;
  };

  const isOnline = (conv) => {
    if (useMock) return conv.online;
    return messaging.onlineUsers.has(conv.participantId);
  };

  return (
    <div className="um-page">
      {/* Sidebar */}
      <div className="um-sidebar">
        <div className="um-sidebar-top">
          <h2>Messages</h2>
          {!useMock && messaging.isConnected && (
            <span className="um-live-badge">Live</span>
          )}
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
          {filtered.length === 0 && (
            <div className="um-empty-list">No conversations found</div>
          )}
          {filtered.map((conv) => {
            const unread = getUnread(conv);
            const online = isOnline(conv);
            const isActive = useMock ? conv.id === activeId : messaging.activeConversation?.id === conv.id;
            return (
              <div
                key={conv.id}
                className={'um-conv-item' + (isActive ? ' active' : '')}
                onClick={() => selectConversation(conv)}
              >
                <div className="um-conv-avatar-wrap">
                  <div className="um-conv-avatar">{conv.avatar || conv.name?.slice(0, 2).toUpperCase()}</div>
                  {online && <span className="um-online-dot" />}
                </div>
                <div className="um-conv-info">
                  <div className="um-conv-top">
                    <span className="um-conv-name">{conv.name}</span>
                    <span className="um-conv-time">{conv.timestamp || conv.lastMessageAt}</span>
                  </div>
                  <div className="um-conv-bottom">
                    <span className="um-conv-preview">{conv.lastMessage}</span>
                    {unread > 0 && <span className="um-unread-badge">{unread}</span>}
                  </div>
                  <span
                    className="um-type-tag"
                    style={{ background: TYPE_COLORS[conv.type] || '#666' }}
                  >
                    {TYPE_LABELS[conv.type] || conv.type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="um-chat">
        {activeConv ? (
          <>
            <div className="um-chat-header">
              <div className="um-chat-avatar-wrap">
                <div className="um-chat-avatar">
                  {activeConv.avatar || activeConv.name?.slice(0, 2).toUpperCase()}
                </div>
                {isOnline(activeConv) && <span className="um-online-dot" />}
              </div>
              <div className="um-chat-info">
                <div className="um-chat-name">{activeConv.name}</div>
                <div className="um-chat-status">
                  {isOnline(activeConv) ? (
                    <span className="um-status-online">Online</span>
                  ) : (
                    <span className="um-status-offline">Offline</span>
                  )}
                  {' · '}
                  <span>{TYPE_LABELS[activeConv.type] || activeConv.type}</span>
                </div>
              </div>
            </div>

            <div className="um-messages">
              {activeMessages.map((msg) => {
                const isMe = msg.sender === 'me' || msg.senderId === (messaging.user?.id);
                return (
                  <div key={msg.id} className={'um-msg-wrap' + (isMe ? ' me' : '')}>
                    <div className={'um-msg' + (isMe ? ' me' : '')}>
                      <p>{msg.content || msg.message}</p>
                      <span className="um-msg-time">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })}
              {!useMock && messaging.typingUsers.size > 0 && (
                <div className="um-typing-indicator">
                  <span /><span /><span />
                </div>
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
