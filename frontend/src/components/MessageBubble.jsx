import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  GetApp as DownloadIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const MessageBubble = ({ 
  message, 
  isOwn = false, 
  showReadReceipt = false,
  showAvatar = true 
}) => {
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isFileMessage = message.type === 'file' || message.content?.startsWith('📎');
  const isImageMessage = message.type === 'image';

  const renderMessageContent = () => {
    if (isFileMessage) {
      const fileName = message.content?.replace('📎 ', '') || 'Unknown file';
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">
            📎 {fileName}
          </Typography>
          <IconButton size="small" color="inherit">
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    }

    if (isImageMessage) {
      return (
        <Box>
          <img
            src={message.content}
            alt="Shared image"
            style={{
              maxWidth: '200px',
              maxHeight: '200px',
              borderRadius: '8px',
              display: 'block'
            }}
          />
        </Box>
      );
    }

    return (
      <Typography 
        variant="body2" 
        sx={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {message.content}
      </Typography>
    );
  };

  const renderReadReceipt = () => {
    if (!showReadReceipt || !isOwn) return null;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
        {message.is_read ? (
          <DoneAllIcon 
            sx={{ 
              fontSize: 16, 
              color: 'primary.main',
              ml: 'auto'
            }} 
          />
        ) : (
          <DoneIcon 
            sx={{ 
              fontSize: 16, 
              color: 'text.secondary',
              ml: 'auto'
            }} 
          />
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb: 1,
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      {/* Avatar for other user's messages */}
      {!isOwn && showAvatar && (
        <Avatar
          src={message.sender?.avatar}
          sx={{ width: 32, height: 32 }}
        >
          {message.sender?.avatar ? null : <PersonIcon />}
        </Avatar>
      )}

      {/* Message bubble */}
      <Box
        sx={{
          maxWidth: '70%',
          minWidth: '100px',
        }}
      >
        {/* Sender name for group conversations */}
        {!isOwn && message.sender?.name && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ ml: 1, mb: 0.5, display: 'block' }}
          >
            {message.sender.name}
          </Typography>
        )}

        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            backgroundColor: isOwn ? 'primary.main' : 'grey.100',
            color: isOwn ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
            borderTopRightRadius: isOwn ? 0.5 : 2,
            borderTopLeftRadius: isOwn ? 2 : 0.5,
            position: 'relative',
          }}
        >
          {renderMessageContent()}
          
          {/* Message timestamp */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.5,
              opacity: 0.7,
              textAlign: isOwn ? 'right' : 'left',
            }}
          >
            {formatMessageTime(message.created_at)}
          </Typography>

          {renderReadReceipt()}
        </Paper>

        {/* Message status indicators */}
        {message.edited && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              ml: 1, 
              mt: 0.5, 
              display: 'block',
              fontStyle: 'italic'
            }}
          >
            (edited)
          </Typography>
        )}
      </Box>

      {/* Spacer for own messages to maintain alignment */}
      {isOwn && showAvatar && (
        <Box sx={{ width: 32 }} />
      )}
    </Box>
  );
};

export default MessageBubble;