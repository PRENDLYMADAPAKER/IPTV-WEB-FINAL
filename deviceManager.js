// deviceManager.js

import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getDatabase, ref, onValue, set, remove, get, child } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

const generateDeviceId = () => {
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
};

export async function registerDevice() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  const db = getDatabase();
  const userDevicesRef = ref(db, `devices/${user.uid}`);
  const snapshot = await get(userDevicesRef);

  let devices = snapshot.exists() ? snapshot.val() : {};
  const deviceId = generateDeviceId();
  const timestamp = Date.now();

  // Check if this device already registered
  if (devices[deviceId]) {
    devices[deviceId].lastActive = timestamp;
  } else {
    devices[deviceId] = { lastActive: timestamp };
  }

  // If more than 2 devices, remove the oldest
  const entries = Object.entries(devices);
  if (entries.length > 2) {
    const sorted = entries.sort((a, b) => a[1].lastActive - b[1].lastActive);
    const [oldestDeviceId] = sorted[0];
    delete devices[oldestDeviceId];
  }

  await set(userDevicesRef, devices);
}

export function watchDeviceRemoval() {
  const auth = getAuth();
  const db = getDatabase();
  const deviceId = generateDeviceId();

  auth.onAuthStateChanged((user) => {
    if (!user) return;
    const deviceRef = ref(db, `devices/${user.uid}/${deviceId}`);

    onValue(deviceRef, (snapshot) => {
      if (!snapshot.exists()) {
        alert("This device was removed from your account.");
        signOut(auth).then(() => {
          window.location.href = "login.html";
        });
      }
    });
  });
            }
