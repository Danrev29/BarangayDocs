// Import Firebase app and Firestore modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

// Firebase config
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
const db = getFirestore(app);

/**
 * Fetches announcements from Firestore and displays them in the element
 * with ID "announcement-list".
 */
async function fetchAnnouncements() {
  const container = document.getElementById("announcement-list");
  if (!container) return; // Exit if the container element doesn't exist

  container.innerHTML = "<p>Loading announcements...</p>";

  try {
    const q = query(collection(db, "announcements"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);

    container.innerHTML = ""; // Clear loading text

    if (querySnapshot.empty) {
      container.innerHTML = "<p>No announcements available.</p>";
      return;
    }

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      
      // Format date safely
      let formattedDate = '';
      if (data.date && typeof data.date.toDate === 'function') {
        formattedDate = data.date.toDate().toLocaleString(); // date + time
      } else if (typeof data.date === 'string') {
        formattedDate = data.date; // fallback if it's plain text
      } else {
        formattedDate = "Unknown date"; // fallback if missing
      }

      const announcementHTML = `
        <div class="announcement" style="margin-bottom: 30px; background: #f9f9f9; padding: 50px; border-radius: 10px;">
          <h3>${data.title}</h3>
          <p>${data.description}</p>
            ${data.imageUrl ? `<img src="${data.imageUrl}" alt="Announcement Image" style=" border: solid 3px black; align-items: center; width: 100%; height: auto; margin-top: 10px;" >` : ''}
          <span class="date">Posted: ${timeAgo(data.date)}</span>
        </div>
      `;
      container.innerHTML += announcementHTML;
    });
  } catch (error) {
    container.innerHTML = "<p>Error loading announcements.</p>";
    console.error("Error fetching announcements:", error);
  }
}

// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", fetchAnnouncements);

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

const toggleBtn = document.getElementById('navbarToggle');
const navbarLinks = document.querySelector('.navbar-links');

if (toggleBtn && navbarLinks) {
  toggleBtn.addEventListener('click', () => {
    navbarLinks.classList.toggle('show');
  });
}

window.logout = async function () {
  await signOut(auth);
  alert("Logged out successfully!");
  window.location.href = "login.html";
};