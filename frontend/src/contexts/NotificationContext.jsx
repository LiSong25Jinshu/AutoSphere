import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import usePushNotifications from '../hooks/usePushNotifications';
import useSocket from '../hooks/useSocket';

const NotificationContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const initialState = {
  notifications: [],
  unreadCount: 0,
  connected: false,
  loading: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };
    case 'LOAD': {
      // Replace state with DB-fetched notifications
      const unreadCount = action.payload.filter((n) => !n.read).length;
      return { ...state, notifications: action.payload, unreadCount, loading: false };
    }
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
        unreadCount: Math.max(
          0,
          state.notifications.find((n) => n.id === action.payload && !n.read)
            ? state.unreadCount - 1
            : state.unreadCount
        ),
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

export const NotificationProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { socket: socketRef, connected } = useSocket(isAuthenticated);
  const push_ = usePushNotifications();

  // ── Load persisted notifications from DB ──────────────────────────────────
  const loadFromDB = useCallback(async () => {
    if (!token) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await axios.get(`${API_URL}/api/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        // Normalise timestamp field (DB uses createdAt, socket uses timestamp)
        const normalised = data.data.map((n) => ({
          ...n,
          timestamp: n.createdAt || n.timestamp,
        }));
        dispatch({ type: 'LOAD', payload: normalised });
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) loadFromDB();
  }, [isAuthenticated, loadFromDB]);

  // ── Socket event listeners ────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onConnect = () => dispatch({ type: 'SET_CONNECTED', payload: true });
    const onDisconnect = () => dispatch({ type: 'SET_CONNECTED', payload: false });
    const onNotification = (notif) => {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: { ...notif, timestamp: notif.timestamp || new Date().toISOString() },
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification:new', onNotification);

    // Sync connected state immediately
    dispatch({ type: 'SET_CONNECTED', payload: socket.connected });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification:new', onNotification);
    };
  }, [socketRef, connected]); // re-attach after reconnect

  // ── Actions that call the API ─────────────────────────────────────────────
  const markRead = useCallback(async (id) => {
    dispatch({ type: 'MARK_READ', payload: id });
    try {
      await axios.patch(`${API_URL}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn('markRead failed:', err.message);
    }
  }, [token]);

  const markAllRead = useCallback(async () => {
    dispatch({ type: 'MARK_ALL_READ' });
    try {
      await axios.patch(`${API_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn('markAllRead failed:', err.message);
    }
  }, [token]);

  const remove = useCallback(async (id) => {
    dispatch({ type: 'REMOVE', payload: id });
    try {
      await axios.delete(`${API_URL}/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn('remove notification failed:', err.message);
    }
  }, [token]);

  // push() is kept for any in-app notifications that don't need DB persistence
  const push = useCallback((type, title, message, extra = {}) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: `local-${Date.now()}-${Math.random()}`,
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        ...extra,
      },
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        ...state,
        push,
        markRead,
        markAllRead,
        remove,
        socket: socketRef,
        reload: loadFromDB,
        // Web push
        pushSupported: push_.supported,
        pushPermission: push_.permission,
        pushSubscribed: push_.subscribed,
        pushLoading: push_.loading,
        subscribeToPush: push_.subscribe,
        unsubscribeFromPush: push_.unsubscribe,
      }}
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
