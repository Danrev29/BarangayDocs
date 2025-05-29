// --- Firebase Initialization ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, query, where, getDocs, onSnapshot, doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCDUhreZ5WL2E6PEV_dn8I1oW68HLQyy88",
  authDomain: "barangaydocs-a4533.firebaseapp.com",
  projectId: "barangaydocs-a4533",
  storageBucket: "barangaydocs-a4533.appspot.com",
  messagingSenderId: "19682468687",
  appId: "1:19682468687:web:373002e9e37df2120f1b3a",
  measurementId: "G-CC1ZGLF3W5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- DOM Elements ---
const residentsBody = document.getElementById("residentsBody");
const modal = document.getElementById("residentInfoModal");
const closeModal = document.getElementById("residentCloseModal");
const archivedModal = document.getElementById("archivedModal");
const archivedBody = document.getElementById("archivedBody");

let currentViewedUID = null;

// --- Image Upload via Cloudinary ---
document.getElementById("changePhotoBtn").onclick = () => {
  document.getElementById("uploadInput").click();
};

document.getElementById("uploadInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file || !currentViewedUID) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "unsigned_preset");

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/dv6kpdk7n/image/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    const imageUrl = data.secure_url;

    await updateDoc(doc(db, "users", currentViewedUID), {
      photoURL: imageUrl,
    });

    document.getElementById("profileImage").src = imageUrl;
    alert("Profile photo updated!");
  } catch (err) {
    console.error("Upload failed", err);
    alert("Failed to upload photo.");
  }
});

// --- Modal Logic ---
closeModal.onclick = () => modal.style.display = "none";
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
  if (e.target === archivedModal) archivedModal.style.display = "none";
};

document.getElementById("openArchivedModal").onclick = () => {
  archivedModal.style.display = "flex";
  loadArchivedResidents();
};

document.getElementById("closeArchivedModal").onclick = () => {
  archivedModal.style.display = "none";
};

// --- Auth & Access Check ---
onAuthStateChanged(auth, async (user) => {
  if (!user) return redirectToLogin();
  const docSnap = await getDoc(doc(db, "users", user.uid));
  if (!docSnap.exists() || docSnap.data().role !== "admin") return redirectToUnauthorized();
  loadResidents();
});

function redirectToLogin() {
  alert("You must be logged in.");
  window.location.href = "login.html";
}

function redirectToUnauthorized() {
  alert("Access denied. Admins only.");
  window.location.href = "unauthorized.html";
}

// --- Load Residents ---
function loadResidents() {
  const q = query(collection(db, "users"), where("role", "==", "normal"), where("archived", "!=", true));
  onSnapshot(q, (snapshot) => {
    residentsBody.innerHTML = "";
    let count = 1;
    snapshot.forEach((docSnap) => {
      const user = docSnap.data();
      const nameParts = [user.firstName, user.middleName, user.lastName].filter(
        part => part && part.toString().trim().toLowerCase() !== "none"
      );
      const cleanedName = nameParts.join(" ");
     const photoUrl = user.photoURL && user.photoURL.trim() !== "" 
  ? user.photoURL 
  : "/img/profile.png";

residentsBody.innerHTML += `
  <tr>
    <td>${count++}</td>
    <td><img src="${photoUrl}" alt="Profile Photo" class="resident-photo" onerror="this.onerror=null;this.src='/img/profile.png';"></td>
    <td>${cleanedName}</td>
    <td>${user.email}</td>
    <td>${user.contactNumber || "-"}</td>
    <td>
      <button class="viewBtn" data-uid="${docSnap.id}">View Info</button>
      <button class="archiveBtn" data-uid="${docSnap.id}">Archive</button>
    </td>
  </tr>`;

    });
    addResidentActionHandlers();
  });
}

