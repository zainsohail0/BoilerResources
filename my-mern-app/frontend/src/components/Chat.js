import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom"; // ✅ Extract groupId from URL

const socket = io("http://localhost:5001", { withCredentials: true });

const Chat = ({ userId }) => {
  const { groupId } = useParams(); // ✅ Extract groupId dynamically
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    console.log("✅ groupId from URL:", groupId); // Debugging log

    if (groupId && socket) {
      socket.emit("joinGroup", groupId);

      socket.on("receiveMessage", (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });
    }

    return () => {
      if (socket) {
        socket.off("receiveMessage");
      }
    };
  }, [groupId]);

  const sendMessage = () => {
    console.log("Sending message with:", { groupId, senderId: userId, text }); // Debug log

    if (!groupId || !userId || !text.trim()) {
      console.error("❌ Error: groupId, senderId, or text is missing!");
      return;
    }

    socket.emit("sendMessage", { groupId, senderId: userId, text });
    setText(""); // Clear input field
  };

  return (
    <div style={{ maxWidth: "500px", margin: "20px auto", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
      <h2>Group Chat</h2>
      <p><strong>Current Group ID:</strong> {groupId}</p> {/* ✅ Show current groupId for debugging */}
      <div style={{ height: "300px", overflowY: "auto", border: "1px solid #ddd", padding: "10px", marginBottom: "10px" }}>
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: "5px" }}>
              <strong>{msg.senderId}:</strong> {msg.text}
            </div>
          ))
        )}
      </div>

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        style={{ width: "80%", padding: "8px", marginRight: "5px" }}
      />
      <button onClick={sendMessage} style={{ padding: "8px", cursor: "pointer" }}>
        Send
      </button>
    </div>
  );
};

export default Chat;
