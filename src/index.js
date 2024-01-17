import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import pkg from "pg";
import { availableParallelism } from "node:os";
import cluster from "node:cluster";
import { createAdapter, setupPrimary } from "@socket.io/cluster-adapter";

const { Pool } = pkg;

if (cluster.isPrimary) {
  const numCPUs = availableParallelism();
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({
      PORT: 3000 + i,
    });
  }

  setupPrimary();
} else {
  const username = process.env.USERNAME || "postgres";
  const host_db = process.env.HOST || "localhost";
  const db_name = process.env.DBNAME || "messanger";
  const pass = process.env.DBPASS || "1015";
  const port_db = process.env.DBPORT || 5432;
  const port = process.env.PORT || 3000;

  const pool = new Pool({
    user: username,
    host: host_db,
    database: db_name,
    password: pass,
    port: port_db,
  });

  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    connectionStateRecovery: {},
    adapter: createAdapter(),
  });

  const __dirname = dirname(fileURLToPath(import.meta.url));

  app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "../public/index.html"));
  });

  io.on("connection", async (socket) => {
    socket.on("chat message", async (msg, clientOffset, callback) => {
      let result;
      try {
        result = await pool.query(
          "INSERT INTO messages (content, client_offset) VALUES ($1, $2) RETURNING id",
          [msg, clientOffset]
        );
      } catch (e) {
        if (e.code === "23505") {
          callback();
        } else {
        }
        return;
      }
      io.emit("chat message", msg, result.rows[0].id);
      callback();
    });

    if (!socket.recovered) {
      try {
        const queryResult = await pool.query(
          "SELECT id, content FROM messages WHERE id > $1",
          [socket.handshake.auth.serverOffset || 0]
        );
        for (const row of queryResult.rows) {
          socket.emit("chat message", row.content, row.id);
        }
      } catch (e) {
        return e;
      }
    }
  });

  server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
  });
}
