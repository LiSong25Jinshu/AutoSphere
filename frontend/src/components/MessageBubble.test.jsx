import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MessageBubble from './MessageBubble';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('MessageBubble', () => {
  const mockMessage = {
    id: 1,
    content: 'Hello, this is a test message',
    created_at: '2024-01-15T10:30:00Z',
    sender_id: 2,
    sender: {
      name: 'John Doe',
      avatar: null,
    },
    is_read: false,
    type: 'text',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders text message correctly', () => {
    renderWithTheme(<MessageBubble message={mockMessage} isOwn={false} />);
    
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders own message with different styling', () => {
    renderWithTheme(<MessageBubble message={mockMessage} isOwn={true} />);
    
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    // Own messages don't show sender name
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });
});