// Firebase Initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';
import { updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';

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

// Authentication
let user = null;

onAuthStateChanged(auth, (firebaseUser) => {
  if (!firebaseUser) {
    window.location.href = "login.html";
  } else {
    user = firebaseUser;
 const userNameEl = document.getElementById('userName');
const userEmailEl = document.getElementById('userEmail');
const profileDropdownEl = document.getElementById('profileDropdown');
const loginLinkEl = document.getElementById('loginLink');

if (userNameEl) userNameEl.textContent = user.displayName || 'Name';
if (userEmailEl) userEmailEl.textContent = user.email || 'Email';
if (profileDropdownEl) profileDropdownEl.style.display = 'block';
if (loginLinkEl) loginLinkEl.style.display = 'none';

    fetchUserRequests(user.uid);
    
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
  const closeBtn = document.querySelector(".close");
  const documentImages = document.querySelectorAll(".document-img");
  const documentDropdown = document.getElementById("documentTypeDropdown");
  const modalTitle = document.getElementById("modalTitle");
  const additionalFields = document.getElementById("additionalFields");

  function updateModalContent(docType) {
    if (!docType) return;
    modalTitle.textContent = docType.replace(/-/g, ' ').toUpperCase();
    additionalFields.innerHTML = "";

    switch (docType) {
      case "barangay-clearance":
        additionalFields.innerHTML = `
         <label for="proof">Proof of Residency:</label>
          <input type="file" id="proof" name="proof" accept="image/*,application/pdf" multiple><br>
           <label for="ctc">Community Tax Certificate (Cedula):</label>
          <input type="file" id="ctc" name="ctc" accept="image/*,application/pdf" required><br>`;
        break;
      case "certificate-of-residency":
        additionalFields.innerHTML = `
          <label for="proof">Proof of Residency:</label>
          <input type="file" id="proof" name="proof" accept="image/*,application/pdf" multiple><br>
          `;
          
        break;
      case "barangay-permit":
        additionalFields.innerHTML = `
          <label for="businessName">Business Name:</label>
          <input type="text" id="businessName" name="businessName" required><br>
          <label for="businessAddress">Business Address:</label>
          <input type="text" id="businessAddress" name="businessAddress" required><br>
          <label for="dtiRegistration">DTI Registration (PDF/Image):</label>
          <input type="file" id="dtiRegistration" name="dtiRegistration" accept="image/*,application/pdf" required><br>
          <label for="leaseContract">Lease Contract or Proof of Business Address (PDF/Image):</label>
          <input type="file" id="leaseContract" name="leaseContract" accept="image/*,application/pdf" required><br>`;
        break;
      case "certificate-of-indigency":
        additionalFields.innerHTML = `
          <label for="reason">Purpose of Indigency Certificate:</label>
          <select id="reason" name="reason" required>
            <option value="">Select a purpose</option>
            <option value="Educational Assistance">Educational Assistance</option>
            <option value="Financial Assistance">Financial Assistance</option>
            <option value="Scholarship Requirement">Scholarship Requirement</option>
            <option value="Medical Assistance">Medical Assistance</option>
            <option value="Job Requirement">Job Requirement</option>
            <option value="Others">Others</option>
          </select><br>`;
        break;
      case "barangay-certificate":
        additionalFields.innerHTML = `
           <label for="proof">Proof of Residency:</label>
          <input type="file" id="proof" name="proof" accept="image/*,application/pdf" multiple><br>`;
        break;
    }
  }

  documentImages.forEach(img => {
    img.addEventListener("click", () => {
      const docType = img.getAttribute("data-doc");
      updateModalContent(docType);
      if (documentDropdown) documentDropdown.value = docType;

      modal.style.display = "block";
      modalContent.style.animation = 'none';
      void modalContent.offsetWidth;
      modalContent.style.animation = 'popup 0.3s ease-out forwards';
    });
  });

  documentDropdown?.addEventListener("change", () => {
    updateModalContent(documentDropdown.value);
  });

  closeBtn?.addEventListener("click", () => {
    modalContent.style.animation = 'popdown 0.3s ease-in forwards';
    setTimeout(() => { modal.style.display = "none"; }, 300);
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modalContent.style.animation = 'popdown 0.3s ease-in forwards';
      setTimeout(() => { modal.style.display = "none"; }, 300);
    }
  });
}

// Cloudinary Upload
async function uploadFileToCloudinary(file) {
  const cloudName = 'dv6kpdk7n';
  const uploadPreset = 'unsigned_preset';

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

// Form Submission
const requestForm = document.getElementById("requestForm");

requestForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = requestForm.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting..."; // Optional: give feedback
  }

  if (!user) {
    alert("⚠️ You must be logged in to submit a request.");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
    return;
  }

  const formData = new FormData(requestForm);
  const requestType =
    document.getElementById("documentTypeDropdown")?.value ||
    document.getElementById("modalTitle").textContent.toLowerCase().replace(/\s/g, '-');

  const data = {
    requestType,
    status: "pending",
    createdAt: serverTimestamp(),
    userId: user.uid
  };

  // Add custom fields based on document type
  if (requestType === "barangay-clearance") {
    data.purpose = formData.get("purpose");
  } else if (requestType === "certificate-of-indigency") {
    data.reason = formData.get("reason");
  } else if (requestType === "certificate-of-good-moral") {
    data.institution = formData.get("institution");
  } else if (requestType === "barangay-permit") {
    data.businessName = formData.get("businessName");
    data.businessAddress = formData.get("businessAddress");
  }

  // Upload files
  const fileFields = ["fileUpload", "dtiRegistration", "leaseContract", "proof", "ctc"];
  for (let field of fileFields) {
    const input = requestForm.querySelector(`input[name="${field}"]`);
    if (input && input.files.length > 0) {
      if (input.multiple) {
        const urls = [];
        for (let file of input.files) {
          const url = await uploadFileToCloudinary(file);
          if (url) urls.push(url);
        }
        data[`${field}Urls`] = urls;
      } else {
        const url = await uploadFileToCloudinary(input.files[0]);
        if (url) {
          data[`${field}Url`] = url;
        }
      }
    }
  }

  // Upload valid ID
 const validIdInput = document.getElementById("validId");
const validIdBackInput = document.getElementById("validIdBack");

if (
  validIdInput && validIdInput.files.length > 0 &&
  validIdBackInput && validIdBackInput.files.length > 0
) {
  const frontFile = validIdInput.files[0];
  const backFile = validIdBackInput.files[0];

  const validIdFrontUrl = await uploadFileToCloudinary(frontFile);
  const validIdBackUrl = await uploadFileToCloudinary(backFile);

  if (validIdFrontUrl && validIdBackUrl) {
    data.validIdFrontUrl = validIdFrontUrl;
    data.validIdBackUrl = validIdBackUrl;
  } else {
    alert("❌ Failed to upload one or both sides of the Valid ID.");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
    return;
  }
} else {
  alert("⚠️ Please upload both front and back of the Valid ID.");
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
  return;
}


  try {
    await addDoc(collection(db, "documentRequests"), data);
    alert("✅ Request submitted successfully!");
    requestForm.reset();
    document.getElementById("additionalFields").innerHTML = "";
    modal.style.display = "none";
  } catch (error) {
    console.error("❌ Error submitting request: ", error);
    alert("❌ Failed to submit request.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  }
});



// Responsive Navbar
const toggleBtn = document.getElementById('navbarToggle');
const navbarLinks = document.querySelector('.navbar-links');
toggleBtn?.addEventListener('click', () => {
  navbarLinks?.classList.toggle('show');
});

// Fetch User Requests
async function fetchUserRequests(userId) {
  const container = document.getElementById('myRequestsContainer');
  if (!container) return;

  container.innerHTML = "<p>Loading your requests...</p>";

  try {
    const q = query(collection(db, "documentRequests"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = "<p>You have no document requests yet.</p>";
      return;
    }

    const list = document.createElement("ul");
    list.style.listStyle = "none";
    list.style.padding = "0";

querySnapshot.forEach((doc) => {
  const data = doc.data();
  const listItem = document.createElement("li");
  listItem.style.border = "1px solid #ccc";
  listItem.style.borderRadius = "8px";
  listItem.style.padding = "1rem";
  listItem.style.marginBottom = "1rem";


  
  // Helper to generate file links
  const generateLinks = (label, urls) => {
    if (!urls || urls.length === 0) return "";
    const isArray = Array.isArray(urls);
    if (isArray && urls.length === 0) return "";
    if (!isArray) urls = [urls];

    return `
      <strong>${label}:</strong><br>
      <ul style="padding-left: 1rem;">
        ${urls.map(url => `<li><a href="${url}" target="_blank" style="color: blue;">View File</a></li>`).join("")}
      </ul>`;
  };

  listItem.innerHTML = `
    <strong>Document Type:</strong> ${data.requestType.replace(/-/g, ' ').toUpperCase()}<br>
    <strong>Status:</strong> ${data.status}<br>
    <strong>Date:</strong> ${data.createdAt?.toDate().toLocaleString() || 'Pending'}<br>
    ${data.message ? `<strong>Message:</strong> ${data.message}<br>` : ""}
    ${generateLinks("Valid ID", data.validIdUrl)}
    ${generateLinks("Proof of Residency", data.proofUrls || data.proofUrl)}
    ${generateLinks("Community Tax Certificate (Cedula)", data.ctcUrl)}
    ${generateLinks("DTI Registration", data.dtiRegistrationUrl)}
    ${generateLinks("Lease Contract / Business Proof", data.leaseContractUrl)}
    ${generateLinks("Other Uploaded Files", data.fileUploadUrls || data.fileUploadUrl)}
  `;

  list.appendChild(listItem);
});


    container.innerHTML = "";
    container.appendChild(list);
  } catch (error) {
    console.error("Error fetching requests: ", error);
    container.innerHTML = "<p>Failed to load your requests.</p>";
  }




}

// Open Requests Modal
document.getElementById('openRequestsModalBtn')?.addEventListener('click', () => {
  document.getElementById('myRequestsModal').style.display = 'block';
  if (user) {
    fetchUserRequests(user.uid);
  }
});

// Close Requests Modal
document.getElementById('closeRequestsModal')?.addEventListener('click', () => {
  document.getElementById('myRequestsModal').style.display = 'none';
});

window.addEventListener('click', (e) => {
  const modal = document.getElementById('myRequestsModal');
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});


