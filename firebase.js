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
const db = firebase.database();

// Show toast
function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.backgroundColor = isError ? "#ff3c3c" : "#4caf50";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
}

// Save current device
function saveDevice(uid) {
  const deviceId = navigator.userAgent + "_" + Math.random().toString(36).substring(2);
  const ref = db.ref("devices/" + uid);
  return ref.once("value").then(snapshot => {
    const devices = snapshot.val() || {};
    const deviceKeys = Object.keys(devices);
    if (deviceKeys.length >= 2 && !Object.values(devices).includes(deviceId)) {
      throw new Error("Max device limit reached.");
    }
    devices[Date.now()] = deviceId;
    return ref.set(devices);
  });
}

// Login
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showToast("Please enter email and password", true);
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      return saveDevice(user.uid).then(() => {
        showToast("Login successful");
        setTimeout(() => {
          window.location.href = "iptv.html";
        }, 1000);
      });
    })
    .catch(error => {
      if (error.message.includes("Max device")) {
        showToast("Max device limit reached", true);
        auth.signOut();
      } else {
        showToast("Incorrect email or password", true);
      }
    });
}

// Auto-redirect if already logged in
auth.onAuthStateChanged(user => {
  if (user && window.location.pathname.endsWith("login.html")) {
    window.location.href = "iptv.html";
  }
});
