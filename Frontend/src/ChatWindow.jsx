import Chat from "./Chat";
import "./ChatWindow.css";
import { useEffect, useRef, useState } from "react";

function ChatWindow({ messages, input, setInput, sendMessage, loading, isPro }) {
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null); // Stores the image temporarily

  // Auto-scroll
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle File Selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result); // Save as Base64
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Send (Text + Image)
  const handleSendClick = () => {
    if (!input && !selectedImage) return;
    sendMessage(selectedImage); // Pass image to App.jsx
    setSelectedImage(null); // Clear after sending
  };

  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} id={`msg-${index}`}>
            <Chat message={msg} isPro={isPro} />
            {/* Show "Image Sent" badge if history has image */}
            {msg.image && <div style={{fontSize: "10px", color: "#888", marginLeft: "10px"}}>[Image Uploaded]</div>}
          </div>
        ))}
        {loading && <div className="loading-indicator">Thinking...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        {/* Image Preview (Little thumbnail before sending) */}
        {selectedImage && (
          <div style={{ position: "absolute", bottom: "70px", left: "20px", background: "#333", padding: "5px", borderRadius: "5px" }}>
            <img src={selectedImage} alt="Preview" style={{ height: "50px", borderRadius: "3px" }} />
            <button onClick={() => setSelectedImage(null)} style={{ marginLeft: "10px", background: "red", color: "white", border: "none", cursor: "pointer" }}>✕</button>
          </div>
        )}

        <div className="input-box">
          {/* 📎 Attachment Button */}
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: "none" }} 
            accept="image/*"
            onChange={handleImageSelect}
          />
          <button 
            className="attach-btn" 
            onClick={() => fileInputRef.current.click()}
            style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", marginRight: "10px" }}
          >
            📎
          </button>

          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendClick()}
            placeholder="Send a message..."
          />
          <button onClick={handleSendClick}>➤</button>
        </div>
        <p className="disclaimer">ChatGPT Clone can make mistakes.</p>
      </div>
    </div>
  );
}

export default ChatWindow;