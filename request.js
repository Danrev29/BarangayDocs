// Firebase Initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';


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
const auth = getAuth(app);

// Handle User Authentication
let user = null;

onAuthStateChanged(auth, (firebaseUser) => {
  if (!firebaseUser) {
    window.location.href = "login.html";
  } else {
    user = firebaseUser;
    document.getElementById('userName').textContent = user.displayName || 'Name';
    document.getElementById('userEmail').textContent = user.email || 'Email';
    document.getElementById('profileDropdown').style.display = 'block';
    document.getElementById('loginLink').style.display = 'none';
  }
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  }).catch((error) => {
    console.error("Error logging out: ", error);
  });
});

// Modal Logic
const modal = document.getElementById("requestModal");
if (modal) {
  const modalContent = modal.querySelector(".modal-content");
  const closeBtn = document.getElementsByClassName("close")[0];
  const documentImages = document.querySelectorAll(".document-img");

  documentImages.forEach(img => {
    img.addEventListener("click", () => {
      const docType = img.getAttribute("data-doc");
      const modalTitle = document.getElementById("modalTitle");
      modalTitle.textContent = docType.replace(/-/g, ' ').toUpperCase();

      const additionalFields = document.getElementById("additionalFields");
      additionalFields.innerHTML = "";

      if (docType === "barangay-clearance") {
        additionalFields.innerHTML = `
          <label for="purpose">Purpose of Clearance:</label>
          <input type="text" id="purpose" name="purpose" required><br>`;
      } else if (docType === "barangay-permit") {
        additionalFields.innerHTML = `
          <label for="businessName">Business Name:</label>
          <input type="text" id="businessName" name="businessName" required><br>
          <label for="businessAddress">Business Address:</label>
          <input type="text" id="businessAddress" name="businessAddress" required><br>`;
      } else if (docType === "certificate-of-indigency") {
        additionalFields.innerHTML = `
          <label for="reason">Reason for Indigency Certificate:</label>
          <input type="text" id="reason" name="reason" required><br>`;
      } else if (docType === "community-tax") {
        additionalFields.innerHTML = `
          <label for="annualIncome">Annual Income:</label>
          <input type="number" id="annualIncome" name="annualIncome" required><br>`;
      } else if (docType === "certificate-of-good-moral") {
        additionalFields.innerHTML = `
          <label for="institution">Name of School/Institution:</label>
          <input type="text" id="institution" name="institution" required><br>`;
      }

      modal.style.display = "block";
      modalContent.style.animation = 'none';
      void modalContent.offsetWidth;
      modalContent.style.animation = 'popup 0.3s ease-out forwards';
    });
  });

  closeBtn.addEventListener("click", () => {
    modalContent.style.animation = 'popdown 0.3s ease-in forwards';
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modalContent.style.animation = 'popdown 0.3s ease-in forwards';
      setTimeout(() => {
        modal.style.display = "none";
      }, 300);
    }
  });
}



// 🔥 Upload file to Cloudinary
async function uploadFileToCloudinary(file) {
  const cloudName = 'dv6kpdk7n'; // Cloudinary cloud name
  const uploadPreset = 'unsigned_preset'; // Upload preset name

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return null;
  }
}


// Submit Request Form
const requestForm = document.getElementById("requestForm");

if (requestForm) {
  requestForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(requestForm);
    const requestType = document.getElementById("modalTitle").textContent.toLowerCase().replace(/\s/g, '-');

    const file = formData.get("fileUpload");
    let fileUrl = "";

    if (file && file.name) {
      fileUrl = await uploadFileToCloudinary(file);
    }

    const data = {
      fullName: formData.get("fullName"),
      address: formData.get("address"),
      contactNumber: formData.get("contactNumber"),
      birthDate: formData.get("birthDate"),
      message: formData.get("message") || "",
      requestType,
      fileUrl: fileUrl || "",
      status: "pending",
      createdAt: serverTimestamp(),
      userId: user ? user.uid : "",  // Store userId of the authenticated user
    };

    // Include dynamic additional fields
    if (requestType === "barangay-clearance") {
      data.purpose = formData.get("purpose");
    } else if (requestType === "barangay-permit") {
      data.businessName = formData.get("businessName");
      data.businessAddress = formData.get("businessAddress");
    } else if (requestType === "certificate-of-indigency") {
      data.reason = formData.get("reason");
    } else if (requestType === "community-tax") {
      data.annualIncome = formData.get("annualIncome");
    } else if (requestType === "certificate-of-good-moral") {
      data.institution = formData.get("institution");
    }

    try {
      await addDoc(collection(db, "documentRequests"), data);
      console.log("✅ Request submitted.");


      alert("✅ Your request has been submitted! You'll be notified when it's ready.");
      requestForm.reset();
      document.getElementById("additionalFields").innerHTML = "";
      modal.style.display = "none";
    } catch (error) {
      console.error("❌ Error submitting request:", error);
      alert("❌ Something went wrong. Please try again.");
    }
  });
}


const toggleBtn = document.getElementById('navbarToggle');
const navbarLinks = document.querySelector('.navbar-links');

if (toggleBtn && navbarLinks) {
  toggleBtn.addEventListener('click', () => {
    navbarLinks.classList.toggle('show');
  });
}
