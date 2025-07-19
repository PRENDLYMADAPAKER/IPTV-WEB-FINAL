// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA0TjMoFSYBIs0VQ9shUilOuDGb1uXHjKI",
  authDomain: "iptv-log-in.firebaseapp.com",
  projectId: "iptv-log-in",
  storageBucket: "iptv-log-in.firebasestorage.app",
  messagingSenderId: "820026131349",
  appId: "1:820026131349:web:417abd6ad9057c55a92c9c",
  measurementId: "G-4Y8T6J595Z"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Show toast message
function showToast(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Save device ID
function getDeviceId() {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
}

// Handle login
document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const { user } = await auth.signInWithEmailAndPassword(email, password);
    const userId = user.uid;
    const deviceId = getDeviceId();
    const devicesRef = db.collection("devices").doc(userId);
    const doc = await devicesRef.get();

    if (!doc.exists) {
      await devicesRef.set({ ids: [deviceId] });
    } else {
      let ids = doc.data().ids || [];

      // Check if device already registered
      if (!ids.includes(deviceId)) {
        if (ids.length >= 2) {
          showToast("Max device limit reached");
          auth.signOut();
          return;
        }
        ids.push(deviceId);
        await devicesRef.update({ ids });
      }
    }

    showToast("Login successful!");
    setTimeout(() => {
      window.location.href = "iptv.html";
    }, 1200);

  } catch (error) {
    console.error(error);
    showToast("Invalid email or password");
  }
});

// Auto redirect if already logged in
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const currentPage = window.location.pathname;
    if (currentPage.includes("login.html")) {
      window.location.href = "iptv.html";
    }
  }
});

// Force redirect to login if not logged in
if (window.location.pathname.includes("iptv.html")) {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "login.html";
    }
  });
}

// Logout button
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (user) {
      const deviceId = getDeviceId();
      const ref = db.collection("devices").doc(user.uid);
      const doc = await ref.get();
      if (doc.exists) {
        let ids = doc.data().ids || [];
        ids = ids.filter((id) => id !== deviceId);
        await ref.update({ ids });
      }
    }
    await auth.signOut();
    localStorage.removeItem("device_id");
    window.location.href = "login.html";
  });
}
