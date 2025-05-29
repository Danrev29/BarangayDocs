// ✅ Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, query, orderBy,
  updateDoc, doc, addDoc, Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

// ✅ Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDUhreZ5WL2E6PEV_dn8I1oW68HLQyy88",
  authDomain: "barangaydocs-a4533.firebaseapp.com",
  projectId: "barangaydocs-a4533",
  storageBucket: "barangaydocs-a4533.appspot.com",
  messagingSenderId: "19682468687",
  appId: "1:19682468687:web:373002e9e37df2120f1b3a",
  measurementId: "G-CC1ZGLF3W5"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ DOM References
const notificationsList = document.getElementById("notificationsList");
const badge = document.getElementById("notificationBadge");
const logoutBtn = document.getElementById("logoutBtn");

// ✅ Display Notifications for Logged-in User
onAuthStateChanged(auth, async (user) => {
  if (!notificationsList) return;

  if (!user) {
    notificationsList.innerHTML = "<p>Please log in to view your notifications.</p>";
    return;
  }

  try {
    const notificationsRef = collection(db, "users", user.uid, "notifications");
    const q = query(notificationsRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    notificationsList.innerHTML = "";

    let unreadCount = 0;

    if (snapshot.empty) {
      notificationsList.innerHTML = "<p>No notifications yet.</p>";
      if (badge) badge.innerText = "";
      return;
    }

    snapshot.forEach(docSnap => {
      const notif = docSnap.data();
      const dateStr = notif.timestamp?.toDate().toLocaleString() || "No timestamp";

      const div = document.createElement("div");
      let statusClass = "";
      if (notif.title?.toLowerCase().includes("approved")) {
        statusClass = "approved";
      } else if (notif.title?.toLowerCase().includes("rejected")) {
        statusClass = "rejected";
      }

      if (notif.status === "unread") unreadCount++;

      div.className = `notification ${notif.status === "unread" ? "unread" : ""} ${statusClass}`;
      div.innerHTML = `
        <div class="title">${notif.title}</div>
        <div class="message">${notif.message}</div>
        <div class="timestamp">${dateStr}</div>
      `;

      // ✅ Mark as read on click
      div.addEventListener("click", async () => {
        if (notif.status === "unread") {
          await updateDoc(doc(db, "users", user.uid, "notifications", docSnap.id), {
            status: "read"
          });
          div.classList.remove("unread");
          unreadCount--;
          if (badge) badge.innerText = unreadCount > 0 ? unreadCount : "";
        }
      });

      notificationsList.appendChild(div);
    });

    // ✅ Update unread badge
    if (badge) {
      badge.innerText = unreadCount > 0 ? unreadCount : "";
    }

  } catch (err) {
    console.error("Error loading notifications:", err);
    notificationsList.innerHTML = "<p>Failed to load notifications.</p>";
  }
});

// ✅ "Finish" Button Logic for Mrequest Page
export function attachFinishListeners() {
  document.querySelectorAll(".finishBtn").forEach(button => {
    button.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const userId = e.target.dataset.userId;

      try {
        // ✅ Mark request as completed in Firestore
        await updateDoc(doc(db, "documentRequests", id), {
          notificationSent: true
        });

        // ✅ Send notification to user
        const notificationRef = collection(db, "users", userId, "notifications");
        await addDoc(notificationRef, {
          title: "Request Completed",
          message: "Your document request has been completed and is ready for pickup.",
          timestamp: Timestamp.fromDate(new Date()),
          status: "unread"
        });

        alert("Marked as finished and notification sent!");
        window.location.reload(); // Optional: Refresh the page
      } catch (err) {
        console.error("Failed to update Firestore: ", err);
      }
    });
  });
}

// ✅ Logout Button
  window.logout = async function () {
      await signOut(auth);
       alert("Logged out successfully!");
      window.location.href = "login.html";
    }

// ✅ Mobile Navbar Toggle
const toggleBtn = document.getElementById("navbarToggle");
const navbarLinks = document.querySelector(".navbar-links");

if (toggleBtn && navbarLinks) {
  toggleBtn.addEventListener("click", () => {
    navbarLinks.classList.toggle("show");
  });
}
