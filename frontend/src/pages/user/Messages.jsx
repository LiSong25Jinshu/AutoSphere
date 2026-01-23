import { useState, useEffect } from 'react';
import './Messages.css';

const UserMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    // Mock data - replace with real API call
    setTimeout(() => {
      setConversations([
        {
          id: 1,
          name: 'QuickFix Motors',
          type: 'service_provider',
          lastMessage: 'Your oil change appointment is confirmed for tomorrow at 10 AM.',
          timestamp: '2024-01-20T14:30:00Z',
          unread: 2,
          avatar: '🔧',
          messages: [
            {
              id: 1,
              sender: 'QuickFix Motors',
              message: 'Hello! Thank you for booking with us.',
              timestamp: '2024-01-20T10:00:00Z',
              isOwn: false
            },
            {
              id: 2,
              sender: 'You',
              message: 'Hi, I wanted to confirm my appointment time.',
              timestamp: '2024-01-20T10:15:00Z',
              isOwn: true
            },
            {
              id: 3,
              sender: 'QuickFix Motors',
              message: 'Your oil change appointment is confirmed for tomorrow at 10 AM.',
              timestamp: '2024-01-20T14:30:00Z',
              isOwn: false
            }
          ]
        },
        {
          id: 2,
          name: 'AutoCare Plus',
          type: 'service_provider',
          lastMessage: 'We have your brake pads in stock now.',
          timestamp: '2024-01-19T16:45:00Z',
          unread: 0,
          avatar: '🚗',
          messages: [
            {
              id: 1,
              sender: 'AutoCare Plus',
              message: 'We have your brake pads in stock now.',
              timestamp: '2024-01-19T16:45:00Z',
              isOwn: false
            }
          ]
        },
        {
          id: 3,
          name: 'City Motors Dealer',
          type: 'dealer',
          lastMessage: 'The Honda Civic you inquired about is still available.',
          timestamp: '2024-01-18T11:20:00Z',
          unread: 1,
          avatar: '🏪',
          messages: [
            {
              id: 1,
              sender: 'City Motors Dealer',
              message: 'The Honda Civic you inquired about is still available.',
              timestamp: '2024-01-18T11:20:00Z',
              isOwn: false
            }
          ]
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const message = {
      id: Date.now(),
      sender: 'You',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isOwn: true
    };

    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, message],
              lastMessage: message.message,
              timestamp: message.timestamp
            }
          : conv
      )
    );

    setActiveConversation(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));

    setNewMessage('');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="messages-page">
        <div className="messages-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-container">
        <div className="messages-sidebar">
          <div className="messages-header">
            <h2>Messages</h2>
            <button className="btn primary small">New Message</button>
          </div>
          
          <div className="conversations-list">
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                className={`conversation-item ${activeConversation?.id === conversation.id ? 'active' : ''}`}
                onClick={() => setActiveConversation(conversation)}
              >
                <div className="conversation-avatar">
                  {conversation.avatar}
                </div>
                <div className="conversation-info">
                  <div className="conversation-header">
                    <h4>{conversation.name}</h4>
                    <span className="conversation-time">
                      {formatDate(conversation.timestamp)}
                    </span>
                  </div>
                  <p className="conversation-preview">
                    {conversation.lastMessage}
                  </p>
                </div>
                {conversation.unread > 0 && (
                  <div className="unread-badge">
                    {conversation.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="messages-main">
          {activeConversation ? (
            <>
              <div className="chat-header">
                <div className="chat-info">
                  <div className="chat-avatar">
                    {activeConversation.avatar}
                  </div>
                  <div>
                    <h3>{activeConversation.name}</h3>
                    <span className="chat-type">
                      {activeConversation.type === 'service_provider' ? 'Service Provider' : 'Dealer'}
                    </span>
                  </div>
                </div>
                <div className="chat-actions">
                  <button className="btn secondary small">📞 Call</button>
                  <button className="btn secondary small">ℹ️ Info</button>
                </div>
              </div>

              <div className="chat-messages">
                {activeConversation.messages.map(message => (
                  <div
                    key={message.id}
                    className={`message ${message.isOwn ? 'own' : 'other'}`}
                  >
                    <div className="message-content">
                      <p>{message.message}</p>
                      <span className="message-time">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <form className="chat-input" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="message-input"
                />
                <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                  📤
                </button>
              </form>
            </>
          ) : (
            <div className="no-conversation">
              <div className="no-conversation-icon">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the sidebar to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserMessages;