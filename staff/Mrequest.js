import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import {
  getFirestore, collection, getDocs, doc, updateDoc, addDoc, getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';

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
    document.getElementById('page-content').style.display = 'block';
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
    emptyMsg.style.display = "none";

    if (querySnapshot.empty) {
      emptyMsg.style.display = "block";
      requestsTable.style.display = "none";
      rejectedTable.style.display = "none";
      approvedTable.style.display = "none";
      return;
    }

    let approvedIndex = 1;
    let rejectedIndex = 1;
    let pendingRows = [];
    let hasApproved = false;
    let hasRejected = false;
    let hasPending = false;

    // Sort docs by createdAt descending
    const sortedDocs = querySnapshot.docs
      .filter(doc => doc.data().createdAt)
      .sort((a, b) => b.data().createdAt.toDate() - a.data().createdAt.toDate());

    // Prepare rows
    const rowPromises = sortedDocs.map(async (docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      let userName = "";
      let profilePhotoURL = "img/placeholder.png";

      if (data.userId) {
        try {
          const userDocRef = doc(db, "users", data.userId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            userName = userData.name || "";
            if (userData.photoURL) {
              profilePhotoURL = userData.photoURL;
            }
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      }

      const tr = document.createElement("tr");
      const timestamp = data.createdAt?.toDate();
      const requestDate = timestamp
        ? `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : "N/A";

      const statusClass = data.status === 'Approved' ? 'status-approved' :
                          data.status === 'Rejected' ? 'status-rejected' : 'status-processing';

      let actionsHTML = "";
      if (data.status !== "Rejected" && data.status !== "Approved") {
        actionsHTML = `
          <button class="approveBtn" data-id="${id}">Approve</button>
          <button class="rejectBtn" data-id="${id}">Reject</button>
        `;
      }

      tr.innerHTML = `
        <td data-label="No.">-</td>
        <td data-label="Name">
          <img src="${profilePhotoURL}" alt="Profile" class="profile-pic-inline" style="width:40px; height:40px; border-radius:50%; object-fit:cover;" />
          ${userName}
        </td>
        <td data-label="Document">${formatDocumentType(data.requestType)}</td>
        <td data-label="Request Date">${requestDate}</td>
        <td data-label="Status">
          <span class="status-badge ${statusClass}">${data.status || "Processing"}</span>
        </td>
        <td data-label="Info">
          <button class="viewBtn" data-id="${id}">View</button>
        </td>
        <td data-label="Actions">${actionsHTML}</td>
      `;

      tr.setAttribute("data-userid", data.userId || "");
      tr.setAttribute("data-id", id);

      return { tr, status: data.status, id };
    });

    const rowsData = await Promise.all(rowPromises);

    rowsData.forEach(({ tr, status }) => {
      if (status === "Rejected") {
        tr.querySelector("td:first-child").textContent = rejectedIndex++;
        rejectedTbody.appendChild(tr);
        hasRejected = true;
      } else if (status === "Approved") {
        tr.querySelector("td:first-child").textContent = approvedIndex++;
        approvedTbody.appendChild(tr);
        hasApproved = true;
      } else {
        pendingRows.push(tr);
        hasPending = true;
      }
    });

    // Append pending rows in newest first order, renumber them
    pendingRows.reverse().forEach((tr, index) => {
      tr.querySelector("td:first-child").textContent = index + 1;
      requestsTbody.appendChild(tr);
    });

    // Toggle table visibility
    requestsTable.style.display = hasPending ? "table" : "none";
    rejectedTable.style.display = hasRejected ? "table" : "none";
    approvedTable.style.display = hasApproved ? "table" : "none";

    if (!hasPending && !hasRejected && !hasApproved) {
      emptyMsg.style.display = "block";
    }

    // Event binding
    attachViewListeners();
    attachActionListeners();
    attachUserPhotoClickListeners();

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
        const requestDoc = await getDoc(doc(db, "documentRequests", id));
        if (requestDoc.exists()) {
          showDetailsModal(requestDoc.data());
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
        const requestDoc = await getDoc(doc(db, "documentRequests", id));
        if (!requestDoc.exists()) throw new Error("Request not found");
        const data = requestDoc.data();

        await updateDoc(doc(db, "documentRequests", id), { status: "Approved" });

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
          to_email: userData.email,
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
        const requestDoc = await getDoc(doc(db, "documentRequests", id));
        if (!requestDoc.exists()) throw new Error("Request not found");
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
      message: `Good day, ${fullName || "Resident"}.<br>Your ${formatDocumentType(requestType)} document request was rejected.<br>Reason: ${reason}`,
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
  const approvedTbody = document.querySelector("#approvedRequestsTable tbody");
  const requestsTbody = document.querySelector("#requestsTable tbody"); // pending table
  const row = document.querySelector(`[data-id="${requestId}"]`);
  if (!row) return;
  const tr = row.closest('tr');

  // Remove from pending tbody if it exists there
  if (requestsTbody.contains(tr)) {
    requestsTbody.removeChild(tr);
  }

  tr.querySelector("td:nth-child(5)").innerHTML = `<span class="status-badge status-approved">Approved</span>`;
  tr.querySelector("td:last-child").innerHTML = "";
  approvedTbody.appendChild(tr);

  renumberTableRows(approvedTbody);
  renumberTableRows(requestsTbody);

  // Hide pending table if empty
  const requestsTable = document.getElementById("requestsTable");
  requestsTable.style.display = requestsTbody.children.length > 0 ? "table" : "none";
}


function moveToRejectedTable(requestId) {
  const rejectedTbody = document.querySelector("#rejectedRequestsTable tbody");
  const requestsTbody = document.querySelector("#requestsTable tbody"); // pending
  const requestsTable = document.getElementById("requestsTable");
  const rejectedTable = document.getElementById("rejectedRequestsTable");

  const row = document.querySelector(`[data-id="${requestId}"]`);
  if (!row) return;
  const tr = row.closest('tr');

  // Remove from pending table if present
  if (requestsTbody.contains(tr)) {
    requestsTbody.removeChild(tr);
  }

  // Update status badge and remove actions buttons
  tr.querySelector("td:nth-child(5)").innerHTML = `<span class="status-badge status-rejected">Rejected</span>`;
  tr.querySelector("td:last-child").innerHTML = "";

  // Append to rejected table
  rejectedTbody.appendChild(tr);

  // Renumber rows
  renumberTableRows(rejectedTbody);
  renumberTableRows(requestsTbody);

  // Show/hide tables based on content
  requestsTable.style.display = requestsTbody.children.length > 0 ? "table" : "none";
  rejectedTable.style.display = rejectedTbody.children.length > 0 ? "table" : "none";
}

function renumberTableRows(tbody) {
  Array.from(tbody.children).forEach((tr, i) => {
    tr.querySelector("td:first-child").textContent = i + 1;
  });
}

function attachUserPhotoClickListeners() {
  document.querySelectorAll(".user-photo-clickable").forEach(img => {
    img.addEventListener("click", async (e) => {
      const userId = e.target.getAttribute("data-userid");
      if (!userId) return;

      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          showUserProfileModal(userData);
        } else {
          alert("User data not found.");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        alert("Failed to load user profile.");
      }
    });
  });
}

function showDetailsModal(data) {
  const modal = document.getElementById('detailsModal');
  const modalBody = document.getElementById('modalBody');

  let html = `
  `;

  if (data.requestType === 'barangay-permit') {
    html += `
      <p><strong>Business Name:</strong> ${data.businessName || 'N/A'}</p>
      <p><strong>Business Address:</strong> ${data.businessAddress || 'N/A'}</p>
      <p><strong>DTI Registration:</strong> 
        ${data.dtiRegistrationUrl ? `<a href="${data.dtiRegistrationUrl}" target="_blank">View DTI</a>` : 'N/A'}
      </p>
      <p><strong>Lease Contract:</strong> 
        ${data.leaseContractUrl ? `<a href="${data.leaseContractUrl}" target="_blank">View Lease</a>` : 'N/A'}
      </p>
      <p><strong>Valid ID:</strong> 
        ${data.validIdUrl ? `<a href="${data.validIdUrl}" target="_blank">View ID</a>` : 'N/A'}
      </p>
    `;
  } else if (data.requestType === 'certificate-of-residency') {
    html += `
      <p><strong>Valid ID:</strong> 
        ${data.validIdUrl ? `<a href="${data.validIdUrl}" target="_blank">View ID</a>` : 'N/A'}
      </p>
       <p><strong>Proof of Residency</strong> 
        ${data.proofUrl ? `<a href="${data.proofUrl}" target="_blank">View ID</a>` : 'N/A'}
      </p>
    `;

  
  }else if (data.requestType === 'barangay-clearance') {
    html += `
      <p><strong>Valid ID:</strong> 
        ${data.validIdUrl ? `<a href="${data.validIdUrl}" target="_blank">View ID</a>` : 'N/A'}
      </p>
      <p><strong>Community Tax Certificate:</strong> 
        ${data.ctcUrl ? `<a href="${data.ctcUrl}" target="_blank">View</a>` : 'N/A'}
      </p>
       <p><strong>Proof of Residency</strong> 
        ${data.proofUrl ? `<a href="${data.proofUrl}" target="_blank">View ID</a>` : 'N/A'}
      </p>
    `;

   
  } else if (data.requestType === 'certificate-of-indigency') {
    html += `
     <p><strong>Purpose:</strong> ${data.reason || 'N/A'}</p>
      <p><strong>Valid ID:</strong> 
        ${data.validIdUrl ? `<a href="${data.validIdUrl}" target="_blank">View ID</a>` : 'N/A'}
      </p>
    `;
  } else if (data.requestType === 'barangay-certificate') {
    html += `
      <p><strong>Valid ID:</strong> 
        ${data.validIdUrl ? `<a href="${data.validIdUrl}" target="_blank">View ID</a>` : 'N/A'}
      </p>
      <p><strong>Proof of Residency:</strong> 
        ${data.validIdUrl ? `<a href="${data.validIdUrl}" target="_blank">View Proof</a>` : 'N/A'}
      </p>
    `;
  }

  modalBody.innerHTML = html;
  modal.style.display = 'block';

  // Close modal setup
  document.getElementById('closeModalBtn').onclick = () => modal.style.display = 'none';
  window.onclick = (event) => {
    if (event.target === modal) modal.style.display = 'none';
  };
}
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => (tc.style.display = 'none'));
    
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).style.display = 'block';
  });
});

// Run on page load
fetchRequests();
