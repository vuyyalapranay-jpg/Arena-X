// server/index.ts
// HIGH-PERFORMANCE REAL-TIME MULTIPLAYER SERVER FOR ARENA X

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager } from './RoomManager.js';
import { ClientMessage, ServerMessage } from './types.js';

const PORT = parseInt(process.env.PORT || '2567', 10);
const roomManager = new RoomManager();

// 1. Create HTTP Server for Health Checks & REST Room Listing
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  // Health endpoint for Render / Fly / Railway health probes
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now(),
        service: 'ARENA X Real-Time Game Server',
      })
    );
    return;
  }

  // REST API: Public Rooms List
  if (url.pathname === '/api/rooms') {
    const rooms = roomManager.getPublicRooms();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ rooms }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// 2. Attach WebSocket Server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  let activeRoomId: string | null = null;
  let activeSessionId: string | null = null;

  ws.on('message', (data: Buffer | string) => {
    try {
      const msg: ClientMessage = JSON.parse(data.toString());
      const { type, payload } = msg;

      switch (type) {
        // Create Room
        case 'join_room': {
          const { mode, roomId, code, roomName, visibility, password, playerName } = payload || {};

          let room;
          if (mode === 'CREATE') {
            room = roomManager.createRoom(
              roomName || 'Cyber Arena',
              visibility || 'PUBLIC',
              password
            );
          } else if (mode === 'BY_CODE') {
            room = roomManager.getRoomByCode(code);
            if (!room) {
              send(ws, { type: 'error', payload: { message: `Room with code "${code}" not found` } });
              return;
            }
          } else if (mode === 'QUICK_MATCH') {
            room = roomManager.quickMatch();
          } else {
            room = roomManager.getRoomById(roomId);
            if (!room) {
              send(ws, { type: 'error', payload: { message: 'Room not found or expired' } });
              return;
            }
          }

          // Check permissions
          const joinCheck = room.canJoin(password);
          if (!joinCheck.allowed) {
            send(ws, { type: 'error', payload: { message: joinCheck.reason || 'Cannot join room' } });
            return;
          }

          const joinResult = room.join(ws, playerName || 'Fighter');
          activeRoomId = room.id;
          activeSessionId = joinResult.sessionId;

          send(ws, {
            type: 'room_joined',
            payload: {
              roomId: room.id,
              roomCode: room.code,
              roomName: room.name,
              slot: joinResult.slot,
              sessionId: joinResult.sessionId,
              reconnectToken: joinResult.reconnectToken,
              isHost: joinResult.slot === 'P1',
            },
          });
          break;
        }

        // Reconnect session
        case 'reconnect': {
          const { roomId, reconnectToken } = payload || {};
          const room = roomManager.getRoomById(roomId);
          if (room && room.reconnect(ws, reconnectToken)) {
            activeRoomId = room.id;
          } else {
            send(ws, { type: 'error', payload: { message: 'Reconnection failed or session expired' } });
          }
          break;
        }

        // In-game messages routed to active room
        default: {
          if (activeRoomId && activeSessionId) {
            const room = roomManager.getRoomById(activeRoomId);
            if (room) {
              room.handleMessage(activeSessionId, type, payload);
            }
          }
          break;
        }
      }
    } catch (err: any) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (activeRoomId && activeSessionId) {
      const room = roomManager.getRoomById(activeRoomId);
      if (room) {
        room.leave(activeSessionId);
      }
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket connection error:', err);
  });
});

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

server.listen(PORT, () => {
  console.log(`[ARENA X Server] Authoritative multiplayer server listening on port ${PORT}`);
  console.log(`[ARENA X Server] Health check: http://localhost:${PORT}/health`);
  console.log(`[ARENA X Server] Public rooms: http://localhost:${PORT}/api/rooms`);
});