function addResidentActionHandlers() {
  document.querySelectorAll(".viewBtn").forEach(btn => {
    btn.onclick = () => showUserDetails(btn.dataset.uid);
  });
  document.querySelectorAll(".archiveBtn").forEach(btn => {
    btn.onclick = () => archiveResident(btn.dataset.uid);
  });
}

// --- Archived Residents ---
function loadArchivedResidents() {
  const q = query(collection(db, "users"), where("role", "==", "normal"), where("archived", "==", true));
  onSnapshot(q, (snapshot) => {
    archivedBody.innerHTML = "";
    let count = 1;
    snapshot.forEach((docSnap) => {
      const user = docSnap.data();
      archivedBody.innerHTML += `
        <tr>
          <td>${count++}</td>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.contactNumber || "-"}</td>
          <td><button class="unarchiveBtn" data-uid="${docSnap.id}">Unarchive</button></td>
        </tr>`;
    });
    document.querySelectorAll(".unarchiveBtn").forEach(btn => {
      btn.onclick = () => unarchiveResident(btn.dataset.uid);
    });
  });
}

// --- Search ---
document.getElementById("searchInput").addEventListener("input", function () {
  const filter = this.value.toLowerCase();
  const rows = residentsBody.getElementsByTagName("tr");
  for (let row of rows) {
    const name = row.cells[1]?.textContent.toLowerCase() || "";
    const email = row.cells[2]?.textContent.toLowerCase() || "";
    row.style.display = (name.includes(filter) || email.includes(filter)) ? "" : "none";
  }
});

// --- Archive / Unarchive Actions ---
async function archiveResident(uid) {
  if (confirm("Are you sure you want to archive this resident?")) {
    await updateDoc(doc(db, "users", uid), { archived: true });
    alert("Resident archived.");
  }
}

async function unarchiveResident(uid) {
  if (confirm("Unarchive this resident?")) {
    await updateDoc(doc(db, "users", uid), { archived: false });
    alert("Resident unarchived.");
  }
}

// --- Show Resident Info Modal ---
async function showUserDetails(uid) {
  currentViewedUID = uid;
  const userSnap = await getDoc(doc(db, "users", uid));
  if (!userSnap.exists()) return alert("Resident not found.");
  const user = userSnap.data();

  const setText = (id, val) => {
    const cleaned = (val || "").toString().trim().toLowerCase();
    document.getElementById(id).innerText = (!cleaned || cleaned === "none") ? "" : val;
  };

  setText("resName", user.name);
  setText("resEmail", user.email);
  setText("resPhone", user.contactNumber);
  setText("resGender", user.gender);
  setText("resDOB", user.dob);
  setText("resPOB", user.placeOfBirth);
  setText("resVoter", user.voters);
  setText("resPWD", user.pwd);
  setText("resSingleParent", user.singleParent);
  setText("resCivilStatus", user.civilStatus);
  setText("resReligion", user.religion);
  setText("resNationality", user.nationality);
  setText("resHouseNo", user.address?.houseNumber);
  setText("resStreet", user.address?.streetAddress);
  setText("resBarangay", user.address?.barangay);
  setText("resMunicipality", user.address?.municipality);
  setText("resZip", user.address?.zipCode);
  setText("resFather", user.fatherName);
  setText("resMother", user.motherName);

  // --- Profile Image ---
  const profileImage = document.getElementById("profileImage");
  if (user.photoURL && user.photoURL.trim() !== "") {
    profileImage.src = user.photoURL;
  } else {
    profileImage.src = "/img/profile.png"; // fallback image
  }
  profileImage.onerror = () => {
    profileImage.src = "/img/profile.png";
  };

  // --- Document Requests ---
  const docRequestsSnap = await getDocs(query(collection(db, "documentRequests"), where("userId", "==", uid)));
  const docTable = document.getElementById("docRequests");
  docTable.innerHTML = `<tr><th>Type</th><th>Status</th><th>Date</th></tr>`;
  let docCount = 0;
  docRequestsSnap.forEach(doc => {
    const data = doc.data();
    docTable.innerHTML += `
      <tr>
        <td>${data.requestType || "N/A"}</td>
        <td>${data.status || "Pending"}</td>
        <td>${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}</td>
      </tr>`;
    docCount++;
  });

  // --- Complaints ---
  const complaintsSnap = await getDocs(query(collection(db, "complaints"), where("userId", "==", uid)));
  const compTable = document.getElementById("complaints");
  compTable.innerHTML = `<tr><th>Message</th><th>Status</th><th>Date</th></tr>`;
  let compCount = 0;
  complaintsSnap.forEach(doc => {
    const data = doc.data();
    compTable.innerHTML += `
      <tr>
        <td>${data.message || "N/A"}</td>
        <td>${data.status || "Pending"}</td>
        <td>${data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString() : "N/A"}</td>
      </tr>`;
    compCount++;
  });

  document.getElementById("docRequestsHeader").innerText = `Documents Requested (${docCount}) ▼`;
  document.getElementById("complaintsHeader").innerText = `Complaints Submitted (${compCount}) ▼`;

  initCollapsibles();
  modal.style.display = "block";
}


