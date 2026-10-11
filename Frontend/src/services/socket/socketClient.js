import { io } from 'socket.io-client';
import tokenStorage from '../storage/tokenStorage.js';

// Base URL: Fallbacks to localhost:3000 in dev or window.location.origin
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'));

let socket = null;

/**
 * Initializes and connects the Socket.IO client instance
 * Attaches the current access token in handshake auth (or isTvDisplay flag)
 * @param {Object} [options] - { isTvDisplay: boolean }
 */
export const connectSocket = (options = {}) => {
  const token = tokenStorage.getAccessToken();
  const isTvDisplay = Boolean(options.isTvDisplay);

  if (!token && !isTvDisplay) {
    console.warn('[Socket] No access token found and not TV display. Socket connection skipped.');
    return null;
  }

  // If already connected, return existing instance
  if (socket && socket.connected) {
    return socket;
  }

  // If instance exists but disconnected, update token and reconnect
  if (socket) {
    socket.auth = { token, isTvDisplay };
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token, isTvDisplay },
    query: { clientType: isTvDisplay ? 'TV_DISPLAY' : 'CLIENT' },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected successfully with ID:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket] Connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
};

/**
 * Get active socket instance or null
 */
export const getSocket = () => socket;

/**
 * Disconnect socket and cleanup
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join the virtual queue room for a specific queueId
 * Emits 'queue:join' with { queueId, appointmentId }
 * @param {string} queueId
 * @param {string} [appointmentId]
 */
export const joinQueueRoom = (queueId, appointmentId = null) => {
  const s = socket || connectSocket();
  if (!s || !queueId) return;

  const doJoin = () => {
    console.log('[Socket] Emitting queue:join for queueId:', queueId, 'appointmentId:', appointmentId);
    s.emit('queue:join', { queueId, appointmentId });
  };

  if (s.connected) {
    doJoin();
  } else {
    s.once('connect', doJoin);
  }
};

/**
 * Leave the virtual queue room for a specific queueId
 * Emits 'queue:leave' with { queueId }
 */
export const leaveQueueRoom = (queueId) => {
  if (!socket || !queueId) return;
  console.log('[Socket] Emitting queue:leave for queueId:', queueId);
  socket.emit('queue:leave', { queueId });
};

/**
 * Join the TV display broadcast channel
 * Emits 'tv:join'
 */
export const joinTvDisplay = () => {
  const s = socket || connectSocket({ isTvDisplay: true });
  if (!s) return;

  const doJoin = () => {
    console.log('[Socket] Emitting tv:join');
    s.emit('tv:join');
  };

  if (s.connected) {
    doJoin();
  } else {
    s.once('connect', doJoin);
  }
};

/**
 * Leave the TV display broadcast channel
 * Emits 'tv:leave'
 */
export const leaveTvDisplay = () => {
  if (!socket) return;
  console.log('[Socket] Emitting tv:leave');
  socket.emit('tv:leave');
};

/**
 * Listen for queue:joined confirmation event
 * @param {Function} callback - ({ queueId, queueEntryId, tokenNumber, status }) => void
 * @returns {Function} cleanup unsubscribe function
 */
export const onQueueJoined = (callback) => {
  const s = socket || connectSocket();
  if (!s || typeof callback !== 'function') return () => {};

  s.on('queue:joined', callback);
  return () => {
    s.off('queue:joined', callback);
  };
};

/**
 * Listen for queue:error events
 * @param {Function} callback - ({ message }) => void
 * @returns {Function} cleanup unsubscribe function
 */
export const onQueueError = (callback) => {
  const s = socket || connectSocket();
  if (!s || typeof callback !== 'function') return () => {};

  s.on('queue:error', callback);
  return () => {
    s.off('queue:error', callback);
  };
};

/**
 * Listen for live queue:updated broadcast events (CUSTOMER_CALLED, SERVICE_STARTED, etc.)
 * @param {Function} callback - (payload) => void
 * @returns {Function} cleanup unsubscribe function
 */
export const onQueueUpdated = (callback) => {
  const s = socket || connectSocket();
  if (!s || typeof callback !== 'function') return () => {};

  s.on('queue:updated', callback);
  return () => {
    s.off('queue:updated', callback);
  };
};

/**
 * Listen for live tv:updated broadcast events for the TV display
 * @param {Function} callback - (payload) => void
 * @returns {Function} cleanup unsubscribe function
 */
export const onTvUpdated = (callback) => {
  const s = socket || connectSocket({ isTvDisplay: true });
  if (!s || typeof callback !== 'function') return () => {};

  s.on('tv:updated', callback);
  return () => {
    s.off('tv:updated', callback);
  };
};

export default {
  connectSocket,
  getSocket,
  disconnectSocket,
  joinQueueRoom,
  leaveQueueRoom,
  joinTvDisplay,
  leaveTvDisplay,
  onQueueJoined,
  onQueueError,
  onQueueUpdated,
  onTvUpdated,
};
