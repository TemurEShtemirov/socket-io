// import express from "express";
// import { createServer } from "http";
// import { fileURLToPath } from "url";
// import { dirname, join } from "path";
// import { Server } from "socket.io";

// import pkg from "pg";
// const { Client } = pkg;

// const pgConfig = {
//   user: "postgres",
//   host: "localhost",
//   database: "messanger",
//   passoword: "1015",
//   port: 5432,
// };

// const pgClient = new Client(pgConfig);
// pgClient.connect();

// // create our 'messages' table
// const createMessagesTable = async () => {
//   await pgClient.query(`
//     CREATE TABLE IF NOT EXISTS messages (
//         id SERIAL PRIMARY KEY,
//         content TEXT
//     );
//   `);
// };

// createMessagesTable();

// const app = express();
// const server = createServer(app);
// const io = new Server(server, {
//   connectionStateRecovery: {},
// });

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// app.get("/", (req, res) => {
//   res.sendFile(join(__dirname, "index.html"));
// });

// // io.on("connection", (socket) => {
// //   console.log("a user connected");

// //   // Listen for chat messages
// //   socket.on("chat message", (msg) => {
// //     console.log("message: " + msg);

// //     // Broadcast to all connected clients
// //     io.emit("chat message", msg);
// //   });

// //   // Broadcast a message to all clients when a new user connects
// //   io.emit("hello", "world");

// //   // Broadcast a message to all clients except the sender when a new user connects
// //   socket.broadcast.emit("hi");

// //   // Listen for disconnection
// //   socket.on("disconnect", () => {
// //     console.log("user disconnected");
// //   });
// // });

// // io.on("connection", (socket) => {
// //   socket.emit("hello", "world");
// // });

// io.on("connection", (socket) => {
//   socket.on("chat message", async (msg) => {
//     let result;
//     try {
//       // store the message in the database
//       result = await db.run("INSERT INTO messages (content) VALUES (?)", msg);
//     } catch (e) {
//       // TODO handle the failure
//       return;
//     }
//     // include the offset with the message
//     io.emit("chat message", msg, result.lastID);
//   });
// });

// // io.on("connection", (socket) => {
// //   socket.emit("hello", 1, "2", { 3: "4", 5: Buffer.from([6]) });
// // });

// // io.on("connection", (socket) => {
// //   socket
// //     .timeout(5000)
// //     .emit("request", { foo: "bar" }, "baz", (err, response) => {
// //       if (err) {
// //         // the client did not acknowledge the event in the given delay
// //       } else {
// //         console.log(response.status); // 'ok'
// //       }
// //     });
// // });

// // io.on("connection", async (socket) => {
// //   try {
// //     const res = await socket
// //       .timeout(5000)
// //       .emitWithAck("request", { foo: "bar" }, "baz");
// //     console.log(res.status);
// //   } catch (e) {}
// // });

// // io.emit("hello", "world");

// // io.on("connection", (socket) => {
// //   // join the room named 'some room'
// //   socket.join("some room");

// //   // broadcast to all connected clients in the room
// //   io.to("some room").emit("hello", "world");

// //   // broadcast to all connected clients except those in the room
// //   io.except("some room").emit("hello", "world");

// //   // leave the room
// //   socket.leave("some room");
// // });

// server.listen(3000, () => {
//   console.log("server running at http://:3000");
// });

import express from "express";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Server } from "socket.io";

import pkg from "pg";
const { Client } = pkg;

const pgConfig = {
  user: "postgres",
  host: "localhost",
  database: "messanger",
  password: "1015", // Replace 'your_password' with your actual PostgreSQL password
  port: 5432,
};

const pgClient = new Client(pgConfig);
pgClient.connect();

// create our 'messages' table
const createMessagesTable = async () => {
  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT
    );
  `);
};

createMessagesTable();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

io.on("connection", async (socket) => {
  socket.on("chat message", async (msg,clientOffset,callback) => {
    let result;
    try {
      // store the message in the database
      result = await pgClient.query(
        "INSERT INTO messages (content, client_offset) VALUES ($1, $2) RETURNING id",
        [msg, clientOffset]
      );
    } catch (e) {
     if (e.code === "23505") {
       // The message was already inserted, so we notify the client
       callback();
     } else {
       // Handle other errors or let the client retry
     }
     return;
    }
    // include the offset with the message
    io.emit("chat message", msg, result.rows[0].id);
    // acknowledge the event
    callback();
  });

  if (!socket.recovered) {
    // if the connection state recovery was not successful
    try {
      const { rows } = await pgClient.query(
        "SELECT id, content FROM messages WHERE id > $1",
        [socket.handshake.auth.serverOffset || 0]
      );
      rows.forEach((row) => {
        socket.emit("chat message", row.content, row.id);
      });
    } catch (e) {
      // handle the error
    }
  }

  socket.on("chat message", async (msg) => {
    let result;
    try {
      // store the message in the database
      result = await pgClient.query(
        "INSERT INTO messages (content) VALUES ($1) RETURNING id",
        [msg]
      );
    } catch (e) {
      // handle the error
      return;
    }
    // include the offset with the message
    io.emit("chat message", msg, result.rows[0].id);
  }); 
});

io.on("connection", (socket) => {
  socket.on("hello", (value, callback) => {
    // once the event is successfully handled
    callback();
  });
});

server.listen(3000, () => {
  console.log("server running at http://:3000");
});
