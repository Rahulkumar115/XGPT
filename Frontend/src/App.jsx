import { useState, useEffect } from "react";
import axios from "axios";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signOut, db } from "./firebase";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import Login from "./Login";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Thread States
  const [threadList, setThreadList] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  //  GUEST MODE STATES
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const GUEST_LIMIT = 3;

  // 1. Listen for Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setShowLoginModal(false);
        await fetchUserProfile(currentUser);
        await refreshThreadList(currentUser.uid);
      } else {
        setUserData(null);
        setThreadList([]);
        setMessages([]); 
        setGuestMessageCount(0);
      }
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (currentUser) => {
    const userRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      setUserData(docSnap.data());
    } else {
      const defaultProfile = { email: currentUser.email, plan: "free", messageCount: 0 };
      await setDoc(userRef, defaultProfile);
      setUserData(defaultProfile);
    }
  };

  const refreshThreadList = async (userId) => {
    try {
      const res = await axios.get(`https://xgpt-backend.onrender.com/api/threads/${userId}`);
      setThreadList(res.data);
    } catch (err) { console.error(err); }
  };

  const loadThread = async (threadId) => {
    if (!user) return; 
    setCurrentThreadId(threadId);
    setLoading(true);
    setIsSidebarOpen(false);
    try {
      const res = await axios.get(`https://xgpt-backend.onrender.com/api/thread/${user.uid}/${threadId}`);
      setMessages(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const clearChat = () => {
    setCurrentThreadId(null);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    signOut(auth);
    setUser(null);
    setUserData(null);
    setMessages([]);
    setCurrentThreadId(null);
  };

  const sendMessage = async (fileData = {}) => {
    const { image, pdf } = fileData;
    if (!input && !image && !pdf) return;

    if (!user) {
      if (guestMessageCount >= GUEST_LIMIT) {
        setShowLoginModal(true); 
        return;
      }
      setGuestMessageCount(prev => prev + 1);
    }

    if (user && userData) {
      if (userData.plan === "free" && userData.messageCount >= 10) {
        alert("Daily limit reached! Upgrade to Pro.");
        return; 
      }
    }

    const currentInput = input;
    setInput(""); 
    setLoading(true);

    const newMessages = [
      ...messages, 
      { role: "user", content: currentInput, image, hasPdf: !!pdf },
      { role: "assistant", content: "" }
    ];
    setMessages(newMessages);

    try {
      const response = await fetch("https://xgpt-backend.onrender.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput || (pdf ? "Analyze this PDF" : "Describe image"),
          image,
          pdfData: pdf,
          userId: user ? user.uid : null, 
          threadId: user ? currentThreadId : null 
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.reply || "Server Error");
      }

      const newThreadId = response.headers.get("X-Thread-ID");
      if (user && !currentThreadId && newThreadId) {
        setCurrentThreadId(newThreadId);
        refreshThreadList(user.uid);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value, { stream: true });
        assistantMessage += chunkText;

        setMessages((prev) => {
          const updated = [...prev];
          const updatedMsg = { ...updated[updated.length - 1], content: assistantMessage };
          updated[updated.length - 1] = updatedMsg;
          return updated;
        });
      }

      if (user && userData) {
        setUserData(prev => ({ ...prev, messageCount: (prev.messageCount || 0) + 1 }));
      }

    } catch (error) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = error.message || " Error connecting.";
        return updated;
      });
    }
    setLoading(false);
  };

  if (isAuthChecking) return <div style={{ height: "100vh", background: "#343541", color: "white", display: "flex", justifyContent: "center", alignItems: "center" }}>Loading...</div>;

  return (
    <div className="app-layout">
      
      {/* 🛑 LOGIN MODAL (Shows when Guest Limit Reached) */}
      {showLoginModal && (
        <div className="login-modal-overlay">
          <div className="login-modal-content">
            <button className="close-modal-btn" onClick={() => setShowLoginModal(false)}>✕</button>
            <Login onLogin={setUser} />
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Hamburger Button - Only show when Sidebar is CLOSED */}
      {!isSidebarOpen && (
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsSidebarOpen(true)}
        >
          ☰
        </button>
      )}

      {/* Sidebar */}
      <Sidebar 
        user={user} 
        onLogout={handleLogout} 
        threadList={threadList}
        onSelectThread={loadThread}
        onNewChat={clearChat}
        activeThreadId={currentThreadId}
        isFree={userData?.plan === "free"} 
        isOpen={isSidebarOpen} 
        closeSidebar={() => setIsSidebarOpen(false)}
        setShowLoginModal={setShowLoginModal} 
      />

      <ChatWindow 
        messages={messages} 
        input={input} 
        setInput={setInput} 
        sendMessage={sendMessage} 
        loading={loading}
        isPro={userData?.plan === "pro"}
      />
    </div>
  );
}

export default App;