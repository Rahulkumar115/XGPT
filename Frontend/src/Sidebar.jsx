import axios from "axios";
import "./Sidebar.css";

function Sidebar({ user, onLogout, threadList, onSelectThread, onNewChat, activeThreadId, isFree, isOpen, closeSidebar, setShowLoginModal }) {

  const handlePayment = async () => {
    if (!user) {
      setShowLoginModal(true); 
      return;
    }

    try {
      const { data: order } = await axios.post("https://xgpt-backend.onrender.com/api/create-order");

      const options = {
        key: "rzp_test_RqBpTs0iYonPRv", 
        amount: order.amount,
        currency: order.currency,
        name: "XGPT Pro",
        description: "Upgrade to Pro",
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post("https://xgpt-backend.onrender.com/api/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.uid,
            });

            if (verifyRes.data.success) {
              alert("Upgrade Successful! Refreshing...");
              window.location.reload(); 
            }
          } catch (err) {
            alert("Payment verification failed");
          }
        },
        prefill: {
          name: user.displayName || "User",
          email: user.email,
        },
        theme: { color: "#10a37f" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment failed", error);
      alert("Something went wrong initializing payment.");
    }
  };

  if (!user) {
    return (
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Mobile Close Button */}
        <button onClick={closeSidebar} className="mobile-close-btn" style={{display:"none", position:"absolute", right:"10px", top:"10px", background:"transparent", border:"none", color:"white", fontSize:"20px"}}>✕</button>
        <style>{`@media(max-width:768px){ .mobile-close-btn{ display:block!important; } }`}</style>

        <div className="sidebar-top">
          <button className="new-chat-btn" onClick={onNewChat}>+ New chat</button>
        </div>

        <div className="sidebar-history">
            <div style={{padding: "20px", color: "#ccc", fontSize: "14px", textAlign: "center", marginTop: "50px"}}>
                <p>👋 Welcome, Guest!</p>
                <br/>
                <p>You can send 3 free messages.</p>
                <br/>
                <p>Sign up to save chats and get more features.</p>
            </div>
        </div>

        <div className="sidebar-bottom">
            <button 
                onClick={() => setShowLoginModal(true)} 
                style={{
                    width: "100%", padding: "12px", background: "#10a37f", 
                    border: "none", borderRadius: "5px", color: "white", fontWeight: "bold", cursor: "pointer"
                }}
            >
                Login / Sign Up
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button onClick={closeSidebar} className="mobile-close-btn" style={{display:"none", position:"absolute", right:"10px", top:"10px", background:"transparent", border:"none", color:"white", fontSize:"20px"}}>✕</button>
      <style>{`@media(max-width:768px){ .mobile-close-btn{ display:block!important; } }`}</style>

      <div className="sidebar-top">
        <button className="new-chat-btn" onClick={onNewChat}>
          + New chat
        </button>
      </div>

      <div className="sidebar-history">
        <p style={{ color: "#8e8ea0", fontSize: "12px", padding: "10px 5px" }}>History</p>
        
        {threadList.map((thread) => (
          <div 
            key={thread.id} 
            className={`history-item ${activeThreadId === thread.id ? "active-thread" : ""}`}
            onClick={() => onSelectThread(thread.id)}
          >
            💬 {thread.title}
          </div>
        ))}
      </div>

     {/* Upgrade Button (Visible only for Free Users) */}
     {isFree && (
        <div style={{ padding: "10px", borderTop: "1px solid #444", marginBottom: "10px" }}>
          <button 
            onClick={handlePayment} 
            style={{ 
              width: "100%", padding: "10px", 
              background: "linear-gradient(90deg, #f093fb 0%, #f5576c 100%)", 
              border: "none", borderRadius: "5px", color: "white", fontWeight: "bold", cursor: "pointer" 
            }}
          >
            ✨ Upgrade to Pro
          </button>
        </div>
      )}

      <div className="sidebar-bottom">
        <img 
          src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random&color=fff&bold=true`} 
          alt="User" 
          className="user-avatar" 
        />
        <span className="user-name">
          {user.displayName || user.email.split("@")[0]}
        </span>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>
    </div>
  );
}

export default Sidebar;