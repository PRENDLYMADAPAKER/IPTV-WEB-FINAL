// firebase.js

const firebaseConfig = {
  apiKey: "AIzaSyA0TjMoFSYBIs0VQ9shUilOuDGb1uXHjKI",
  authDomain: "iptv-log-in.firebaseapp.com",
  projectId: "iptv-log-in",
  storageBucket: "iptv-log-in.firebasestorage.app",
  messagingSenderId: "820026131349",
  appId: "1:820026131349:web:417abd6ad9057c55a92c9c",
  measurementId: "G-4Y8T6J595Z",
  databaseURL: "https://iptv-log-in-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const userId = userCredential.user.uid;
    const deviceId = getDeviceId();

    const userRef = db.ref("devices/" + userId);
    const snapshot = await userRef.once("value");
    const devices = snapshot.val() || {};

    // If this device is already registered, allow login
    if (Object.values(devices).includes(deviceId)) {
      showToast("Login success!");
      redirectToApp();
      return;
    }

    // If less than 2 devices, register this one
    if (Object.keys(devices).length < 2) {
      const newKey = userRef.push().key;
      await userRef.child(newKey).set(deviceId);
      showToast("Login success!");
      redirectToApp();
    } else {
      showToast("Maximum 2 devices reached!");
      auth.signOut();
    }
  } catch (err) {
    showToast("Login failed: " + err.message);
  }
}

function getDeviceId() {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = generateRandomId();
    localStorage.setItem("device_id", id);
  }
  return id;
}

function generateRandomId() {
  return "device-" + Math.random().toString(36).substring(2, 10);
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 3000);
}

function redirectToApp() {
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
}

// Auto redirect if already logged in
auth.onAuthStateChanged((user) => {
  if (user && window.location.pathname.includes("login")) {
    redirectToApp();
  }
});
