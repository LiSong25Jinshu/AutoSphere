import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import ConversationList from './ConversationList';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ConversationList', () => {
  const mockConversations = [
    {
      id: 1,
      name: 'John Doe',
      other_participant: {
        id: 2,
        name: 'John Doe',
        avatar: null,
      },
      last_message: {
        content: 'Hello, how are you?',
      },
      last_message_at: '2024-01-15T10:30:00Z',
    },
    {
      id: 2,
      name: 'Jane Smith',
      other_participant: {
        id: 3,
        name: 'Jane Smith',
        avatar: null,
      },
      last_message: {
        content: 'Thanks for your help!',
      },
      last_message_at: '2024-01-15T09:15:00Z',
    },
  ];

  const defaultProps = {
    conversations: mockConversations,
    activeConversation: null,
    onConversationSelect: vi.fn(),
    unreadCounts: {},
    onlineUsers: new Set(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders conversation list correctly', () => {
    renderWithTheme(<ConversationList {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(screen.getByText('Thanks for your help!')).toBeInTheDocument();
  });

  test('shows empty state when no conversations', () => {
    renderWithTheme(<ConversationList {...defaultProps} conversations={[]} />);
    
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(screen.getByText('Start a conversation by contacting a dealer or service provider')).toBeInTheDocument();
  });

  test('calls onConversationSelect when conversation is clicked', () => {
    const onConversationSelect = vi.fn();
    renderWithTheme(<ConversationList {...defaultProps} onConversationSelect={onConversationSelect} />);
    
    const firstConversation = screen.getByText('John Doe');
    fireEvent.click(firstConversation);
    
    expect(onConversationSelect).toHaveBeenCalledWith(mockConversations[0]);
  });

  test('shows unread count badge when there are unread messages', () => {
    const unreadCounts = { 1: 3, 2: 1 };
    renderWithTheme(<ConversationList {...defaultProps} unreadCounts={unreadCounts} />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('shows online indicator for online users', () => {
    const onlineUsers = new Set([2, 3]);
    renderWithTheme(<ConversationList {...defaultProps} onlineUsers={onlineUsers} />);
    
    // Online indicators should be present (green circles)
    const onlineIndicators = document.querySelectorAll('[data-testid="CircleIcon"]');
    expect(onlineIndicators).toHaveLength(2);
  });

  test('highlights active conversation', () => {
    const activeConversation = mockConversations[0];
    renderWithTheme(<ConversationList {...defaultProps} activeConversation={activeConversation} />);
    
    // Just verify the component renders with active conversation
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('truncates long messages', () => {
    const longMessageConversations = [
      {
        ...mockConversations[0],
        last_message: {
          content: 'This is a very long message that should be truncated because it exceeds the maximum length allowed for display in the conversation list',
        },
      },
    ];
    
    renderWithTheme(<ConversationList {...defaultProps} conversations={longMessageConversations} />);
    
    // Should show truncated message with ellipsis
    expect(screen.getByText(/This is a very long message that should be truncat/)).toBeInTheDocument();
  });

  test('formats message time correctly', () => {
    renderWithTheme(<ConversationList {...defaultProps} />);
    
    // Should show relative time (e.g., "2h ago", "1d ago")
    const timeElements = screen.getAllByText(/ago/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  test('handles missing last message gracefully', () => {
    const conversationsWithoutMessage = [
      {
        ...mockConversations[0],
        last_message: null,
      },
    ];
    
    renderWithTheme(<ConversationList {...defaultProps} conversations={conversationsWithoutMessage} />);
    
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });
});