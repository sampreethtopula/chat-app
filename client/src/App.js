import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

function App() {
  const [socket, setSocket] = useState(null);

  const [username, setUsername] = useState("");
  const [chatUser, setChatUser] = useState("");
  const [users, setUsers] = useState({});
  const [showChat, setShowChat] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState("");

  const bottomRef = useRef();

  // SOCKET CONNECT
  useEffect(() => {
    const newSocket = io("https://chat-app-1-xzov.onrender.com");

    setSocket(newSocket);

    newSocket.on("online_users", setUsers);

    newSocket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => newSocket.disconnect();
  }, []);

  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // LOGIN
  const startChat = () => {
    if (!username.trim()) return alert("Enter username");
    socket.emit("register_user", username);
    setShowChat(true);
  };

  // SEND MESSAGE
  const sendMessage = () => {
    if (!message.trim() || !chatUser) return;

    const data = {
      from: username,
      to: chatUser,
      message,
      time: new Date().toLocaleTimeString(),
    };

    socket.emit("send_message", data);
    setMessages((prev) => [...prev, data]);
    setMessage("");
  };

  // ================= UI =================
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      
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
        <div style={{ display: "flex", height: "100%" }}>

          {/* LEFT USERS PANEL */}
          <div
            style={{
              width: window.innerWidth < 768 ? "100%" : "30%",
              background: "#111b21",
              color: "white",
              display: chatUser && window.innerWidth < 768 ? "none" : "block"
            }}
          >
            <h3 style={{ padding: "10px" }}>Chats</h3>

            {Object.keys(users)
              .filter((u) => u !== username)
              .map((u, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setChatUser(u);
                    setMessages([]);
                  }}
                  style={{
                    padding: "15px",
                    borderBottom: "1px solid #2a3942",
                    cursor: "pointer"
                  }}
                >
                  <b>{u}</b>
                  <div style={{ fontSize: "12px" }}>
                    {users[u].online ? "🟢 online" : "offline"}
                  </div>
                </div>
              ))}
          </div>

          {/* RIGHT CHAT PANEL */}
          <div
            style={{
              flex: 1,
              display:
                !chatUser && window.innerWidth < 768 ? "none" : "flex",
              flexDirection: "column",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                background: "#202c33",
                color: "white",
                padding: "15px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {window.innerWidth < 768 && (
                <button
                  onClick={() => setChatUser("")}
                  style={{
                    marginRight: "10px",
                    background: "none",
                    border: "none",
                    color: "white",
                    fontSize: "18px",
                  }}
                >
                  ←
                </button>
              )}
              <b>{chatUser || "Select user"}</b>
            </div>

            {/* CHAT AREA */}
            <div
              style={{
                flex: 1,
                overflowY: "scroll",
                padding: "10px",
                background: "#e5ddd5",
              }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent:
                      msg.from === username ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      background:
                        msg.from === username ? "#dcf8c6" : "#fff",
                      padding: "10px",
                      borderRadius: "10px",
                      margin: "5px",
                      maxWidth: "70%",
                    }}
                  >
                    {msg.message}
                    <div style={{ fontSize: "10px", textAlign: "right" }}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef}></div>
            </div>

            {/* INPUT */}
            {chatUser && (
              <div
                style={{
                  display: "flex",
                  padding: "10px",
                  borderTop: "1px solid #ccc",
                  background: "#f0f0f0",
                }}
              >
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type message"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "20px",
                    border: "1px solid #ccc",
                  }}
                />

                <button
                  onClick={sendMessage}
                  style={{
                    marginLeft: "10px",
                    background: "#25D366",
                    color: "white",
                    border: "none",
                    padding: "10px 15px",
                    borderRadius: "20px",
                  }}
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;