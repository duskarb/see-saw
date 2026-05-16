import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { getSnapshot, ingestEvent, registerSession } from "./aggregator";
import type { ReadingEvent, SessionData } from "./types";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT || 3000);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: {
      origin: "*"
    }
  });

  const broadcastSnapshot = () => {
    io.to("display").emit("aggregate:update", getSnapshot());
  };

  io.on("connection", (socket) => {
    socket.on("display:join", () => {
      socket.join("display");
      socket.emit("aggregate:update", getSnapshot());
    });

    socket.on("session:start", (session: SessionData) => {
      registerSession(session);
      broadcastSnapshot();
    });

    socket.on("reading:event", (event: ReadingEvent) => {
      ingestEvent(event);
      broadcastSnapshot();
    });
  });

  setInterval(broadcastSnapshot, 2500);

  httpServer.listen(port, hostname, () => {
    console.log(`Altered Seeing prototype ready at http://${hostname}:${port}`);
  });
});
