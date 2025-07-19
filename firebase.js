// Firebase config (already initialized)
const firebaseConfig = {
  apiKey: "AIzaSyA0TjMoFSYBIs0VQ9shUilOuDGb1uXHjKI",
  authDomain: "iptv-log-in.firebaseapp.com",
  projectId: "iptv-log-in",
  storageBucket: "iptv-log-in.appspot.com",
  messagingSenderId: "820026131349",
  appId: "1:820026131349:web:417abd6ad9057c55a92c9c",
  measurementId: "G-4Y8T6J595Z"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const adminEmail = "nzm19980404@gmail.com";

// Show toast
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Generate device ID
function getDeviceId() {
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = "device-" + Math.random().toString(36).substring(2, 12);
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
}

// Handle login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const deviceId = getDeviceId();

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    if (email === adminEmail) {
      // Admin, skip device check
      window.location.href = "iptv.html";
      return;
    }

    const userRef = db.collection("devices").doc(user.uid);
    const doc = await userRef.get();
    let deviceList = [];

    if (doc.exists) {
      deviceList = doc.data().deviceIds || [];
    }

    if (!deviceList.includes(deviceId)) {
      if (deviceList.length >= 2) {
        showToast("Max device limit reached!");
        await auth.signOut();
        return;
      }
      deviceList.push(deviceId);
      await userRef.set({ deviceIds: deviceList });
    }

    showToast("Login successful!");
    setTimeout(() => {
      window.location.href = "iptv.html";
    }, 1500);
  } catch (error) {
    showToast("Incorrect email or password!");
    console.error(error.message);
  }
});

// Auto redirect if logged in
auth.onAuthStateChanged((user) => {
  if (user && window.location.pathname.includes("login")) {
    window.location.href = "iptv.html";
  }
});

// Toggle password visibility
document.getElementById("toggle-password").addEventListener("click", () => {
  const passwordField = document.getElementById("password");
  passwordField.type = passwordField.type === "password" ? "text" : "password";
});
