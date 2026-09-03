import { useEffect, useRef, useState, useCallback } from 'react';

export type WsStatus = 'connecting' | 'connected' | 'disconnected';

export interface WsMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}

export function useMarketSocket(onMessage: (msg: WsMessage) => void) {
  const [status, setStatus] = useState<WsStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/api/v1/ws`;
    setStatus('connecting');

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      attemptRef.current = 0;
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as WsMessage;
        onMessageRef.current(parsed);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      // exponential backoff, capped at 15s, so a dead backend doesn't hammer reconnects
      const delay = Math.min(15_000, 1000 * 2 ** attemptRef.current);
      attemptRef.current += 1;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { status };
}
