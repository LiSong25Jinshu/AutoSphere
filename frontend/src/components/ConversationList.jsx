import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';

const ConversationList = ({ 
  conversations, 
  activeConversation, 
  onConversationSelect, 
  unreadCounts = {},
  onlineUsers = new Set()
}) => {
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? 'Yesterday' : `${diffInDays}d ago`;
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return '';
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  const getOtherParticipant = (conversation) => {
    // In a real implementation, this would find the other participant
    // For now, we'll use mock data structure
    return conversation.other_participant || {
      id: conversation.participant_2 || conversation.participant_1,
      name: conversation.name || 'Unknown User',
      avatar: null
    };
  };

  if (!conversations || conversations.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">No conversations yet</Typography>
        <Typography variant="caption">
          Start a conversation by contacting a dealer or service provider
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {conversations.map((conversation) => {
        const otherParticipant = getOtherParticipant(conversation);
        const unreadCount = unreadCounts[conversation.id] || 0;
        const isOnline = onlineUsers.has(otherParticipant.id);
        const isActive = activeConversation?.id === conversation.id;

        return (
          <ListItem key={conversation.id} disablePadding>
            <ListItemButton
              selected={isActive}
              onClick={() => onConversationSelect(conversation)}
              sx={{
                py: 1.5,
                px: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    isOnline ? (
                      <CircleIcon 
                        sx={{ 
                          color: 'success.main', 
                          fontSize: 12,
                          backgroundColor: 'white',
                          borderRadius: '50%'
                        }} 
                      />
                    ) : null
                  }
                >
                  <Avatar
                    src={otherParticipant.avatar}
                    sx={{ 
                      width: 48, 
                      height: 48,
                      bgcolor: isOnline ? 'success.light' : 'grey.400'
                    }}
                  >
                    {otherParticipant.avatar ? null : <PersonIcon />}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: unreadCount > 0 ? 600 : 400,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {otherParticipant.name}
                    </Typography>
                    {unreadCount > 0 && (
                      <Chip
                        label={unreadCount > 99 ? '99+' : unreadCount}
                        size="small"
                        color="primary"
                        sx={{ 
                          height: 20, 
                          fontSize: '0.75rem',
                          minWidth: 20
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        fontWeight: unreadCount > 0 ? 500 : 400,
                      }}
                    >
                      {conversation.last_message ? 
                        truncateMessage(conversation.last_message.content) : 
                        'No messages yet'
                      }
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1, flexShrink: 0 }}
                    >
                      {formatLastMessageTime(conversation.last_message_at)}
                    </Typography>
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
};

export default ConversationList;