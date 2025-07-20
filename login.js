// login.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0TjMoFSYBIs0VQ9shUilOuDGb1uXHjKI",
  authDomain: "iptv-log-in.firebaseapp.com",
  projectId: "iptv-log-in",
  storageBucket: "iptv-log-in.firebasestorage.app",
  messagingSenderId: "820026131349",
  appId: "1:820026131349:web:417abd6ad9057c55a92c9c",
  measurementId: "G-4Y8T6J595Z"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Toggle password visibility
document.getElementById("togglePassword").onclick = () => {
  const password = document.getElementById("password");
  password.type = password.type === "password" ? "text" : "password";
};

// Login button handler
document.getElementById("loginBtn").onclick = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // Redirect to IPTV page
    window.location.href = "iptv.html";
  } catch (err) {
    alert("Login failed: " + err.message);
  }
};
