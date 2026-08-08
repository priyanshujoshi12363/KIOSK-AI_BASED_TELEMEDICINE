import { Server } from "socket.io";

let ioRef = null;

export function getIO() {
  return ioRef;
}

export function initSignaling(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });
  ioRef = io;

  io.on("connection", (socket) => {
    socket.on("join-asha", ({ ashaId }) => {
      if (!ashaId) return;
      socket.join(`asha:${ashaId}`);
    });

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
