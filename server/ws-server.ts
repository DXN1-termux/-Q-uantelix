// ============================================================
// [Q]uantelix — WebSocket Server
// Real-time collaboration server
// ============================================================

import { WebSocketServer, WebSocket } from "ws";

interface CollabClient {
  ws: WebSocket;
  userId: string;
  sessionId: string;
  cursor?: { x: number; y: number };
  color: string;
}

interface CollabSession {
  id: string;
  clients: Map<string, CollabClient>;
  state: Record<string, any>;
}

export class CollabServer {
  private wss: WebSocketServer;
  private sessions: Map<string, CollabSession> = new Map();
  private clientColors = ["#38bdf8", "#a855f7", "#22d3ee", "#f59e0b", "#ef4444", "#10b981"];

  constructor(port: number = 3001) {
    this.wss = new WebSocketServer({ port });
    this.wss.on("connection", (ws, req) => {
      this.handleConnection(ws, req);
    });
    console.log(`[Collab] WebSocket server on port ${port}`);
  }

  private handleConnection(ws: WebSocket, req: any): void {
    const url = new URL(req.url || "", "http://localhost");
    const userId = url.searchParams.get("userId") || `anon_${Date.now()}`;
    const sessionId = url.searchParams.get("session") || "default";

    const color = this.clientColors[Math.floor(Math.random() * this.clientColors.length)];

    let session = this.sessions.get(sessionId);
    if (!session) {
      session = { id: sessionId, clients: new Map(), state: {} };
      this.sessions.set(sessionId, session);
    }

    const client: CollabClient = { ws, userId, sessionId, color };

    // Remove old connection for same user
    const existing = Array.from(session.clients.values()).find((c) => c.userId === userId);
    if (existing) {
      existing.ws.close();
      session.clients.delete(existing.userId);
    }
    session.clients.set(userId, client);

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        this.handleMessage(client, msg, session!);
      } catch {}
    });

    ws.on("close", () => {
      session?.clients.delete(userId);
      this.broadcast(session!, { type: "user_left", userId, sessionId }, userId);
    });

    // Send current state to new client
    ws.send(JSON.stringify({
      type: "session_state",
      sessionId,
      users: Array.from(session.clients.values()).map((c) => ({
        userId: c.userId, color: c.color, cursor: c.cursor,
      })),
    }));

    // Broadcast join
    this.broadcast(session, { type: "user_joined", userId, color, sessionId }, userId);
  }

  private handleMessage(client: CollabClient, msg: any, session: CollabSession): void {
    switch (msg.type) {
      case "cursor_move":
        client.cursor = msg.position;
        this.broadcast(session, {
          type: "cursor_update",
          userId: client.userId,
          position: msg.position,
          color: client.color,
        }, client.userId);
        break;
      case "state_update":
        session.state = { ...session.state, ...msg.state };
        this.broadcast(session, {
          type: "state_synced",
          userId: client.userId,
          state: msg.state,
        }, client.userId);
        break;
      case "chat_message":
        this.broadcast(session, {
          type: "chat_message",
          userId: client.userId,
          content: msg.content,
          timestamp: Date.now(),
        });
        break;
      case "co_pilot":
        this.broadcast(session, {
          type: "co_pilot",
          userId: client.userId,
          action: msg.action,
          payload: msg.payload,
        }, client.userId);
        break;
    }
  }

  private broadcast(session: CollabSession, msg: any, excludeUserId?: string): void {
    const data = JSON.stringify(msg);
    for (const [uid, client] of session.clients) {
      if (uid !== excludeUserId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    }
  }

  stop(): void {
    this.wss.close();
  }
}
