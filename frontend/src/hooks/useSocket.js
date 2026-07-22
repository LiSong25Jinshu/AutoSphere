/**
 * Shared Socket.io hook with:
 * - Automatic reconnection (exponential back-off via socket.io defaults)
 * - Offline message queue — messages sent while disconnected are flushed on reconnect
 * - Connection status exposed to consumers
 * - Clean disconnect on unmount / auth change
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

/**
 * @param {boolean} enabled  — only connect when true (i.e. user is authenticated)
 * @returns {{ socket, connected, emit }}
 *   - socket: the raw socket instance (or null)
 *   - connected: boolean
 *   - emit: queued emit — buffers events while offline and flushes on reconnect
 */
const useSocket = (enabled = true) => {
  const socketRef = useRef(null);
  const queueRef = useRef([]); // offline queue: [{ event, args }]
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      // Socket.io built-in reconnection
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,       // start at 1 s
      reconnectionDelayMax: 30000,   // cap at 30 s
      randomizationFactor: 0.5,      // jitter
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Flush offline queue
      const pending = queueRef.current.splice(0);
      pending.forEach(({ event, args }) => socket.emit(event, ...args));
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled]);

  /**
   * Queued emit — safe to call even when offline.
   * If disconnected, the event is buffered and sent once the socket reconnects.
   */
  const emit = useCallback((event, ...args) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit(event, ...args);
    } else {
      queueRef.current.push({ event, args });
    }
  }, []);

  return { socket: socketRef, connected, emit };
};

export default useSocket;
