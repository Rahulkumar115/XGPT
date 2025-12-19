import { useState } from "react";
import { auth, googleProvider, signInWithPopup } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber 
} from "firebase/auth";
import "./Login.css";

function Login({ onLogin }) {
  const [view, setView] = useState("email"); 
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");

  // Input States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpSent, setOtpSent] = useState(false);

  // 1. Google Login
  const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user);
    } catch (err) {
      setError("Google Login Failed.");
    }
  };

  // 2. Email Login
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const result = isRegistering 
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
      onLogin(result.user);
    } catch (err) {
      if (err.code === "auth/invalid-credential") setError("Invalid email or password.");
      else if (err.code === "auth/email-already-in-use") setError("Email already exists.");
      else setError(err.message);
    }
  };

  // 3. Phone Login
  const sendOtp = async () => {
    if (!phone || phone.length < 4) {
      setError("Please enter a valid phone number (e.g., +91 9999...)");
      return;
    }
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
      }
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
      setError(""); 
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP. Check the number format.");
    }
  };

  const verifyOtp = async () => {
    try {
      const result = await confirmationResult.confirm(otp);
      onLogin(result.user);
    } catch (err) {
      setError("Invalid OTP Code.");
    }
  };

  return (
    <div className="login-page"> {/*  New Wrapper */}
      <div className="login-card"> {/*  New Card Class */}
        
        <h2>Welcome Back</h2>

        {/* Tabs */}
        <div className="login-tabs">
          <span 
            className={`tab ${view === "email" ? "active" : ""}`} 
            onClick={() => setView("email")}
          >
            Email
          </span>
          <span 
            className={`tab ${view === "phone" ? "active" : ""}`} 
            onClick={() => setView("phone")}
          >
            Mobile
          </span>
        </div>

        {error && <div style={{color: "#ff4d4d", marginBottom: "15px", fontSize: "14px"}}>{error}</div>}

        {/* --- EMAIL FORM --- */}
        {view === "email" && (
          <form onSubmit={handleEmailAuth}>
            <input 
              type="email" 
              placeholder="Email address"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
            <input 
              type="password" 
              placeholder="Password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
            <button type="submit" className="login-btn">
              {isRegistering ? "Sign Up" : "Log In"}
            </button>
            
            <p className="toggle-text">
              {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
              <span onClick={() => setIsRegistering(!isRegistering)}>
                {isRegistering ? "Log In" : "Sign Up"}
              </span>
            </p>
          </form>
        )}

        {/* --- PHONE FORM --- */}
        {view === "phone" && (
          <div>
            {!otpSent ? (
              <>
                <input 
                  type="tel" 
                  placeholder="Phone number (+91...)"
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                />
                <div id="recaptcha-container"></div>
                <button onClick={sendOtp} className="login-btn">Send OTP</button>
              </>
            ) : (
              <>
                <input 
                  type="text" 
                  placeholder="Enter 6-digit Code"
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)}
                />
                <button onClick={verifyOtp} className="login-btn">Verify & Login</button>
              </>
            )}
          </div>
        )}

        {/* Divider */}
        <div style={{margin: "20px 0", color: "#555"}}>OR</div>

        {/* Google Button */}
        <button onClick={handleGoogle} className="google-btn">
          Continue with Google
        </button>

      </div>
    </div>
  );
}

export default Login;