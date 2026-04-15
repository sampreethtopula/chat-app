import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

function App() {
  const [socket, setSocket] = useState(null);

  const [username, setUsername] = useState("");
  const [chatUser, setChatUser] = useState("");
  const [manualUser, setManualUser] = useState("");
  const [users, setUsers] = useState({});
  const [showChat, setShowChat] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState("");

  const bottomRef = useRef();

  // ✅ SOCKET CONNECT
  useEffect(() => {
    const newSocket = io("https://chat-app-1-xzov.onrender.com");

    setSocket(newSocket);

    newSocket.on("online_users", setUsers);

    newSocket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, { ...data, status: "delivered" }]);
      newSocket.emit("seen", { id: data.id, to: data.from });
    });

    newSocket.on("delivered", (id) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, status: "delivered" } : m
        )
      );
    });

    newSocket.on("seen_update", (id) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, status: "seen" } : m
        )
      );
    });

    newSocket.on("typing", (msg) => {
      setTyping(msg);
      setTimeout(() => setTyping(""), 1500);
    });

    return () => newSocket.disconnect();
  }, []);

  // ✅ AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ START CHAT
  const startChat = () => {
    if (!socket) return;

    const clean = username.toLowerCase().trim();
    if (!clean) return alert("Enter username");

    setUsername(clean);
    socket.emit("register_user", clean);
    setShowChat(true);
  };

  // ✅ SEND TEXT
  const sendMessage = () => {
    if (!socket) return;
    if (!chatUser) return alert("Select user");
    if (!message.trim()) return;

    const data = {
      id: Date.now(),
      from: username,
      to: chatUser,
      message,
      time: new Date().toLocaleTimeString(),
      status: "sent",
    };

    socket.emit("send_message", data);
    setMessages((prev) => [...prev, data]);
    setMessage("");
  };

  // ✅ SEND IMAGE
  const sendImage = (e) => {
    if (!socket) return;
    if (!chatUser) return alert("Select user");

    const file = e.target.files[0];
    if (!file) return;

    // 🔥 size limit (important)
    if (file.size > 500 * 1024) {
      alert("Image too large (max 500KB)");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const data = {
        id: Date.now(),
        from: username,
        to: chatUser,
        file: reader.result,
        type: "image",
        time: new Date().toLocaleTimeString(),
        status: "sent",
      };

      socket.emit("send_message", data);
      setMessages((prev) => [...prev, data]);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>

      {/* LOGIN */}
      {!showChat ? (
        <div style={{ margin: "auto" }}>
          <h2>Login</h2>
          <input
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <br /><br />
          <button onClick={startChat}>Start</button>
        </div>
      ) : (
        <>
          {/* LEFT PANEL */}
          <div style={{
            width: "280px",
            background: "#111b21",
            color: "white",
            padding: "10px"
          }}>
            <h3>Chats</h3>

            {Object.keys(users)
              .filter((u) => u !== username)
              .map((u, i) => (
                <div key={i}
                  onClick={() => {
                    setChatUser(u);
                    setMessages([]);
                  }}
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                    background: u === chatUser ? "#2a3942" : ""
                  }}>
                  <b>{u}</b>
                  <div style={{ fontSize: "12px" }}>
                    {users[u].online
                      ? "🟢 online"
                      : "last seen " + users[u].lastSeen}
                  </div>
                </div>
              ))}

            <input
              placeholder="Enter username"
              value={manualUser}
              onChange={(e) => setManualUser(e.target.value)}
              style={{ width: "100%", marginTop: "10px" }}
            />
            <button onClick={() => setChatUser(manualUser.toLowerCase())}>
              Chat
            </button>
          </div>

          {/* RIGHT PANEL */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

            {/* HEADER */}
            <div style={{ background: "#202c33", color: "white", padding: "10px" }}>
              <b>{chatUser || "Select user"}</b>
            </div>

            {/* CHAT AREA */}
            <div style={{
              flex: 1,
              overflowY: "scroll",
              padding: "10px",
              background: "#e5ddd5",
              marginBottom: "70px"
            }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: msg.from === username ? "flex-end" : "flex-start"
                }}>
                  <div style={{
                    maxWidth: "60%",
                    background: msg.from === username ? "#dcf8c6" : "#fff",
                    padding: "10px",
                    borderRadius: "10px",
                    margin: "5px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                  }}>

                    {msg.type === "image" && msg.file ? (
                      <img
                        src={msg.file}
                        alt="img"
                        style={{ width: "150px", borderRadius: "8px" }}
                      />
                    ) : (
                      msg.message
                    )}

                    <div style={{
                      fontSize: "10px",
                      textAlign: "right",
                      marginTop: "5px",
                      color: "gray"
                    }}>
                      {msg.time}{" "}
                      {msg.from === username &&
                        (msg.status === "sent"
                          ? "✔"
                          : msg.status === "delivered"
                          ? "✔✔"
                          : "✔✔ 🔵")}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef}></div>
            </div>

            {/* TYPING */}
            <div style={{ paddingLeft: "10px", fontSize: "12px", color: "gray" }}>
              {typing}
            </div>

            {/* INPUT */}
            <div style={{
              position: "fixed",
              bottom: "0",
              left: "280px",
              right: "0",
              display: "flex",
              padding: "10px",
              background: "#f0f0f0",
              borderTop: "1px solid #ccc"
            }}>
              <input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  socket.emit("typing", { to: chatUser, from: username });
                }}
                placeholder="Type a message"
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "20px",
                  border: "1px solid #ccc"
                }}
              />

              <button
                onClick={sendMessage}
                style={{
                  marginLeft: "8px",
                  background: "#25D366",
                  color: "white",
                  border: "none",
                  padding: "10px",
                  borderRadius: "50%"
                }}
              >
                ➤
              </button>

              <input
                type="file"
                accept="image/*"
                onChange={sendImage}
                style={{ marginLeft: "8px" }}
              />
            </div>

          </div>
        </>
      )}
    </div>
  );
}

export default App;