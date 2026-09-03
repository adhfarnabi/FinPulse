import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function initWebSocketServer(server: Server, path = '/api/v1/ws') {
  wss = new WebSocketServer({ server, path });

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'FinPulse WebSocket connected' }));

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', () => {
      clients.delete(ws);
    });

    // basic heartbeat so dead connections get cleaned up rather than leaking
    (ws as any).isAlive = true;
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });
  });

  const heartbeat = setInterval(() => {
    for (const ws of clients) {
      if ((ws as any).isAlive === false) {
        ws.terminate();
        clients.delete(ws);
        continue;
      }
      (ws as any).isAlive = false;
      ws.ping();
    }
  }, 30_000);

  wss.on('close', () => clearInterval(heartbeat));

  return wss;
}

export function broadcast(type: string, payload: unknown) {
  const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

export function connectedClientCount(): number {
  return clients.size;
}
