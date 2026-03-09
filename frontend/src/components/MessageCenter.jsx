import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Divider,
  Badge,
  Drawer,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import ConversationList from './ConversationList';
import MessageBubble from './MessageBubble';
import EmojiPicker from './EmojiPicker';

const MessageCenter = ({ isOpen, onClose, selectedConversationId = null }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (user && isOpen) {
      const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001', {
        auth: {
          token: localStorage.getItem('token'),
        },
      });

      newSocket.on('connect', () => {
        console.log('Connected to messaging server');
      });

      newSocket.on('conversations', (conversationList) => {
        setConversations(conversationList);
      });

      newSocket.on('messages', (messageList) => {
        setMessages(messageList);
        scrollToBottom();
      });

      newSocket.on('message:new', (message) => {
        setMessages(prev => [...prev, message]);
        
        // Update unread count if message is not from current user and not in active conversation
        if (message.senderId !== user.id && 
            (!activeConversation || message.conversationId !== activeConversation.id)) {
          setUnreadCounts(prev => ({
            ...prev,
            [message.conversationId]: (prev[message.conversationId] || 0) + 1
          }));
        }
        
        scrollToBottom();
      });

      newSocket.on('message:read', ({ messageId, conversationId, readBy, readAt }) => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, isRead: true, readAt } : msg
          )
        );
      });

      newSocket.on('typing:user', ({ userId, conversationId, isTyping }) => {
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

      newSocket.on('user:online', ({ userId }) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      newSocket.on('user:offline', ({ userId }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, isOpen, activeConversation]);

  // Load conversations on mount
  useEffect(() => {
    if (socket) {
      socket.emit('get_conversations');
    }
  }, [socket]);

  // Select conversation if provided
  useEffect(() => {
    if (selectedConversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === selectedConversationId);
      if (conversation) {
        handleConversationSelect(conversation);
      }
    }
  }, [selectedConversationId, conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleConversationSelect = (conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
    
    // Clear unread count for this conversation
    setUnreadCounts(prev => ({
      ...prev,
      [conversation.id]: 0
    }));
    
    if (socket) {
      socket.emit('conversation:join', conversation.id);
      socket.emit('get_messages', conversation.id);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation || !socket) return;

    const messageData = {
      conversationId: activeConversation.id,
      content: newMessage.trim(),
      attachments: []
    };

    socket.emit('message:send', messageData);
    setNewMessage('');
    
    // Stop typing indicator
    socket.emit('typing:stop', {
      conversationId: activeConversation.id
    });
  };

  const handleTyping = (value) => {
    setNewMessage(value);
    
    if (!activeConversation || !socket) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    socket.emit('typing:start', {
      conversationId: activeConversation.id
    });

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', {
        conversationId: activeConversation.id
      });
    }, 2000);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file || !activeConversation || !socket) return;

    // For now, we'll just send the file name as a message
    // In a full implementation, you'd upload to a file service first
    const messageData = {
      conversationId: activeConversation.id,
      content: `📎 ${file.name}`,
      attachments: [{ name: file.name, type: file.type, size: file.size }]
    };

    socket.emit('message:send', messageData);
    event.target.value = ''; // Reset file input
  };

  const handleEmojiClick = (emoji) => {
    setNewMessage(prev => prev + emoji);
  };

  const handleEmojiButtonClick = (event) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleEmojiPickerClose = () => {
    setEmojiAnchorEl(null);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const renderTypingIndicator = () => {
    if (typingUsers.size === 0) return null;
    
    const typingUserNames = Array.from(typingUsers).map(userId => {
      const conversation = conversations.find(c => 
        c.participants?.some(p => p.id === userId)
      );
      return conversation?.participants?.find(p => p.id === userId)?.name || 'Someone';
    });

    return (
      <Box sx={{ p: 1, fontStyle: 'italic', color: 'text.secondary', fontSize: '0.875rem' }}>
        {typingUserNames.join(', ')} {typingUserNames.length === 1 ? 'is' : 'are'} typing...
      </Box>
    );
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', height: '100%', flexDirection: isMobile ? 'column' : 'row' }}>
      {/* Conversation List */}
      <Box sx={{ 
        width: isMobile ? '100%' : 300, 
        borderRight: isMobile ? 'none' : 1, 
        borderColor: 'divider',
        display: isMobile && activeConversation ? 'none' : 'block'
      }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Messages</Typography>
        </Box>
        <ConversationList
          conversations={conversations}
          activeConversation={activeConversation}
          onConversationSelect={handleConversationSelect}
          unreadCounts={unreadCounts}
          onlineUsers={onlineUsers}
        />
      </Box>

      {/* Message Area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        display: isMobile && !activeConversation ? 'none' : 'flex'
      }}>
        {activeConversation ? (
          <>
            {/* Conversation Header */}
            <Box sx={{ 
              p: 2, 
              borderBottom: 1, 
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box>
                <Typography variant="h6">
                  {activeConversation.name || 'Conversation'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {onlineUsers.has(activeConversation.other_participant?.id) ? 'Online' : 'Offline'}
                </Typography>
              </Box>
              {isMobile && (
                <IconButton onClick={() => setActiveConversation(null)}>
                  <CloseIcon />
                </IconButton>
              )}
            </Box>

            {/* Messages */}
            <Box sx={{ 
              flex: 1, 
              overflow: 'auto', 
              p: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === user?.id}
                  showReadReceipt={message.sender_id === user?.id}
                />
              ))}
              {renderTypingIndicator()}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <AttachFileIcon />
                </IconButton>
                
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyPress={handleKeyPress}
                  variant="outlined"
                  size="small"
                />
                
                <IconButton
                  size="small"
                  onClick={handleEmojiButtonClick}
                >
                  <EmojiIcon />
                </IconButton>
                
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Box>
              
              <input
                ref={fileInputRef}
                type="file"
                hidden
                onChange={handleFileUpload}
                accept="image/*,application/pdf,.doc,.docx"
              />
              
              <EmojiPicker
                anchorEl={emojiAnchorEl}
                open={Boolean(emojiAnchorEl)}
                onClose={handleEmojiPickerClose}
                onEmojiSelect={handleEmojiClick}
              />
            </Box>
          </>
        ) : (
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'text.secondary'
          }}>
            <Typography>Select a conversation to start messaging</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : 800,
          maxWidth: '100%',
        }
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default MessageCenter;