import axios from "axios";
import "./Sidebar.css";

function Sidebar({ user, onLogout, threadList, onSelectThread, onNewChat, activeThreadId, isFree }) {

    const handlePayment = async () => {
    try {
      // A. Create Order
      const { data: order } = await axios.post("http://localhost:5000/api/create-order");

      // B. Razorpay Options
      const options = {
        key: "rzp_test_RqBpTs0iYonPRv", // 🔴 PASTE YOUR KEY ID HERE
        amount: order.amount,
        currency: order.currency,
        name: "ChatGPT Clone Pro",
        description: "Test Transaction",
        order_id: order.id,
        handler: async function (response) {
          // C. Verify on Backend
          const verifyRes = await axios.post("http://localhost:5000/api/verify-payment", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            userId: user.uid,
          });

          if (verifyRes.data.success) {
            alert("Upgrade Successful! Refreshing...");
            window.location.reload(); // Reloads page to remove the button
          }
        },
        prefill: {
          name: user.displayName || "User",
          email: user.email,
          contact: "9999999999"
        },
        theme: { color: "#10a37f" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment failed", error);
      alert("Something went wrong. Check console.");
    }
  };

  return (
    <div className="sidebar">
      {/* Top Section */}
      <div className="sidebar-top">
        <button className="new-chat-btn" onClick={onNewChat}>
          + New chat
        </button>
      </div>

      {/* Thread List */}
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

      {/* 👇 RESTORED: Upgrade Button */}
     {isFree && (
        <div style={{ padding: "10px", borderTop: "1px solid #444", marginBottom: "10px" }}>
          <button 
            onClick={handlePayment} // 👈 ATTACH THE FUNCTION HERE
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

      {/* User Profile Section */}
      <div className="sidebar-bottom">
        <img 
          // 👇 FIX: If photoURL is missing, use UI Avatars to generate one from the email
          src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random&color=fff&bold=true`} 
          alt="User" 
          className="user-avatar" 
        />
        
        {/* 👇 FIX: If displayName is missing, show the email username instead */}
        <span className="user-name">
          {user.displayName || user.email.split("@")[0]}
        </span>
        
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>
    </div>
  );
}

export default Sidebar;