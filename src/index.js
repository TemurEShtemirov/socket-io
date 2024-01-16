import express from "express";
import http from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Server } from "socket.io";
import cluster from "cluster";
import { createAdapter, setupPrimary } from "@socket.io/cluster-adapter";
import { cpus } from "os";
import pkg from "pg";

const { Pool } = pkg;


if (cluster.isPrimary) {
  const numCPUs = cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({
      PORT: 3000 + i,
    });
  }
  
  setupPrimary();
} else {
  const pool = new Pool({
    connectionString:
    "postgres://postgres:1015@localhost:5432/messanger",
  });
  
  const db = await pool.connect();

  await db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      client_offset TEXT UNIQUE,
      content TEXT
      );
      `);
      
      const app = express();
      const server = http.createServer(app);
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
        result = await db.query(
          "INSERT INTO messages (content, client_offset) VALUES ($1, $2) RETURNING id",
          [msg, clientOffset]
        );
      } catch (e) {
        if (e.code === "23505") {
          callback();
        } else {
          // nothing to do, just let the client retry
        }
        return;
      }
      io.emit("chat message", msg, result.rows[0].id);
      callback();
    });

    if (!socket.recovered) {
      try {
        const { rows } = await db.query(
          "SELECT id, content FROM messages WHERE id > $1",
          [socket.handshake.auth.serverOffset || 0]
        );
        rows.forEach((row) => {
          socket.emit("chat message", row.content, row.id);
        });
      } catch (e) {
        // something went wrong
      }
    }
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
  });
}
