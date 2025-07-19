// login.js (bundled with device limit + logout cleanup)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  set,
  remove,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA0TjMoFSYBIs0VQ9shUilOuDGb1uXHjKI",
  authDomain: "iptv-log-in.firebaseapp.com",
  projectId: "iptv-log-in",
  storageBucket: "iptv-log-in.firebasestorage.app",
  messagingSenderId: "820026131349",
  appId: "1:820026131349:web:417abd6ad9057c55a92c9c",
  measurementId: "G-4Y8T6J595Z",
  databaseURL: "https://iptv-log-in-default-rtdb.firebaseio.com/"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Device ID
const deviceId = localStorage.getItem("deviceId") || crypto.randomUUID();
localStorage.setItem("deviceId", deviceId);

const MAX_DEVICES = 2;

// Login handler
window.login = async function () {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("error-message");
  const spinner = document.getElementById("spinner");

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  errorMessage.textContent = "";
  spinner.style.display = "inline-block";

  try {
    const userKey = email.replace(/\./g, "_");
    const devicesRef = ref(db, `devices/${userKey}`);
    const snapshot = await get(devicesRef);

    if (snapshot.exists()) {
      const devices = snapshot.val();
      const deviceCount = Object.keys(devices).length;

      if (!devices[deviceId] && deviceCount >= MAX_DEVICES) {
        throw new Error("Device limit exceeded. Max 2 devices allowed.");
      }
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    await set(ref(db, `devices/${userKey}/${deviceId}`), {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    });

    window.location.href = "index.html";
  } catch (error) {
    spinner.style.display = "none";
    errorMessage.textContent = error.message;
  }
};

// Logout handler (call on logout button click)
window.logout = async function () {
  const user = auth.currentUser;
  if (user) {
    const emailKey = user.email.replace(/\./g, "_");
    await remove(ref(db, `devices/${emailKey}/${deviceId}`));
    await signOut(auth);
    window.location.href = "login.html";
  }
};
