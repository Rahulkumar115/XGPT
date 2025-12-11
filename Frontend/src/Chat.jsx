// src/Chat.jsx
import "./Chat.css";

function Chat({ message }) {
  const isAI = message.role === "assistant";

  return (
    <div className={`chat-row ${isAI ? "ai-row" : "user-row"}`}>
      <div className="chat-content">
        <div className={`avatar ${isAI ? "ai-avatar" : "user-avatar-icon"}`}>
          {isAI ? "🤖" : "👤"}
        </div>
        <div className="message-text">
          {message.content}
        </div>
      </div>
    </div>
  );
}

export default Chat;