import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

// WebSocket connection
const socket = io("http://localhost:5001", { withCredentials: true });

const Chat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userId, setUserId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch user ID on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First try to get userId from localStorage
        let currentUserId = localStorage.getItem('userId');
        
        // If not available, try to fetch from API
        if (!currentUserId) {
          const userRes = await fetch("http://localhost:5001/api/auth/me", {
            credentials: "include",
          });
          
          if (userRes.ok) {
            const userData = await userRes.json();
            currentUserId = userData._id;
            localStorage.setItem('userId', currentUserId);
          } else {
            throw new Error("Failed to authenticate. Please log in.");
          }
        }
        
        setUserId(currentUserId);
        
        // Fetch group details for the name
        const groupRes = await fetch(`http://localhost:5001/api/groups/${groupId}`, {
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": currentUserId
          },
          credentials: "include"
        });
        
        if (groupRes.ok) {
          const groupData = await groupRes.json();
          setGroupName(groupData.name);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!groupId || !userId) return;

    console.log("✅ groupId from URL:", groupId);
    console.log("✅ userId:", userId);
    socket.emit("joinGroup", groupId);

    // Initial load for message history
    fetchMessages();

    socket.on("receiveMessage", (message) => {
      console.log("📥 Received real-time message:", message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [groupId, userId]);

  const fetchMessages = async () => {
    if (!userId || !groupId) return;
    
    console.log("📡 Fetching messages from backend (page", page, ")...");

    try {
      const res = await axios.get(`http://localhost:5001/api/messages/${groupId}`, {
        params: { page, limit: 20 },
        headers: {
          "X-User-ID": userId
        },
        withCredentials: true
      });

      if (!res.data.messages || res.data.messages.length === 0) {
        console.log("🛑 No more messages found.");
        setHasMore(false);
        return;
      }

      const reversed = res.data.messages.reverse(); // oldest messages on top
      console.log("✅ Messages received:", reversed);

      setMessages((prevMessages) => [...reversed, ...prevMessages]);
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("❌ Error fetching messages:", error.message);
    }
  };

  const sendMessage = () => {
    if (!groupId || !userId || !text.trim()) {
      console.error("❌ groupId, senderId, or text is missing!");
      return;
    }

    console.log("📤 Sending message:", { groupId, senderId: userId, text });
    socket.emit("sendMessage", { groupId, senderId: userId, text });
    setText(""); // Clear input
  };

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="bg-yellow-700 dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">Boiler Resources</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/groups/${groupId}`)}
                className="text-white hover:text-gray-300 mr-4"
              >
                Back to Group
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-blue-600 dark:bg-blue-800 text-white">
            <h2 className="text-xl font-semibold">Group Chat: {groupName}</h2>
          </div>

          {/* Load older messages button */}
          <div className="p-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <button
              onClick={fetchMessages}
              disabled={!hasMore}
              className={`w-full py-2 px-4 rounded text-center ${
                hasMore 
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
              }`}
            >
              {hasMore ? "Load Older Messages" : "No More Messages"}
            </button>
          </div>

          {/* Message window */}
          <div className="h-96 overflow-y-auto p-4 bg-white dark:bg-gray-800">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`mb-4 ${msg.senderId === userId ? 'text-right' : 'text-left'}`}
                >
                  <div 
                    className={`inline-block rounded-lg py-2 px-4 max-w-xs ${
                      msg.senderId === userId 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <div className="text-xs mb-1 opacity-75">
                      {msg.senderId === userId ? 'You' : msg.senderId}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input + Send */}
          <div className="p-4 bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <button 
              onClick={sendMessage} 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
