const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ✅ Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ✅ Users store
let users = {};

// ✅ Default route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ✅ Socket connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ Register user
  socket.on("register_user", (username) => {
    if (!username) return;

    users[username] = {
      id: socket.id,
      online: true,
      lastSeen: "just now",
    };

    console.log("Registered:", username);

    io.emit("online_users", users);
  });

  // ✅ Send message (TEXT + IMAGE)
  socket.on("send_message", (data) => {
    console.log("Incoming message:", data);

    const receiver = users[data.to];

    if (receiver) {
      // 👉 Send to receiver
      io.to(receiver.id).emit("receive_message", data);

      // 👉 Delivered status back to sender
      io.to(socket.id).emit("delivered", data.id);
    } else {
      console.log("❌ Receiver not found:", data.to);
    }
  });

  // ✅ Seen update
  socket.on("seen", ({ id, to }) => {
    const receiver = users[to];

    if (receiver) {
      io.to(receiver.id).emit("seen_update", id);
    }
  });

  // ✅ Typing indicator
  socket.on("typing", ({ to, from }) => {
    const receiver = users[to];

    if (receiver) {
      io.to(receiver.id).emit("typing", `${from} is typing...`);
    }
  });

  // ✅ Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (let user in users) {
      if (users[user].id === socket.id) {
        users[user].online = false;
        users[user].lastSeen = new Date().toLocaleTimeString();
      }
    }

    io.emit("online_users", users);
  });
});

// ✅ PORT (Render compatible)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});