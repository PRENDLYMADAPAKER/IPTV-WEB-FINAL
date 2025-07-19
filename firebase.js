// firebase.js

// Your existing Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA0TjMoFSYBIs0VQ9shUilOuDGb1uXHjKI",
  authDomain: "iptv-log-in.firebaseapp.com",
  projectId: "iptv-log-in",
  storageBucket: "iptv-log-in.firebasestorage.app",
  messagingSenderId: "820026131349",
  appId: "1:820026131349:web:417abd6ad9057c55a92c9c",
  measurementId: "G-4Y8T6J595Z",
  databaseURL: "https://iptv-log-in-default-rtdb.firebaseio.com/" // Add this line
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Generate unique device ID and store in localStorage
function getDeviceId() {
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
}

// Check if device is already registered or within limit
async function checkDeviceLimit(user) {
  const deviceId = getDeviceId();
  const userDevicesRef = db.ref(`devices/${user.uid}`);

  const snapshot = await userDevicesRef.get();
  const devices = snapshot.exists() ? snapshot.val() : {};
  const deviceKeys = Object.keys(devices);

  // If current device already registered, allow login
  if (devices[deviceId]) return true;

  // Max device limit (change to 2 max)
  const MAX_DEVICES = 2;

  if (deviceKeys.length >= MAX_DEVICES) {
    return false;
  } else {
    // Register new device
    await userDevicesRef.child(deviceId).set(true);
    return true;
  }
}

// Log out and remove device from DB
async function logoutAndRemoveDevice(user) {
  const deviceId = getDeviceId();
  await db.ref(`devices/${user.uid}/${deviceId}`).remove();
  await auth.signOut();
}

// Hook login form
window.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const errorBox = document.getElementById("error-box");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.innerText = "";
      const email = loginForm.email.value;
      const password = loginForm.password.value;

      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        const allowed = await checkDeviceLimit(user);
        if (!allowed) {
          errorBox.innerText = "Device limit reached (2 max). Contact admin.";
          await auth.signOut();
          return;
        }

        window.location.href = "index.html"; // Success: go to IPTV
      } catch (error) {
        errorBox.innerText = error.message;
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
});
