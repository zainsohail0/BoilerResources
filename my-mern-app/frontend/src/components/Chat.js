import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom"; //  Get `groupId` from URL

const socket = io("http://localhost:5001", { withCredentials: true });

const Chat = ({ userId }) => {
  const { groupId } = useParams(); //  Extract groupId from URL
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const limit = 10; //  Pagination limit

  //  Fetch messages when chat opens
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        console.log(` Fetching messages for groupId: ${groupId}`);
        const res = await fetch(`http://localhost:5001/api/messages/${groupId}?page=1&limit=${limit}`);
        const data = await res.json();

        console.log(" Messages received:", data);
        if (Array.isArray(data)) {
          setMessages(data.reverse()); //  Show in chronological order
        } else {
          console.error(" Invalid API response format:", data);
        }
      } catch (error) {
        console.error(" Error fetching messages:", error);
      }
    };

    if (groupId) fetchMessages();
  }, [groupId]);

  //  Listen for real-time messages
  useEffect(() => {
    if (groupId && socket) {
      socket.emit("joinGroup", groupId);

      socket.on("receiveMessage", (message) => {
        console.log(" New message received:", message);
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
    console.log(" Sending message:", { groupId, senderId: userId, text });

    if (!groupId || !userId || !text.trim()) {
      console.error(" Error: groupId, senderId, or text is missing!");
      return;
    }

    socket.emit("sendMessage", { groupId, senderId: userId, text });
    setText(""); // Clear input field
  };

  return (
    <div>
      <h2>Group Chat</h2>
      <p><strong>Group ID:</strong> {groupId}</p>
      <p><strong>User ID:</strong> {userId}</p>
      
      <div style={{ height: "300px", overflowY: "auto", border: "1px solid #ddd", padding: "10px", marginBottom: "10px" }}>
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index}>
              <strong>{msg.senderId}:</strong> {msg.text}
            </div>
          ))
        )}
      </div>

      <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
