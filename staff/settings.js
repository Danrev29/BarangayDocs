import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDUhreZ5WL2E6PEV_dn8I1oW68HLQyy88",
  authDomain: "barangaydocs-a4533.firebaseapp.com",
  projectId: "barangaydocs-a4533",
  storageBucket: "barangaydocs-a4533.appspot.com",
  messagingSenderId: "19682468687",
  appId: "1:19682468687:web:373002e9e37df2120f1b3a",
  measurementId: "G-CC1ZGLF3W5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set authentication persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Persistence set"))
  .catch((error) => console.error("Persistence error:", error));

// DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const loginBtn = document.getElementById("loginBtn");

  // Monitor authentication state
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const uid = user.uid;
      const adminDocRef = doc(db, "users", uid);

      const uploadBtn = document.getElementById("uploadPhotoBtn");
const photoInput = document.getElementById("photoUpload");
const profilePhoto = document.getElementById("profilePhoto");

const CLOUD_NAME = "dv6kpdk7n";
const UPLOAD_PRESET = "unsigned_preset";

uploadBtn.addEventListener("click", () => {
  // Trigger file input when button is clicked
  photoInput.click();
});

photoInput.addEventListener("change", async () => {
  const file = photoInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    const imageUrl = data.secure_url;

    // Update Firestore with the image URL
    await setDoc(doc(db, "users", auth.currentUser.uid), { photoUrl: imageUrl }, { merge: true });

    // Update the profile image
    profilePhoto.src = imageUrl;
    alert("Photo uploaded successfully!");
  } catch (err) {
    console.error("Upload failed:", err);
    alert("Photo upload failed.");
  }
});

      // Load admin data
      try {
        const docSnap = await getDoc(adminDocRef);
        if (docSnap.exists()) {
          const adminData = docSnap.data();
          document.getElementById("profilePhoto").src = adminData.photoUrl || "default-avatar.png";
          document.getElementById("name").textContent = adminData.name || "N/A";
          document.getElementById("email").textContent = adminData.email || "N/A";
          document.getElementById("phone").textContent = adminData.phone || "N/A";
        } else {
          console.warn("No such admin document!");
        }
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      }
    } else {
      // Redirect to login if not authenticated
      window.location.href = "/login.html";
    }
  });

  // Logout functionality
  logoutBtn?.addEventListener("click", async () => {
    const spinnerOverlay = document.getElementById("spinnerOverlay");
    try {
      if (spinnerOverlay) spinnerOverlay.style.display = "flex";
      await signOut(auth);
      alert("Logged out successfully!");
      window.location.href = "/login.html";
    } catch (error) {
      alert("Logout failed: " + error.message);
    } finally {
      if (spinnerOverlay) spinnerOverlay.style.display = "none";
    }
  });

  // Redirect to login
  loginBtn?.addEventListener("click", () => {
    window.location.href = "login.html";
  });
});
