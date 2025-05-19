import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDUhreZ5WL2E6PEV_dn8I1oW68HLQyy88",
  authDomain: "barangaydocs-a4533.firebaseapp.com",
  projectId: "barangaydocs-a4533",
  storageBucket: "barangaydocs-a4533.appspot.com",
  messagingSenderId: "19682468687",
  appId: "1:19682468687:web:373002e9e37df2120f1b3a",
  measurementId: "G-CC1ZGLF3W5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set persistent login
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Auth persistence enabled"))
  .catch((error) => console.error("Error setting persistence:", error));

document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const loginLink = document.getElementById("loginLink");
  const profileDropdown = document.getElementById("profileDropdown");
  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginBtn = document.getElementById("loginBtn");
  const loadingScreen = document.getElementById("loadingScreen");
  const pageContent = document.getElementById("pageContent");

  // Optional elements may not exist on every page
  const protectedLinks = [
    document.getElementById("requestLink"),
    document.getElementById("complaintLink"),
  ];

const profileBtn = document.getElementById("profileBtn");
  const dropdownContent = document.querySelector(".dropdown-content");
  if (profileBtn && dropdownContent) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownContent.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      dropdownContent.classList.remove("show");
    });

    dropdownContent.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // Auth state listener
  onAuthStateChanged(auth, async (firebaseUser) => {
    const isLoggedIn = !!firebaseUser;

    if (loginLink) loginLink.style.display = isLoggedIn ? "none" : "inline-block";
    if (profileDropdown) profileDropdown.style.display = isLoggedIn ? "inline-block" : "none";
    if (loginBtn) loginBtn.style.display = isLoggedIn ? "none" : "block";

    if (isLoggedIn) {
      let displayName = firebaseUser.displayName || "Anonymous";

      try {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          displayName = data.name || displayName;

          // 🛡️ BLOCK ADMIN ACCOUNTS from User Home
          if (data.role === "admin") {

            window.location.href = "staff/Mrequest.html"; // redirect admin to admin page
            return; // stop the code
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

if (userNameEl) userNameEl.textContent = `Name: ${displayName}`;
if (userEmailEl) userEmailEl.textContent = `Email: ${firebaseUser.email}`;

    }

    // Hide loading screen
    document.body.classList.remove("loading");
    if (loadingScreen) loadingScreen.style.display = "none";
    if (pageContent) pageContent.style.display = "block";
  });

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        alert("Logged out successfully!");
        window.location.href = "index.html";
      } catch (error) {
        alert("Logout failed: " + error.message);
      }
    });
  }

  // Protect certain links
  protectedLinks.forEach((link) => {
    if (link) {
      link.addEventListener("click", (e) => {
        if (!auth.currentUser) {
          e.preventDefault();
          alert("Please log in to access this feature.");
          window.location.href = "login.html";
        }
      });
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("navbarToggle");
  const navbarLinks = document.getElementById("navbarLinks");

  toggleBtn.addEventListener("click", () => {
    navbarLinks.classList.toggle("show");
  });
});