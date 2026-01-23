import React, { useState } from 'react';
import {
  Box,
  Popover,
  IconButton,
  Grid,
  Typography,
} from '@mui/material';
import { EmojiEmotions as EmojiIcon } from '@mui/icons-material';

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Gestures': ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Objects': ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '💫', '✨', '🔥', '💯', '💢', '💥', '💦', '💨'],
};

const EmojiPicker = ({ onEmojiSelect, anchorEl, open, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('Smileys');

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
    >
      <Box sx={{ width: 300, maxHeight: 400, p: 2 }}>
        {/* Category tabs */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto' }}>
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <IconButton
              key={category}
              size="small"
              onClick={() => setSelectedCategory(category)}
              sx={{
                minWidth: 'auto',
                px: 1,
                backgroundColor: selectedCategory === category ? 'primary.light' : 'transparent',
                '&:hover': {
                  backgroundColor: selectedCategory === category ? 'primary.light' : 'grey.100',
                },
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: selectedCategory === category ? 600 : 400 }}>
                {category}
              </Typography>
            </IconButton>
          ))}
        </Box>

        {/* Emoji grid */}
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          <Grid container spacing={0.5}>
            {EMOJI_CATEGORIES[selectedCategory].map((emoji, index) => (
              <Grid item key={index}>
                <IconButton
                  size="small"
                  onClick={() => handleEmojiClick(emoji)}
                  sx={{
                    fontSize: '1.2rem',
                    width: 36,
                    height: 36,
                    '&:hover': {
                      backgroundColor: 'grey.100',
                    },
                  }}
                >
                  {emoji}
                </IconButton>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Popover>
  );
};

export default EmojiPicker;