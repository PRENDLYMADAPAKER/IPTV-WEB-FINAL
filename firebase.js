// firebase.js

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

// Utility to generate device ID
function getDeviceId() {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
}

// Max 2 devices logic
async function handleLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const status = document.getElementById("login-status");

  status.textContent = "Logging in...";

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const uid = cred.user.uid;
    const deviceId = getDeviceId();

    const docRef = db.collection("devices").doc(uid);
    const doc = await docRef.get();

    let devices = [];
    if (doc.exists) {
      devices = doc.data().deviceIds || [];
    }

    if (!devices.includes(deviceId)) {
      if (devices.length >= 2) {
        await auth.signOut();
        status.textContent = "Device limit reached (2 max).";
        return;
      }
      devices.push(deviceId);
      await docRef.set({ deviceIds: devices });
    }

    // Login success
    status.textContent = "Login successful!";
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("iptv-screen").style.display = "block";

  } catch (error) {
    status.textContent = "Login failed: " + error.message;
  }
}

// Logout and device cleanup
async function handleLogout() {
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    const deviceId = getDeviceId();
    const docRef = db.collection("devices").doc(uid);

    const doc = await docRef.get();
    if (doc.exists) {
      let devices = doc.data().deviceIds || [];
      devices = devices.filter(id => id !== deviceId);
      await docRef.set({ deviceIds: devices });
    }

    localStorage.removeItem("device_id");
    await auth.signOut();
    location.reload();
  }
}
