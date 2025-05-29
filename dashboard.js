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
  collection,
  query,
  orderBy,
  getDocs,
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

  onAuthStateChanged(auth, async (firebaseUser) => {
    const isLoggedIn = !!firebaseUser;

    // Show/hide the first step
  // Hide "Create Account" step if logged in
  const createAccountStep = document.getElementById("stepCreateAccount");
  if (createAccountStep) {
    createAccountStep.style.display = isLoggedIn ? "none" : "block";

     // Get all step elements
  const allSteps = document.querySelectorAll(".step");

  // Filter visible steps and renumber their icons
  let stepNumber = 1;
  allSteps.forEach(step => {
    if (step.style.display !== "none") {
      const icon = step.querySelector(".step-icon");
      if (icon) {
        icon.textContent = stepNumber++;
      }
    }
  });
  }

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

          if (data.role === "admin") {
            window.location.href = "staff/Mrequest.html";
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

      if (userNameEl) userNameEl.textContent = `Name: ${displayName}`;
      if (userEmailEl) userEmailEl.textContent = `Email: ${firebaseUser.email}`;
    }

    document.body.classList.remove("loading");
    if (loadingScreen) loadingScreen.style.display = "none";
    if (pageContent) pageContent.style.display = "block";
  });

window.logout = async function () {
  await signOut(auth);
  alert("Logged out successfully!");
  window.location.href = "login.html";
};

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

// Navbar toggle (mobile)
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("navbarToggle");
  const navbarLinks = document.getElementById("navbarLinks");

  if (toggleBtn && navbarLinks) {
    toggleBtn.addEventListener("click", () => {
      navbarLinks.classList.toggle("show");
    });
  }
});

 const sliderContainer = document.getElementById("announcementSlider");

async function loadAnnouncements() {
  if (!sliderContainer) return;

  const q = query(collection(db, 'announcements'), orderBy("date", "desc"));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    sliderContainer.innerHTML = "<div class='announcement-slide active'>No announcements yet.</div>";
    return;
  }

  snapshot.forEach((doc, index) => {
    const data = doc.data();
    const div = document.createElement('div');
    div.classList.add('announcement-slide');
    if (index === 0) div.classList.add('active');

    const formattedDate = data.date.toDate().toLocaleDateString();

    // Wrap content in a link to announce.html
    div.innerHTML = `
      <a href="announce.html" style="text-decoration: none; color: inherit; text-align: center;">
        <h3>${data.title}</h3><br>
        <p>${data.description}</p>
      
                ${data.imageUrl ? `<img src="${data.imageUrl}" alt="Announcement Image" style="align-items: center; width: 100%; height: auto; margin-top: 10px;">` : ''}
          <span class="date">Posted: ${timeAgo(data.date)}</span>
      </a>
    `;

    sliderContainer.appendChild(div);
  });

  startSlideShow();
}

function startSlideShow() {
  const slides = document.querySelectorAll('.announcement-slide');
  let current = 0;

  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 5000); // Change slide every 5 seconds
}

loadAnnouncements();
function timeAgo(timestamp) {
  const now = new Date();
  const postedDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((now - postedDate) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}
  

