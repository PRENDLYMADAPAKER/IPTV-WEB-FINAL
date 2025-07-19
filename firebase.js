// firebase.js

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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

function getDeviceId() {
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
}

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

async function logoutAndRemoveDevice(user) {
  const deviceId = getDeviceId();
  await db.ref(`devices/${user.uid}/${deviceId}`).remove();
  await auth.signOut();
}

function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  if (toast) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), duration);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const errorBox = document.getElementById("error-box");

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const allowed = await checkDeviceLimit(user);
      if (allowed) {
        window.location.href = "index.html";
      } else {
        showToast("Device limit reached. Max 2 devices allowed.");
        await auth.signOut();
      }
    }
  });

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.textContent = "";

      const email = loginForm.email.value;
      const password = loginForm.password.value;

      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        const allowed = await checkDeviceLimit(user);
        if (!allowed) {
          showToast("Device limit reached. Max 2 devices allowed.");
          await auth.signOut();
          return;
        }

        showToast("Login successful 🎉 Redirecting...");
        setTimeout(() => window.location.href = "index.html", 1500);
      } catch (error) {
        showToast("Incorrect email or password.");
        errorBox.textContent = error.message;
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
