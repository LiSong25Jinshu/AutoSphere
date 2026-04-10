import { useState, useEffect, useCallback } from 'react';
import axios from '../utils/axiosConfig.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Converts a base64 VAPID public key to a Uint8Array for the browser Push API.
 */
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};

/**
 * Hook to manage Web Push notification subscriptions.
 *
 * Usage:
 *   const { supported, permission, subscribed, subscribe, unsubscribe } = usePushNotifications();
 */
const usePushNotifications = () => {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check support and current state on mount
  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setSupported(isSupported);

    if (isSupported) {
      setPermission(Notification.permission);

      // Register service worker
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });

      // Check if already subscribed
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported) return { success: false, error: 'Push not supported in this browser' };
    setLoading(true);
    setError('');

    try {
      // 1. Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setError('Notification permission denied');
        return { success: false, error: 'Permission denied' };
      }

      // 2. Get VAPID public key from backend
      const { data } = await axios.get(`${API_URL}/api/push/vapid-public-key`);
      if (!data.success) throw new Error('Push not configured on server');

      // 3. Subscribe via browser Push API
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });

      // 4. Send subscription to backend
      const sub = subscription.toJSON();
      await axios.post(`${API_URL}/api/push/subscribe`, {
        endpoint: sub.endpoint,
        keys: sub.keys,
      });

      setSubscribed(true);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to subscribe';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();

      if (subscription) {
        // Tell backend to remove it
        await axios.delete(`${API_URL}/api/push/unsubscribe`, {
          data: { endpoint: subscription.endpoint },
        });
        await subscription.unsubscribe();
      }

      setSubscribed(false);
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Failed to unsubscribe';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return { supported, permission, subscribed, loading, error, subscribe, unsubscribe };
};

export default usePushNotifications;
