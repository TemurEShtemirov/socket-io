import express from "express";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Server } from "socket.io";
import pkg from "pg";
import { cpus } from "os";
import cluster from "cluster";
import { createAdapter, setupPrimary } from "@socket.io/cluster-adapter";
import cors from "cors";
import { promisify } from "util";

const { Pool } = pkg;

if (cluster.isPrimary) {
  const numCPUs = cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({
      PORT: 5050 + i,
    });
  }

  setupPrimary();
} else {
  const username = process.env.USERNAME || "postgres";
  const host_db = process.env.HOST || "localhost";
  const db_name = process.env.DBNAME || "messanger";
  const pass = process.env.DBPASS || "1015";

  const port = process.env.PORT || 5050;

  const connectionString = "postgres://postgres:1015@localhost:5432/messanger";

  const pool = new Pool({
    connectionString: connectionString,
  });
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    connectionStateRecovery: {},
    adapter: createAdapter(),
  });

  app.use(cors());
  app.use(express.json());

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "../public/index.html"));
  });

  app.delete("/delete", async (req, res) => {
    try {
      // Delete all messages in the messages table
      await pool.query("DELETE FROM messages");

      res
        .status(200)
        .json({ success: true, message: "All messages deleted successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });

  app.delete("/delete/:id", async (req, res) => {
    const messageId = req.params.id;

    try {
      // Delete the message with the specified ID from the messages table
      const result = await pool.query(
        "DELETE FROM messages WHERE id = $1 RETURNING *",
        [messageId]
      );

      if (result.rowCount === 0) {
        // If no rows were affected, the message with the given ID was not found
        res.status(404).json({ success: false, error: "Message not found." });
      } else {
        res
          .status(200)
          .json({ success: true, message: "Message deleted successfully." });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });

  io.on("connection", (socket) => {
    socket.on("chat message", async (msg, clientOffset, callback) => {
      try {
        const queryAsync = promisify(pool.query);

        const result = await queryAsync.call(
          pool,
          "INSERT INTO messages (content, client_offset) VALUES ($1, $2) RETURNING id",
          [msg, clientOffset]
        );

        if (callback) {
          callback();
        }

        io.emit("chat message", msg, result.rows[0].id);
      } catch (e) {
        if (e.code === "23505" && callback) {
          callback();
        } else {
          console.error(e);
        }
      }

      if (!socket.recovered) {
        try {
          socket.recovered = true; // Set the recovered property

          const queryResult = await pool.query(
            "SELECT id, content FROM messages WHERE id > $1",
            [socket.handshake.auth.serverOffset || 0]
          );

          for (const row of queryResult.rows) {
            socket.emit("chat message", row.content, row.id);
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  });

  server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
  });
}
