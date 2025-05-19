import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import {
  getFirestore, collection, getDocs, doc, updateDoc, addDoc, getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged,  } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';

emailjs.init("O2dvKPhnqFENt2voB");  // Replace with your EmailJS public key

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

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    document.getElementById('pageContent').style.display = 'block';
  }
});

async function fetchRequests() {
  const loadingMsg = document.getElementById("loadingMsg");
  const requestsTable = document.getElementById("requestsTable");
  const requestsTbody = requestsTable.querySelector("tbody");
  const rejectedTable = document.getElementById("rejectedRequestsTable");
  const rejectedTbody = rejectedTable.querySelector("tbody");
  const approvedTable = document.getElementById("approvedRequestsTable");
  const approvedTbody = approvedTable.querySelector("tbody");
  const emptyMsg = document.getElementById("emptyMsg");

  try {
    const querySnapshot = await getDocs(collection(db, "documentRequests"));
    loadingMsg.style.display = "none";
    requestsTbody.innerHTML = "";
    rejectedTbody.innerHTML = "";
    approvedTbody.innerHTML = "";

    if (querySnapshot.empty) {
      emptyMsg.style.display = "block";
      requestsTable.style.display = "none";
      rejectedTable.style.display = "none";
      approvedTable.style.display = "none";
    } else {
      requestsTable.style.display = "table";
      rejectedTable.style.display = "table";
      approvedTable.style.display = "table";

      let pendingIndex = 1;
let approvedIndex = 1;
let rejectedIndex = 1;

querySnapshot.forEach((docSnap) => {
  const data = docSnap.data();
  const tr = document.createElement("tr");
  const id = docSnap.id;

  const timestamp = data.createdAt?.toDate();
  const requestDate = timestamp 
    ? `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
    : "N/A";
  

  const statusClass = data.status === 'Approved' ? 'status-approved' :
                      data.status === 'Rejected' ? 'status-rejected' :
                      'status-processing';

  let actionsHTML = "";
  if (data.status !== "Rejected" && data.status !== "Approved") {
    actionsHTML = `
      <button class="approveBtn" data-id="${id}">Approve</button>
      <button class="rejectBtn" data-id="${id}">Reject</button>
    `;
  }

  let index = 0;
  if (data.status === "Rejected") {
    index = rejectedIndex++;
  } else if (data.status === "Approved") {
    index = approvedIndex++;
  } else {
    index = pendingIndex++;
  }

  tr.innerHTML = `
  <td data-label="No.">${index}</td>
  <td data-label="Name">${data.fullName || ""}</td>
  <td data-label="Document">${formatDocumentType(data.requestType)}</td>
  <td data-label="Contact">${data.contactNumber || ""}</td>
  <td data-label="Date of Birth">${data.birthDate || ""}</td>
  <td data-label="Request Date">${requestDate}</td>
  <td data-label="Status">
    <span class="status-badge ${statusClass}">${data.status || "Processing"}</span>
  </td>
  <td data-label="Full Info">
    <button class="viewBtn" data-id="${id}">View</button>
  </td>
  <td data-label="Actions">${actionsHTML}</td>
`;

  if (data.status === "Rejected") {
    rejectedTbody.appendChild(tr);
  } else if (data.status === "Approved") {
    approvedTbody.appendChild(tr);
  } else {
    requestsTbody.appendChild(tr);
  }
});

      attachViewListeners();
      attachActionListeners();
    }
  } catch (error) {
    console.error("Error fetching requests: ", error);
    loadingMsg.textContent = "Failed to load document requests.";
  }
}

function formatDocumentType(type) {
  return type.replace(/-/g, ' ').toUpperCase();
}

function attachViewListeners() {
  document.querySelectorAll(".viewBtn").forEach(button => {
    button.addEventListener("click", async (e) => {
      const id = e.target.getAttribute("data-id");

      try {
        const querySnapshot = await getDocs(collection(db, "documentRequests"));
        const docData = querySnapshot.docs.find(doc => doc.id === id)?.data();

        if (docData) {
          showDetailsModal(docData);
        } else {
          alert("Request not found!");
        }
      } catch (error) {
        console.error("Error fetching request:", error);
        alert("Error loading details.");
      }
    });
  });
}

function attachActionListeners() {
  document.querySelectorAll(".approveBtn").forEach(button => {
    button.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;

      try {
        const requestRef = doc(db, "documentRequests", id);
        const requestSnap = await getDocs(collection(db, "documentRequests"));
        const requestDoc = requestSnap.docs.find(doc => doc.id === id);
        const data = requestDoc.data();

        await updateDoc(requestRef, { status: "Approved" });

        await addDoc(collection(db, "users", data.userId, "notifications"), {
          userId: data.userId,
          type: "request",
          title: "Document Approved",
          message: `Good day, ${data.fullName || "Resident"}.\n Your ${formatDocumentType(data.requestType)} document is ready for pickup.`,
          timestamp: new Date(),
          read: false
        });

        const userDoc = await getDoc(doc(db, "users", data.userId));
const userData = userDoc.data();

await emailjs.send("service_3scnxqg", "template_friangp", {
  to_name: data.fullName || "Resident",
  to_email: userData.email, // ✅ use email from users collection
  document_type: formatDocumentType(data.requestType)
});

        

        alert("Request Approved! Notification sent.");
        moveToApprovedTable(id);
      } catch (error) {
        console.error("Error approving request:", error);
        alert("Error approving request: " + error.message);
      }
    });
  });

  document.querySelectorAll(".rejectBtn").forEach(button => {
    button.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;

      try {
        const requestSnap = await getDocs(collection(db, "documentRequests"));
        const requestDoc = requestSnap.docs.find(doc => doc.id === id);
        const data = requestDoc.data();

        await rejectRequest(id, data.userId, data.fullName, data.requestType);
        moveToRejectedTable(id);
      } catch (error) {
        console.error("Error handling reject:", error);
        alert("Something went wrong while rejecting the request.");
      }
    });
  });
}


async function rejectRequest(docId, userId, fullName, requestType) {
  const reason = prompt("Please enter the reason for rejecting this request:");
  if (!reason || reason.trim() === "") {
    alert("You must provide a reason to reject the request.");
    return;
  }

  try {
    await updateDoc(doc(db, "documentRequests", docId), {
      status: "Rejected",
      rejectionReason: reason
    });

    await addDoc(collection(db, "users", userId, "notifications"), {
      userId,
      type: "request",
      title: "Document Rejected",
      message: `Good day, ${fullName || "Resident"}. 
      <br> 
      Your ${formatDocumentType(requestType)} document request was rejected.\n\nReason: ${reason}`,
      timestamp: new Date(),
      read: false
    });

    alert("Request rejected and notification sent.");
  } catch (error) {
    console.error("Error rejecting request:", error);
    alert("An error occurred while rejecting the request.");
  }
}

function moveToApprovedTable(requestId) {
  const row = document.querySelector(`[data-id="${requestId}"]`).closest('tr');
  row.querySelector("td:nth-child(7)").innerHTML = `<span class="status-badge status-approved">Approved</span>`;
  row.querySelector("td:last-child").innerHTML = "";
  document.querySelector("#approvedRequestsTable tbody").appendChild(row);
}

function moveToRejectedTable(requestId) {
  const row = document.querySelector(`[data-id="${requestId}"]`).closest('tr');
  row.querySelector("td:nth-child(7)").innerHTML = `<span class="status-badge status-rejected">Rejected</span>`;
  row.querySelector("td:last-child").innerHTML = "";
  document.querySelector("#rejectedRequestsTable tbody").appendChild(row);
}

function showDetailsModal(data) {
  const modal = document.getElementById("detailsModal");

  document.getElementById("modalRequestType").textContent = formatDocumentType(data.requestType);
  document.getElementById("modalFullName").textContent = data.fullName || "";
  document.getElementById("modalAddress").textContent = data.address || "";
  document.getElementById("modalContactNumber").textContent = data.contactNumber || "";
  document.getElementById("modalBirthDate").textContent = data.birthDate || "";
  document.getElementById("modalMessage").textContent = data.message || "";

  // Hide all conditionals
  const fields = [
    "modalPurposeWrapper", "modalBusinessNameWrapper", "modalBusinessAddressWrapper",
    "modalReasonWrapper", "modalAnnualIncomeWrapper", "modalInstitutionWrapper", "modalFileUrlWrapper"
  ];
  fields.forEach(id => document.getElementById(id).style.display = "none");

  if (data.requestType === "barangay-clearance" && data.purpose) {
    document.getElementById("modalPurpose").textContent = data.purpose;
    document.getElementById("modalPurposeWrapper").style.display = "block";
  } else if (data.requestType === "barangay-permit" && data.businessName) {
    document.getElementById("modalBusinessName").textContent = data.businessName;
    document.getElementById("modalBusinessAddress").textContent = data.businessAddress;
    document.getElementById("modalBusinessNameWrapper").style.display = "block";
    document.getElementById("modalBusinessAddressWrapper").style.display = "block";
  } else if (data.requestType === "certificate-of-indigency" && data.reason) {
    document.getElementById("modalReason").textContent = data.reason;
    document.getElementById("modalReasonWrapper").style.display = "block";
  } else if (data.requestType === "community-tax" && data.annualIncome) {
    document.getElementById("modalAnnualIncome").textContent = data.annualIncome;
    document.getElementById("modalAnnualIncomeWrapper").style.display = "block";
  } else if (data.requestType === "certificate-of-good-moral" && data.institution) {
    document.getElementById("modalInstitution").textContent = data.institution;
    document.getElementById("modalInstitutionWrapper").style.display = "block";
  }

  if (data.fileUrl) {
    document.getElementById("modalFileUrl").innerHTML = `<a href="${data.fileUrl}" target="_blank">View Uploaded ID</a>`;
    document.getElementById("modalFileUrlWrapper").style.display = "block";
  }

  modal.style.display = "block";
}

document.querySelector(".close-btn").addEventListener("click", () => {
  document.getElementById("detailsModal").style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === document.getElementById("detailsModal")) {
    document.getElementById("detailsModal").style.display = "none";
  }
});

fetchRequests();

document.querySelectorAll('.tab-btn').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(section => section.style.display = 'none');
    button.classList.add('active');
    const tabId = button.getAttribute('data-tab');
    document.getElementById(tabId).style.display = 'block';
  });
});
