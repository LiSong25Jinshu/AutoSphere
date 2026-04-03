import { createContext, useContext, useEffect, useReducer, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

const initialState = {
  notifications: [],
  unreadCount: 0,
  connected: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };
    case 'ADD_NOTIFICATION': {
      const notif = action.payload;
      const exists = state.notifications.some((n) => n.id === notif.id);
      if (exists) return state;
      const notifications = [notif, ...state.notifications].slice(0, 50);
      return { ...state, notifications, unreadCount: state.unreadCount + 1 };
    }
    case 'MARK_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      };
    case 'REMOVE':
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
        unreadCount: state.notifications.find((n) => n.id === action.payload && !n.read)
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    default:
      return state;
  }
};

const makeNotif = (type, title, message, extra = {}) => ({
  id: `${Date.now()}-${Math.random()}`,
  type,
  title,
  message,
  timestamp: new Date().toISOString(),
  read: false,
  ...extra,
});

export const NotificationProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef(null);

  const push = useCallback((type, title, message, extra) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: makeNotif(type, title, message, extra) });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const socket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTED', payload: true });
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'SET_CONNECTED', payload: false });
    });

    // New message notification
    socket.on('message:new', (msg) => {
      const senderName = msg.sender
        ? `${msg.sender.firstName} ${msg.sender.lastName}`
        : 'Someone';
      push('message', 'New Message', `${senderName}: ${msg.content?.slice(0, 60)}`, {
        conversationId: msg.conversationId,
      });
    });

    // Booking status change
    socket.on('booking:statusChanged', (data) => {
      push('booking', 'Booking Updated', `Your booking status changed to ${data.status}`, {
        bookingId: data.bookingId,
      });
    });

    // New booking (for service providers)
    socket.on('booking:new', (data) => {
      push('booking', 'New Booking', `New appointment: ${data.title || data.serviceType}`, {
        bookingId: data.id,
      });
    });

    // User online/offline (optional, silent)
    socket.on('connect_error', (err) => {
      console.warn('Notification socket error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, push]);

  const markRead = (id) => dispatch({ type: 'MARK_READ', payload: id });
  const markAllRead = () => dispatch({ type: 'MARK_ALL_READ' });
  const remove = (id) => dispatch({ type: 'REMOVE', payload: id });

  return (
    <NotificationContext.Provider
      value={{ ...state, push, markRead, markAllRead, remove, socket: socketRef }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
