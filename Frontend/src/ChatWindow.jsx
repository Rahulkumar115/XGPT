// Frontend/src/ChatWindow.jsx
import Chat from "./Chat";
import "./ChatWindow.css";
import { useEffect, useRef } from "react";

function ChatWindow({ messages, input, setInput, sendMessage, loading }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.map((msg, index) => (
          // 👇 ADD THIS "id" PROP
          <div key={index} id={`msg-${index}`}> 
            <Chat message={msg} />
          </div>
        ))}
        {loading && <div className="loading-indicator">Typing...</div>}
        <div ref={bottomRef} /> {/* Invisible element to scroll to bottom */}
      </div>

      {/* ... Input Area (Keep existing code) ... */}
      <div className="input-area">
        <div className="input-box">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Send a message..."
          />
          <button onClick={sendMessage}>➤</button>
        </div>
        <p className="disclaimer">ChatGPT can make mistakes. Consider checking important information.</p>
      </div>
    </div>
  );
}

export default ChatWindow;