// --- Collapsibles ---
function initCollapsibles() {
  document.querySelectorAll('.collapsible').forEach(header => {
    header.onclick = () => {
      const content = header.nextElementSibling;
      const isOpen = content.style.display === "block";
      content.style.display = isOpen ? "none" : "block";
      header.textContent = header.textContent.replace(isOpen ? "▲" : "▼", isOpen ? "▼" : "▲");
    };
  });
}

// --- Editable Fields Logic ---
const editableFields = [
  "resName", "resPhone", "resGender", "resDOB", "resPOB", "resVoter",
  "resPWD", "resSingleParent", "resCivilStatus", "resReligion", "resNationality",
  "resHouseNo", "resStreet", "resBarangay", "resMunicipality", "resZip",
  "resFather", "resMother"
];

document.getElementById("editResidentBtn").onclick = () => {
  editableFields.forEach(id => {
    const el = document.getElementById(id);
    el.setAttribute("contenteditable", "true");
    el.classList.add("editable");
  });
  document.getElementById("saveResidentBtn").style.display = "inline-block";
};

document.getElementById("saveResidentBtn").onclick = async () => {
  if (!currentViewedUID) return alert("No resident selected.");
  const updatedData = {
    name: document.getElementById("resName").innerText,
    contactNumber: document.getElementById("resPhone").innerText,
    gender: document.getElementById("resGender").innerText,
    dob: document.getElementById("resDOB").innerText,
    placeOfBirth: document.getElementById("resPOB").innerText,
    voters: document.getElementById("resVoter").innerText,
    pwd: document.getElementById("resPWD").innerText,
    singleParent: document.getElementById("resSingleParent").innerText,
    civilStatus: document.getElementById("resCivilStatus").innerText,
    religion: document.getElementById("resReligion").innerText,
    nationality: document.getElementById("resNationality").innerText,
    fatherName: document.getElementById("resFather").innerText,
    motherName: document.getElementById("resMother").innerText,
    address: {
      houseNumber: document.getElementById("resHouseNo").innerText,
      streetAddress: document.getElementById("resStreet").innerText,
      barangay: document.getElementById("resBarangay").innerText,
      municipality: document.getElementById("resMunicipality").innerText,
      zipCode: document.getElementById("resZip").innerText,
    }
  };

  try {
    await updateDoc(doc(db, "users", currentViewedUID), updatedData);
    alert("Resident info updated.");
    editableFields.forEach(id => {
      const el = document.getElementById(id);
      el.setAttribute("contenteditable", "false");
      el.classList.remove("editable");
    });
    document.getElementById("saveResidentBtn").style.display = "none";
  } catch (e) {
    console.error("Update failed", e);
    alert("Failed to save changes.");
  }
};
