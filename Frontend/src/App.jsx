import { useState, useEffect } from "react";
import axios from "axios";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider, signInWithPopup, signOut, db } from "./firebase";
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
  
  const [threadList, setThreadList] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // ✅ FIXED: Added 'setIsSidebarOpen' setter
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser);
        await refreshThreadList(currentUser.uid);
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
      const res = await axios.get(`http://localhost:5000/api/threads/${userId}`);
      setThreadList(res.data);
    } catch (err) { console.error(err); }
  };

  const loadThread = async (threadId) => {
    setCurrentThreadId(threadId);
    setLoading(true);
    // ✅ Close sidebar on mobile when thread is selected
    setIsSidebarOpen(false); 
    try {
      const res = await axios.get(`http://localhost:5000/api/thread/${user.uid}/${threadId}`);
      setMessages(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const clearChat = () => {
    setCurrentThreadId(null);
    setMessages([]);
    // ✅ Close sidebar on new chat
    setIsSidebarOpen(false); 
  };

  const handleLogout = () => {
    signOut(auth);
    setUser(null);
    setUserData(null);
    setMessages([]);
    setCurrentThreadId(null);
  };

  // ===================================
  // ⚡ STREAMING SEND MESSAGE
  // ===================================
  const sendMessage = async (fileData = {}) => {
    const { image, pdf } = fileData;
    if (!input && !image && !pdf) return;

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
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput || (pdf ? "Analyze this PDF" : "Describe image"),
          image,
          pdfData: pdf,
          userId: user ? user.uid : null,
          threadId: currentThreadId
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.reply || "Server Error");
      }

      const newThreadId = response.headers.get("X-Thread-ID");
      if (!currentThreadId && newThreadId) {
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
          const lastMsg = updated[updated.length - 1];
          lastMsg.content = assistantMessage; 
          return updated;
        });
      }

      if (userData) {
        setUserData(prev => ({ ...prev, messageCount: (prev.messageCount || 0) + 1 }));
      }

    } catch (error) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = error.message || "⚠️ Error connecting.";
        return updated;
      });
    }
    setLoading(false);
  };

  if (isAuthChecking) return <div style={{ height: "100vh", background: "#343541", color: "white", display: "flex", justifyContent: "center", alignItems: "center" }}>Loading...</div>;

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="app-layout">
      {/* 1. Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* 2. Hamburger Button */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsSidebarOpen(true)}
      >
         ☰
      </button>

      {/* 3. Sidebar with props */}
      <Sidebar 
        user={user} 
        onLogout={handleLogout} 
        threadList={threadList}
        onSelectThread={loadThread}
        onNewChat={clearChat}
        activeThreadId={currentThreadId}
        isFree={userData?.plan === "free"} 
        isOpen={isSidebarOpen} // 👈 Pass state
        closeSidebar={() => setIsSidebarOpen(false)} // 👈 Pass closer
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