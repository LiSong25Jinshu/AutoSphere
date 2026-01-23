import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Button,
  Chip,
  Divider,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

const MessagesPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const conversations = [
    {
      id: 1,
      name: 'John Smith',
      role: 'user',
      lastMessage: 'Is the 2022 Honda Civic still available?',
      timestamp: '2 hours ago',
      unread: 2,
      avatar: 'JS',
      online: true,
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      role: 'dealer',
      lastMessage: 'Thank you for the service booking!',
      timestamp: '1 day ago',
      unread: 0,
      avatar: 'SJ',
      online: false,
    },
    {
      id: 3,
      name: 'Mike Chen',
      role: 'service_provider',
      lastMessage: 'The brake inspection is complete',
      timestamp: '2 days ago',
      unread: 1,
      avatar: 'MC',
      online: true,
    },
  ];

  const messages = selectedConversation ? [
    {
      id: 1,
      sender: 'other',
      content: 'Hi! I\'m interested in the 2022 Honda Civic you have listed.',
      timestamp: '10:30 AM',
    },
    {
      id: 2,
      sender: 'me',
      content: 'Hello! Yes, it\'s still available. Would you like to schedule a test drive?',
      timestamp: '10:35 AM',
    },
    {
      id: 3,
      sender: 'other',
      content: 'That would be great! What times do you have available this week?',
      timestamp: '10:40 AM',
    },
    {
      id: 4,
      sender: 'me',
      content: 'I have availability on Tuesday at 2 PM or Thursday at 10 AM. Which works better for you?',
      timestamp: '10:42 AM',
    },
  ] : [];

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      // Add message logic here
      setNewMessage('');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'dealer': return 'primary';
      case 'service_provider': return 'secondary';
      case 'user': return 'success';
      default: return 'default';
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Messages
      </Typography>

      <Grid container spacing={3} sx={{ height: '70vh' }}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                size="small"
              />
            </Box>
            
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
              {filteredConversations.map((conversation) => (
                <ListItem
                  key={conversation.id}
                  button
                  selected={selectedConversation?.id === conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      color="success"
                      variant="dot"
                      invisible={!conversation.online}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {conversation.avatar}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {conversation.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={conversation.role}
                            size="small"
                            color={getRoleColor(conversation.role)}
                          />
                          {conversation.unread > 0 && (
                            <Badge badgeContent={conversation.unread} color="error" />
                          )}
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {conversation.lastMessage}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {conversation.timestamp}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Badge
                        color="success"
                        variant="dot"
                        invisible={!selectedConversation.online}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      >
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          {selectedConversation.avatar}
                        </Avatar>
                      </Badge>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {selectedConversation.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedConversation.online ? 'Online' : 'Offline'} • {selectedConversation.role}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* Messages */}
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: message.sender === 'me' ? 'flex-end' : 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '70%',
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: message.sender === 'me' ? 'primary.main' : 'grey.100',
                          color: message.sender === 'me' ? 'white' : 'text.primary',
                        }}
                      >
                        <Typography variant="body1">{message.content}</Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 1,
                            opacity: 0.7,
                          }}
                        >
                          {message.timestamp}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Message Input */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      multiline
                      maxRows={3}
                    />
                    <IconButton color="primary">
                      <AttachFileIcon />
                    </IconButton>
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      sx={{ minWidth: 'auto', px: 2 }}
                    >
                      <SendIcon />
                    </Button>
                  </Box>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Select a conversation to start messaging
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose from your existing conversations or start a new one
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MessagesPage;