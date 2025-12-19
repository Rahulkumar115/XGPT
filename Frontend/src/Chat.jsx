import React, { useState } from "react";
import "./Chat.css";

function Chat({ message, isPro }) { 
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = () => {
    // 1. Check if user is Pro
    if (!isPro) {
      alert("🔒 Voice Mode is a Pro feature. Please Upgrade!");
      return;
    }

    // 2. If already speaking, stop it
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    // 3. Start Speaking
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = "en-US"; 
    utterance.rate = 1; 
    utterance.pitch = 1; 

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Microsoft Zira"));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setSpeaking(false); 

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`chat-bubble ${message.role}`}>
      {/* 1. Avatar */}
      <div className="chat-avatar">
        {message.role === "user" ? "👤" : "🤖"}
      </div>

      {/* 2. Message Content */}
      <div className="chat-content">
        {/* If image exists, show it */}
        {message.image && (
          <img 
            src={message.image} 
            alt="Uploaded" 
            style={{ maxWidth: "200px", borderRadius: "10px", marginBottom: "10px" }} 
          />
        )}
        
        <p>{message.content}</p>

        {/* 3. 🔊 Speaker Icon (Only for AI messages) */}
        {message.role === "assistant" && (
          <button 
            onClick={handleSpeak}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              marginTop: "5px",
              fontSize: "16px",
              opacity: 0.7
            }}
            title={isPro ? "Read Aloud" : "Upgrade to unlock Voice"}
          >
            {speaking ? "⏹️" : "🔊"} 
          </button>
        )}
      </div>
    </div>
  );
}

export default Chat;