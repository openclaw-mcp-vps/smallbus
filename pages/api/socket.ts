import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HTTPServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { onRealtimeEvent } from "@/lib/realtime";

type NextApiResponseWithSocket = NextApiResponse & {
  socket: NextApiResponse["socket"] & {
    server: HTTPServer & {
      io?: SocketIOServer;
      realtimeCleanup?: () => void;
    };
  };
};

export default function handler(_req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: "/api/socket_io",
      cors: {
        origin: "*"
      }
    });

    res.socket.server.io = io;

    const unsubscribe = onRealtimeEvent((event) => {
      io.emit("smallbus:event", event);
    });

    res.socket.server.realtimeCleanup = unsubscribe;

    io.on("connection", (socket) => {
      socket.emit("smallbus:event", {
        type: "system.connected",
        payload: { message: "Realtime channel connected." },
        at: new Date().toISOString()
      });

      socket.on("smallbus:ping", () => {
        socket.emit("smallbus:pong", { at: new Date().toISOString() });
      });
    });
  }

  res.end();
}
