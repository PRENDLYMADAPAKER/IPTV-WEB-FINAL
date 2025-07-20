// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Your Firebase config
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

document.getElementById("togglePassword").onclick = () => {
  const pw = document.getElementById("password");
  pw.type = pw.type === "password" ? "text" : "password";
};

window.login = function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorEl = document.getElementById("error");

  if (!email || !password) {
    errorEl.textContent = "Please enter email and password.";
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;
      const deviceId = navigator.userAgent.replace(/\W/g, "");

      const userRef = ref(db, "devices/" + uid);

      onValue(userRef, (snapshot) => {
        let data = snapshot.val() || {};
        let devices = Object.keys(data);
        let isKnown = devices.includes(deviceId);

        if (isKnown || devices.length < 2) {
          if (!isKnown) {
            data[deviceId] = true;
            set(userRef, data);
          }
          location.href = "iptv.html";
        } else {
          errorEl.textContent = "⚠️ Device limit exceeded (max 2).";
        }
      }, {
        onlyOnce: true
      });
    })
    .catch((error) => {
      errorEl.textContent = "❌ " + error.message;
    });
};
