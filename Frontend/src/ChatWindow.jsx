import Chat from "./Chat";
import "./ChatWindow.css";
import { useEffect, useRef, useState } from "react";

function ChatWindow({ messages, input, setInput, sendMessage, loading, isPro }) {
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null); 

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(reader.result);
        setFileType(file.type.includes("pdf") ? "pdf" : "image");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendClick = () => {
    if (!input && !selectedFile) return;
    const fileData = {
      image: fileType === "image" ? selectedFile : null,
      pdf: fileType === "pdf" ? selectedFile : null
    };
    sendMessage(fileData);
    setSelectedFile(null);
    setFileType(null);
  };

  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} id={`msg-${index}`}>
            <Chat message={msg} isPro={isPro} />
            {msg.image && <div style={{fontSize:"11px", color:"#aaa", marginLeft:"10px"}}> Image Uploaded</div>}
            {msg.hasPdf && <div style={{fontSize:"11px", color:"#e55", marginLeft:"10px"}}> PDF Uploaded</div>}
          </div>
        ))}
        {loading && <div className="loading-indicator">Thinking...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        {selectedFile && (
          <div style={{ position: "absolute", bottom: "70px", left: "20px", background: "#333", padding: "10px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
            {fileType === "image" ? (
              <img src={selectedFile} alt="Preview" style={{ height: "50px" }} />
            ) : (
              <span style={{ fontSize: "30px" }}>📄</span>
            )}
            <span style={{color: "white", fontSize: "12px"}}>{fileType === "image" ? "Image" : "PDF"} Selected</span>
            <button onClick={() => setSelectedFile(null)} style={{background:"red", color:"white", border:"none", borderRadius:"50%", cursor:"pointer", width:"20px", height:"20px"}}>✕</button>
          </div>
        )}

        <div className="input-box">
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: "none" }} 
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
          />
          <button 
            className="attach-btn" 
            onClick={() => fileInputRef.current.click()}
            style={{ background: "transparent", border: "none", fontSize: "24px", cursor: "pointer", marginRight: "10px", color: "#b0b0b0" }}
          >
            📎
          </button>
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendClick()}
            placeholder="Message or Upload PDF..."
          />
          <button onClick={handleSendClick}>➤</button>
        </div>
        <div>
        <p className="disclaimer">XGPT can make mistakes.</p>
        <p className="disclaimer">Made with ❤️ by Rahul.</p>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;