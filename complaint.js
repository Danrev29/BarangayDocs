 // ✅ Import Firebase modules
 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
 import {
   getFirestore,
   collection,
   addDoc,
   serverTimestamp,
   getDocs,
   deleteDoc,
   doc,
   query,
   where,
   getDoc
 } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
 import {
   getAuth,
   onAuthStateChanged
 } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
 
 
 
 // ✅ Firebase Config
 const firebaseConfig = {
   apiKey: "AIzaSyCDUhreZ5WL2E6PEV_dn8I1oW68HLQyy88",
   authDomain: "barangaydocs-a4533.firebaseapp.com",
   projectId: "barangaydocs-a4533",
   storageBucket: "barangaydocs-a4533.appspot.com",
   messagingSenderId: "19682468687",
   appId: "1:19682468687:web:373002e9e37df2120f1b3a",
   measurementId: "G-CC1ZGLF3W5"
 };
 
 // ✅ Cloudinary Config
 const cloudinaryUrl = "https://api.cloudinary.com/v1_1/dv6kpdk7n/image/upload";
 const cloudinaryUploadPreset = "unsigned_preset";
 
 // ✅ Initialize Firebase
 const app = initializeApp(firebaseConfig);
 const db = getFirestore(app);
 const auth = getAuth(app);
 
 // ✅ Get DOM elements
 const complaintForm = document.getElementById("complaintForm");
 const userComplaintsContainer = document.getElementById("userComplaints");
 const responseMessage = document.getElementById("responseMessage");
 
 // ✅ Submit Complaint
if (complaintForm) {
const submitBtn = document.getElementById("submitBtn");

complaintForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("fullName").value.trim();
  const address = document.getElementById("userAddress").value.trim();
  const message = document.getElementById("complaintMessage").value.trim();
  const imageFile = document.getElementById("complaintImage").files[0];
  const spinner = document.getElementById("loadingSpinner");

  let imageURL = "";

  // ✅ Disable submit button
  submitBtn.disabled = true;
  submitBtn.innerText = "Submitting...";
  spinner.style.display = "block";

  if (!auth.currentUser) {
    alert("You must be logged in to submit a complaint.");
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit";
    spinner.style.display = "none";
    return;
  }

  // ✅ Upload image to Cloudinary (if provided)
  if (imageFile) {
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", cloudinaryUploadPreset);

    try {
      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      imageURL = data.secure_url;
    } catch (error) {
      console.error("❌ Error uploading image to Cloudinary:", error);
      alert("Image upload failed. Please try again.");
      submitBtn.disabled = false;
      submitBtn.innerText = "Submit";
      spinner.style.display = "none";
      return;
    }
  }

  try {
    await addDoc(collection(db, "complaints"), {
      name,
      address,
      message,
      imageURL: imageURL || "",
      email: auth.currentUser.email,
      userId: auth.currentUser.uid,
      status: "pending",
      timestamp: new Date()
    });

    await addDoc(collection(db, "users", auth.currentUser.uid, "notifications"), {
      title: "Complaint Submitted",
      message: "Your complaint has been submitted and will be reviewed shortly.",
      timestamp: new Date(),
      type: "complaint",
      status: "unread"
    });

    responseMessage.innerText = "✅ Complaint submitted successfully!";
    complaintForm.reset();
    loadUserComplaints();
  } catch (err) {
    console.error("❌ Failed to submit complaint:", err);
    responseMessage.innerText = "❌ Failed to submit complaint.";
  } finally {
    spinner.style.display = "none";
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit";

    setTimeout(() => {
      responseMessage.innerText = "";
    }, 3000);
  }
});

}

 
 // ✅ Load User's Complaints
 async function loadUserComplaints() {
   userComplaintsContainer.innerHTML = "";
   const spinner = document.getElementById("loadingSpinner");
   spinner.style.display = "block";
 
   if (!auth.currentUser) return;
 
   try {
     const q = query(collection(db, "complaints"), where("userId", "==", auth.currentUser.uid));

     const snapshot = await getDocs(q);
 
     if (snapshot.empty) {
       userComplaintsContainer.innerHTML = "<p>No complaints yet.</p>";
     } else {
       snapshot.forEach(docSnap => {
         const complaint = docSnap.data();
         const complaintId = docSnap.id;
         const timestamp = complaint.timestamp?.toDate();
         const formattedDateTime = timestamp ? timestamp.toLocaleString() : "N/A";
 
         const card = document.createElement("div");
         card.className = "complaint-card";
         if (complaint.status === "resolved") {
           card.classList.add("resolved");
         }
 
         card.innerHTML = `
           <p><strong>Name:</strong> ${complaint.name}</p>
           <p><strong>Address:</strong> ${complaint.address}</p>
           <p><strong>Message:</strong> ${complaint.message}</p>
           <p><strong>Status:</strong> ${complaint.status}</p>
           <p><strong>Date & Time:</strong> ${formattedDateTime}</p>
           ${complaint.imageURL ? `<img src="${complaint.imageURL}" alt="Complaint Image" style="max-width:100%; margin-top:10px; border-radius:8px;">` : ""}
           <button class="delete-btn" onclick="deleteComplaint('${complaintId}')">Delete</button>
           <hr style="margin:20px 0;">
         `;
 
         userComplaintsContainer.appendChild(card);
       });
     }
   } catch (error) {
     console.error("❌ Error loading complaints:", error);
   } finally {
     spinner.style.display = "none";
   }
 }
 
 // ✅ Delete Complaint
 async function deleteComplaint(complaintId) {
   if (confirm("Are you sure you want to delete this complaint?")) {
     try {
       await deleteDoc(doc(db, "complaints", complaintId));
       alert("✅ Complaint deleted successfully!");
       loadUserComplaints();
     } catch (err) {
       console.error("❌ Error deleting complaint:", err);
     }
   }
 }
 window.deleteComplaint = deleteComplaint;
 
 // ✅ Monitor Auth State
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    // ✅ Load user's full name from Firestore
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const fullNameInput = document.getElementById("fullName");
        if (fullNameInput) {
          fullNameInput.value = userData.name || ""; // Adjust field name if different
        }
      } else {
        console.warn("User data not found in Firestore.");
      }
    } catch (error) {
      console.error("❌ Failed to fetch user data:", error);
    }

    loadUserComplaints();
  }
});

 
 // ✅ Add CSS for resolved complaints
 const style = document.createElement("style");
 style.innerHTML = `
   .resolved {
     background-color: #d4edda;
     border: 2px solid #28a745;
   }
 `;
 document.head.appendChild(style);
 
 
 const toggleBtn = document.getElementById('navbarToggle');
 const navbarLinks = document.querySelector('.navbar-links');
 
 if (toggleBtn && navbarLinks) {
   toggleBtn.addEventListener('click', () => {
     navbarLinks.classList.toggle('show');
   });
 }


  const modal = document.getElementById("complaintModal");
  const openBtn = document.getElementById("openComplaintModal");
  const closeBtn = document.getElementById("closeModal");

  openBtn.onclick = () => modal.style.display = "block";
  closeBtn.onclick = () => modal.style.display = "none";

  // Close modal when clicking outside the modal content
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  
const listModal = document.getElementById("complaintListModal");
const openListBtn = document.getElementById("viewComplaintListBtn");
const closeListBtn = document.getElementById("closeListModal");

openListBtn.onclick = () => {
  listModal.style.display = "block";
  loadUserComplaints(); // Load complaints every time modal opens
};

closeListBtn.onclick = () => {
  listModal.style.display = "none";
};

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
  if (event.target == listModal) {
    listModal.style.display = "none";
  }
};
