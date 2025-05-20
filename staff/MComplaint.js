// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import {
    getFirestore, collection, getDocs, query, orderBy, doc,
    updateDoc, deleteDoc, getDoc, addDoc, where, setDoc
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

emailjs.init("O2dvKPhnqFENt2voB");

// Firebase Config
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
const auth = getAuth();  // Initialize Auth

// References
const complaintsGrid = document.getElementById("complaintsGrid");
const complaintsRef = collection(db, "complaints");

// Modal Elements
const modal = document.getElementById("complaintModal");
const closeModal = document.querySelector(".close");
const modalName = document.getElementById("modalName");
const modalAddress = document.getElementById("modalAddress");
const modalMessage = document.getElementById("modalMessage");
const modalDate = document.getElementById("modalDate");
const modalImage = document.getElementById("modalImage");
const resolvedButton = document.getElementById("resolvedButton");
const deleteButton = document.getElementById("deleteButton");

// Create Zoom Modal
const zoomModal = document.createElement("div");
zoomModal.style.display = "none";
zoomModal.style.position = "fixed";
zoomModal.style.top = "0";
zoomModal.style.left = "0";
zoomModal.style.width = "100%";
zoomModal.style.height = "100%";
zoomModal.style.backgroundColor = "rgba(0,0,0,0.9)";
zoomModal.style.zIndex = "3000";
zoomModal.style.justifyContent = "center";
zoomModal.style.alignItems = "center";
zoomModal.style.cursor = "zoom-out";

const zoomedImage = document.createElement("img");
zoomedImage.style.maxWidth = "90%";
zoomedImage.style.maxHeight = "90%";
zoomModal.appendChild(zoomedImage);

document.body.appendChild(zoomModal);

// Close zoom modal
zoomModal.addEventListener("click", () => {
    zoomModal.style.display = "none";
});

// Load Complaints
async function loadComplaints() {
    try {
        const complaintsQuery = query(complaintsRef, orderBy("timestamp", "desc"));
        const snapshot = await getDocs(complaintsQuery);

        complaintsGrid.innerHTML = "";

        if (snapshot.empty) {
            complaintsGrid.innerHTML = "<p>No complaints found.</p>";
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const complaintId = docSnap.id;
            const card = document.createElement("div");
            card.className = "complaint-card";
            card.setAttribute("data-id", complaintId);

            const formattedDateTime = data.timestamp
                ? new Date(data.timestamp.seconds * 1000).toLocaleString()
                : "No date";

            card.innerHTML = `
                <h3>${data.name}</h3>
                <p>${data.address}</p>
                <p class="complaint-date">${formattedDateTime}</p>
                ${data.status === "resolved" ? '<span class="status-badge completed">Resolved</span>' : ''}
            `;

            if (data.status === "resolved") {
                card.style.backgroundColor = "#d4edda";
            }

            card.addEventListener("click", () => {
                openModal(data, complaintId, card);
            });

            complaintsGrid.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading complaints:", error);
    }
}

// Open Modal
function openModal(data, complaintId, card) {
    modal.style.display = "block";
    modalName.textContent = data.name;
    modalAddress.textContent = data.address;
    modalMessage.textContent = data.message;
    modalDate.textContent = new Date(data.timestamp?.seconds * 1000).toLocaleString();

    if (data.imageURL) {
        modalImage.src = data.imageURL;
        modalImage.style.display = "block";
    } else {
        modalImage.style.display = "none";
    }

    modalImage.onclick = () => {
        zoomedImage.src = data.imageURL;
        zoomModal.style.display = "flex";
    };

    if (data.status !== "resolved") {
        resolvedButton.style.display = "block";
        resolvedButton.onclick = () => markAsResolved(complaintId, card);
    } else {
        resolvedButton.style.display = "none";
    }

    deleteButton.style.display = "block";
    deleteButton.onclick = () => deleteComplaint(complaintId, card);
}

async function markAsResolved(complaintId, card) {
    try {
      const complaintDocRef = doc(db, "complaints", complaintId);
  
      // Get the latest complaint data
      const complaintSnap = await getDoc(complaintDocRef);
      if (!complaintSnap.exists()) {
        console.error("❌ Complaint not found.");
        return;
      }
  
      const complaintData = complaintSnap.data();
  
      try {
        // ✅ 1️⃣ Update complaint status
        await updateDoc(complaintDocRef, { status: "resolved" });
        card.style.backgroundColor = "#d4edda";
        card.querySelector(".status-badge")?.remove();
        card.innerHTML += `<span class="status-badge completed">Resolved</span>`;
  
        // ✅ 2️⃣ Add to resolved_complaints
        const resolvedData = {
          complaintId: complaintId,
          fullName: complaintData.name,
          address: complaintData.address,
          message: complaintData.message,
          imageUrl: complaintData.imageURL || null,
          resolvedAt: new Date().toISOString(),
          resolvedBy: auth.currentUser.email,
        };
  
        // 🔍 Log resolved data to console
        console.log("🧾 Resolved data to be saved:", resolvedData);
  
        await setDoc(doc(db, "resolved_complaints", complaintId), resolvedData);
  
        // ✅ 3️⃣ Add notification to user
        const usersQuery = query(collection(db, "users"), where("email", "==", complaintData.email));
        const querySnapshot = await getDocs(usersQuery);
  
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userId = userDoc.id;
  
          const userNotificationRef = collection(db, "users", userId, "notifications");
          await addDoc(userNotificationRef, {
            title: "Complaint Resolved",
            message: "Your complaint has been resolved. Thank you for your patience.",
            type: "complaint",
            status: "unread",
            timestamp: new Date()
          });
        }
  
        // ✅ 4️⃣ Send email via EmailJS
        await emailjs.send("service_3scnxqg", "template_oqp02s9", {
          to_name: complaintData.name,
          email: complaintData.email,
          message: complaintData.message,
          status: "Resolved"
        });

        modal.style.display = "none";
  
        alert("✅ Complaint marked as resolved, saved, and notification sent!");
      } catch (error) {
        console.error("❌ Error resolving complaint:", error);
        alert(`❌ Failed to mark complaint as resolved. ${error.message}`);
      }
  
    } catch (error) {
      console.error("❌ Error fetching complaint data:", error);
      alert("❌ Failed to fetch complaint data.");
    }
  }

// Close Modal
closeModal.onclick = function () {
    modal.style.display = "none";
}
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Wait for auth state change to load complaints only if user is logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User signed in:", user.email);
    loadComplaints();
  } else {
    console.log("User not signed in.");
    complaintsGrid.innerHTML = "<p>Please sign in to view complaints.</p>";
  }
});

async function deleteComplaint(complaintId, card) {
  const confirmDelete = confirm("Are you sure you want to delete this complaint?");
  if (!confirmDelete) return;

  try {
      await deleteDoc(doc(db, "complaints", complaintId));
      card.remove(); // Remove the card from the UI
      modal.style.display = "none"; // Close modal
      alert("🗑️ Complaint successfully deleted.");
  } catch (error) {
      console.error("❌ Error deleting complaint:", error);
      alert("❌ Failed to delete complaint.");
  }
}
