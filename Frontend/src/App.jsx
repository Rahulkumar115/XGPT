import { useState, useEffect } from "react";
import axios from "axios";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth"; // Import this to fix the refresh issue
import { auth, googleProvider, signInWithPopup, signOut, db } from "./firebase";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import Login from "./Login";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // Stores Plan (Free/Pro)
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Thread States
  const [threadList, setThreadList] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);

  // Auth Loading State (Prevents Login screen flash on refresh)
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // 1. LISTEN FOR LOGIN STATUS (Runs on App Start)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // If user is found, fetch their data immediately
        await fetchUserProfile(currentUser);
        await refreshThreadList(currentUser.uid);
      }
      
      setIsAuthChecking(false); // Done checking, show the app
    });

    return () => unsubscribe(); // Cleanup
  }, []);

  // Helper: Fetch User Profile
  const fetchUserProfile = async (currentUser) => {
    const userRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      setUserData(docSnap.data());
    } else {
      // First time user? Create default profile
      const defaultProfile = { email: currentUser.email, plan: "free", messageCount: 0 };
      await setDoc(userRef, defaultProfile);
      setUserData(defaultProfile);
    }
  };

  // Helper: Fetch Threads
  const refreshThreadList = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/threads/${userId}`);
      setThreadList(res.data);
    } catch (err) { console.error(err); }
  };

  // 2. LOAD A SPECIFIC THREAD
  const loadThread = async (threadId) => {
    setCurrentThreadId(threadId);
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/thread/${user.uid}/${threadId}`);
      setMessages(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // 3. START NEW CHAT
  const clearChat = () => {
    setCurrentThreadId(null);
    setMessages([]);
  };

  // 4. LOGOUT
  const handleLogout = () => {
    signOut(auth);
    setUser(null);
    setUserData(null);
    setMessages([]);
    setCurrentThreadId(null);
  };

  // 5. SEND MESSAGE LOGIC
    // B. Optimistic Update
    // Updated sendMessage to accept 'image' argument
  const sendMessage = async (image = null) => {
    if (!input && !image) return;

    // 1. FREE USER CHECK (Existing logic)
    if (user && userData) {
      if (userData.plan === "free" && userData.messageCount >= 10) {
        alert("Daily limit reached! Please Upgrade to Pro.");
        return; 
      }
    }

    // 2. OPTIMISTIC UI UPDATE
    // Add the user's message to the screen immediately
    const newMessages = [...messages, { role: "user", content: input, image: image }];
    setMessages(newMessages);
    
    const currentInput = input;
    setInput(""); // Clear input box
    setLoading(true);

    try {
      // 3. SEND TO BACKEND
      const res = await axios.post("http://localhost:5000/api/chat", {
        message: currentInput || "Describe this image", // If sending only image, add default text
        image: image, // 👈 SENDING IMAGE
        userId: user ? user.uid : null,
        threadId: currentThreadId
      });

      // 4. ADD AI REPLY
      setMessages([...newMessages, { role: "assistant", content: res.data.reply }]);

      // Update Local Count
      if (userData) {
        setUserData({ ...userData, messageCount: (userData.messageCount || 0) + 1 });
      }

      // New Chat Logic
      if (!currentThreadId) {
        setCurrentThreadId(res.data.threadId);
        refreshThreadList(user.uid);
      }

    } catch (error) {
      // 5. HANDLE "PRO ONLY" ERROR
      // If backend says "403 Forbidden" (Image is Pro only), show it in chat bubble
      const errorMsg = error.response?.data?.reply || "⚠️ Error connecting to server.";
      setMessages([...newMessages, { role: "assistant", content: errorMsg }]);
    }
    setLoading(false);
  };

  // --- RENDER LOGIC ---

  // 1. Show Loading Screen while checking Firebase
  if (isAuthChecking) {
    return (
      <div style={{ height: "100vh", background: "#343541", color: "white", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <h3>Loading...</h3>
      </div>
    );
  }

  // 2. Show Login Screen if no user
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // 3. Show Main App
  return (
    <div className="app-layout">
      <Sidebar 
        user={user} 
        onLogout={handleLogout} 
        threadList={threadList}
        onSelectThread={loadThread}
        onNewChat={clearChat}
        activeThreadId={currentThreadId}
        isFree={userData?.plan === "free"} // Pass plan info to Sidebar
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