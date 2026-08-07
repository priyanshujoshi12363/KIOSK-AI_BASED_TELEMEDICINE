import { Server } from "socket.io";

export function initSignaling(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    socket.on("join", ({ sessionId, role }) => {
      if (!sessionId) return;
      const room = `session:${sessionId}`;
      socket.join(room);
      socket.data.room = room;
      socket.data.role = role;
      socket.to(room).emit("peer-joined", { role });
    });

    socket.on("signal", ({ sessionId, data }) => {
      if (!sessionId) return;
      socket.to(`session:${sessionId}`).emit("signal", {
        data,
        from: socket.data.role,
      });
    });

    socket.on("leave", ({ sessionId }) => {
      if (!sessionId) return;
      const room = `session:${sessionId}`;
      socket.leave(room);
      socket.to(room).emit("peer-left", { role: socket.data.role });
    });

    socket.on("disconnect", () => {
      if (socket.data.room) {
        socket.to(socket.data.room).emit("peer-left", { role: socket.data.role });
      }
    });
  });

  return io;
}
