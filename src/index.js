import express from "express";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log("a user connected");

  // Listen for chat messages
  socket.on("chat message", (msg) => {
    console.log("message: " + msg);

    // Broadcast to all connected clients
    io.emit("chat message", msg);
  });

  // Broadcast a message to all clients when a new user connects
  io.emit("hello", "world");

  // Broadcast a message to all clients except the sender when a new user connects
  socket.broadcast.emit("hi");

  // Listen for disconnection
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  // Example 1
  socket.emit("hello", "world");

  // Example 2
  socket.emit("hello", 1, "2", { 3: "4", 5: Buffer.from([6]) });

  // Example 3
  socket
    .timeout(5000)
    .emit("request", { foo: "bar" }, "baz", (err, response) => {
      if (err) {
        // the client did not acknowledge the event in the given delay
      } else {
        console.log(response.status); // 'ok'
      }
    });

  // Example 4
  try {
    const res = await socket
      .timeout(5000)
      .emitWithAck("request", { foo: "bar" }, "baz");
    console.log(res.status);
  } catch (e) {}

  // Example 5
  io.emit("hello", "world");

  // Example 6
  // join the room named 'some room'
  socket.join("some room");

  // broadcast to all connected clients in the room
  io.to("some room").emit("hello", "world");

  // broadcast to all connected clients except those in the room
  io.except("some room").emit("hello", "world");

  // leave the room
  socket.leave("some room");
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
