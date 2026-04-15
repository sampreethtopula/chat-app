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
  const isMobile = window.innerWidth < 768;

  // 🔌 SOCKET
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

  // 🔽 AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🚀 LOGIN
  const startChat = () => {
    if (!username.trim()) return alert("Enter username");
    socket.emit("register_user", username.toLowerCase());
    setShowChat(true);
  };

  // 📤 SEND MESSAGE
  const sendMessage = () => {
    if (!message.trim() || !chatUser) return;

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

  // 🖼 SEND IMAGE
  const sendImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
        <div style={{ margin: "auto", textAlign: "center" }}>
          <h2>Login</h2>
          <input
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: "10px", borderRadius: "10px" }}
          />
          <br /><br />
          <button onClick={startChat}>Start</button>
        </div>
      ) : (
        <>
          {/* LEFT - USERS */}
          {(!isMobile || !chatUser) && (
            <div style={{
              width: isMobile ? "100%" : "300px",
              background: "#111b21",
              color: "white",
              overflowY: "auto"
            }}>
              <div style={{
                padding: "15px",
                fontSize: "18px",
                borderBottom: "1px solid #222"
              }}>
                Chats
              </div>

              {Object.keys(users)
                .filter((u) => u !== username)
                .map((u, i) => (
                  <div key={i}
                    onClick={() => {
                      setChatUser(u);
                      setMessages([]);
                    }}
                    style={{
                      padding: "15px",
                      borderBottom: "1px solid #222",
                      cursor: "pointer",
                      background: chatUser === u ? "#2a3942" : ""
                    }}>
                    <b>{u}</b>
                    <div style={{ fontSize: "12px", color: "#aaa" }}>
                      {users[u].online ? "🟢 online" : "offline"}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* RIGHT - CHAT */}
          {(!isMobile || chatUser) && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

              {/* HEADER */}
              <div style={{
                background: "#202c33",
                color: "white",
                padding: "10px",
                display: "flex",
                alignItems: "center"
              }}>
                {isMobile && (
                  <button onClick={() => setChatUser("")}>⬅</button>
                )}
                <b style={{ marginLeft: "10px" }}>{chatUser || "Select user"}</b>
              </div>

              {/* CHAT */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "10px",
                background: "#e5ddd5"
              }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent:
                      msg.from === username ? "flex-end" : "flex-start"
                  }}>
                    <div style={{
                      background: msg.from === username ? "#dcf8c6" : "#fff",
                      padding: "10px",
                      margin: "5px",
                      borderRadius: "10px",
                      maxWidth: "70%"
                    }}>
                      {msg.type === "image" ? (
                        <img src={msg.file} alt="" style={{ width: "150px" }} />
                      ) : (
                        msg.message
                      )}

                      {/* TIME + TICKS */}
                      <div style={{
                        fontSize: "10px",
                        textAlign: "right",
                        color: "gray",
                        marginTop: "5px"
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
              <div style={{ paddingLeft: "10px", fontSize: "12px" }}>
                {typing}
              </div>

              {/* INPUT */}
              <div style={{
                display: "flex",
                padding: "10px",
                background: "#f0f0f0"
              }}>
                <input
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    socket.emit("typing", {
                      to: chatUser,
                      from: username
                    });
                  }}
                  placeholder="Type message"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "20px"
                  }}
                />

                <button onClick={sendMessage}>Send</button>
                <input type="file" onChange={sendImage} />
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;