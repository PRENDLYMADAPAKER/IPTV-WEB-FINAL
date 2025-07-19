// firebase.js

const firebaseConfig = {
  apiKey: "AIzaSyA0TjMoFSYBIs0VQ9shUilOuDGb1uXHjKI",
  authDomain: "iptv-log-in.firebaseapp.com",
  projectId: "iptv-log-in",
  storageBucket: "iptv-log-in.appspot.com",
  messagingSenderId: "820026131349",
  appId: "1:820026131349:web:417abd6ad9057c55a92c9c",
  measurementId: "G-4Y8T6J595Z",
  databaseURL: "https://iptv-log-in-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Generate or retrieve device ID
function getDeviceId() {
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
}

// Show toast messages
function showToast(message, success = false) {
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = message;
  toast.style.backgroundColor = success ? "#00c851" : "#ff4444";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Check if device is registered or within limit
async function checkDeviceLimit(user) {
  const deviceId = getDeviceId();
  const userDevicesRef = db.ref(`devices/${user.uid}`);

  const snapshot = await userDevicesRef.get();
  const devices = snapshot.exists() ? snapshot.val() : {};
  const deviceKeys = Object.keys(devices);

  if (devices[deviceId]) return true;

  const MAX_DEVICES = 2;

  if (deviceKeys.length >= MAX_DEVICES) {
    return false;
  } else {
    await userDevicesRef.child(deviceId).set(true);
    return true;
  }
}

// Remove device on logout
async function logoutAndRemoveDevice(user) {
  const deviceId = getDeviceId();
  await db.ref(`devices/${user.uid}/${deviceId}`).remove();
  await auth.signOut();
  sessionStorage.clear(); // clear session auth
}

// UI: Toggle password visibility
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggle-password");
  const password = document.getElementById("password");

  if (toggle && password) {
    toggle.addEventListener("click", () => {
      const type = password.getAttribute("type") === "password" ? "text" : "password";
      password.setAttribute("type", type);
      toggle.classList.toggle("visible");
    });
  }

  const loginForm = document.getElementById("login-form");
  const loginBtn = document.getElementById("login-btn");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = loginForm.email.value;
      const password = loginForm.password.value;

      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        const allowed = await checkDeviceLimit(user);
        if (!allowed) {
          showToast("Max device limit reached (2)", false);
          await auth.signOut();
          return;
        }

        showToast("Login successful!", true);
        sessionStorage.setItem("loggedIn", "true");
        setTimeout(() => window.location.href = "index.html", 1500);
      } catch (error) {
        showToast("Incorrect email or password.", false);
      }
    });
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (user) {
        await logoutAndRemoveDevice(user);
        window.location.href = "login.html";
      }
    });
  }

  // Prevent access to index.html if not logged in
  if (window.location.pathname.includes("index.html")) {
    auth.onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = "login.html";
      }
    });
  }

  // Restore login UI styling if user logs out
  if (window.location.pathname.includes("login.html")) {
    document.body.classList.add("login-page");
  }
});
