import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "login.html";

  const q = query(collection(db, "users"), where("role", "==", "normal"));
  const snapshot = await getDocs(q);

  let male = 0, female = 0;
  let singleParents = 0, nonSingleParents = 0;
  let voters = 0, nonVoters = 0;
  let pwd = 0, nonPwd = 0;
  let archived = 0, totalUsers = 0;

  snapshot.forEach(doc => {
    const data = doc.data();

    if (data.archived === true) {
      archived++;
      return;
    }

    totalUsers++;

    const gender = data.gender?.toLowerCase();
    if (gender === "male") male++;
    else if (gender === "female") female++;

    if (data.singleParent?.toLowerCase() === "yes") singleParents++;
    else nonSingleParents++;

    if (data.voters?.toLowerCase() === "yes") voters++;
    else nonVoters++;

    if (data.pwd?.toLowerCase() === "yes") pwd++;
    else nonPwd++;
  });

  const requestsSnapshot = await getDocs(collection(db, "documentRequests"));
  const totalRequests = requestsSnapshot.size;

  // Fetch complaints
  const complaintsSnapshot = await getDocs(collection(db, "complaints"));
  const totalComplaints = complaintsSnapshot.size;

  // Update counts
  document.getElementById("totalUsers").innerText = totalUsers;
  document.getElementById("totalMale").innerText = male;
  document.getElementById("totalFemale").innerText = female;
  document.getElementById("totalSingleParents").innerText = singleParents;
  document.getElementById("totalVoters").innerText = voters;
  document.getElementById("totalPWD").innerText = pwd;
  document.getElementById("totalArchived").innerText = archived;
   document.getElementById("totalRequests").innerText = totalRequests;
  document.getElementById("totalComplaints").innerText = totalComplaints;

  // Pie Chart Renderer
  const renderPie = (id, labels, data, colors, title) => {
    new Chart(document.getElementById(id), {
      type: "pie",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom"
          },
          title: {
            display: true,
            text: title
          }
        }
      }
    });
  };

  renderPie("genderPieChart", ["Male", "Female"], [male, female], ["#4dabf7", "#f783ac"], "Gender Distribution");
  renderPie("voterPieChart", ["Voters", "Non-Voters"], [voters, nonVoters], ["#51cf66", "#ced4da"], "Voter Status");
  renderPie("pwdPieChart", ["PWD", "Non-PWD"], [pwd, nonPwd], ["#845ef7", "#dee2e6"], "PWD Status");
  renderPie("singleParentPieChart", ["Single Parents", "Others"], [singleParents, nonSingleParents], ["#ffa94d", "#e9ecef"], "Single Parent Status");
});


async function loadBarangayMembers() {
  const captainGrid = document.getElementById('captainGrid');
  const kagawadGrid = document.getElementById('kagawadGrid');
  const othersGrid = document.getElementById('othersGrid'); // secretary + treasurer
  const skChairmanGrid = document.getElementById('skChairmanGrid');
  const skKagawadGrid = document.getElementById('skKagawadGrid');
  const skSecretaryGrid = document.getElementById('skSecretaryGrid');
  const skTreasurerGrid = document.getElementById('skTreasurerGrid');

  captainGrid.innerHTML = kagawadGrid.innerHTML = othersGrid.innerHTML =
    skChairmanGrid.innerHTML = skKagawadGrid.innerHTML =
    skSecretaryGrid.innerHTML = skTreasurerGrid.innerHTML = "Loading...";

  try {
    const membersQuery = query(collection(db, "barangayMembers"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(membersQuery);

    captainGrid.innerHTML = kagawadGrid.innerHTML = othersGrid.innerHTML =
      skChairmanGrid.innerHTML = skKagawadGrid.innerHTML =
      skSecretaryGrid.innerHTML = skTreasurerGrid.innerHTML = "";

    if (snapshot.empty) {
      captainGrid.innerHTML = "<p>No barangay captain found.</p>";
      kagawadGrid.innerHTML = "<p>No kagawad found.</p>";
      othersGrid.innerHTML = "<p>No secretary or treasurer found.</p>";
      skChairmanGrid.innerHTML = "<p>No SK chairman found.</p>";
      skKagawadGrid.innerHTML = "<p>No SK kagawads found.</p>";
      skSecretaryGrid.innerHTML = "<p>No SK secretary found.</p>";
      skTreasurerGrid.innerHTML = "<p>No SK treasurer found.</p>";
      return;
    }

    snapshot.forEach(doc => {
      const member = doc.data();
      const photo = member.photoURL || "/img/default-profile.png";
      const position = member.position?.toLowerCase() || "";

      const card = document.createElement("div");
      card.classList.add("barangay-member-card");
      card.innerHTML = `
        <img src="${photo}" alt="${member.name}" class="barangay-member-photo" />
        <div>${member.name}</div>
        <div style="color:#329e26; font-weight:bold;">${member.position}</div>
      `;

      switch (position) {
        case "barangay captain":
          captainGrid.appendChild(card);
          break;
        case "kagawad":
          kagawadGrid.appendChild(card);
          break;
        case "secretary":
        case "treasurer":
          othersGrid.appendChild(card);
          break;
        case "sk chairman":
        case "sk chairperson":
          skChairmanGrid.appendChild(card);
          break;
        case "sk kagawad":
        case "sk councilor":
          skKagawadGrid.appendChild(card);
          break;
        case "sk secretary":
          skSecretaryGrid.appendChild(card);
          break;
        case "sk treasurer":
          skTreasurerGrid.appendChild(card);
          break;
      }
    });
  } catch (error) {
    console.error("Error loading barangay members:", error);
    captainGrid.innerHTML = "<p>Error loading barangay captain.</p>";
    kagawadGrid.innerHTML = "<p>Error loading kagawad.</p>";
    othersGrid.innerHTML = "<p>Error loading secretary and treasurer.</p>";
    skChairmanGrid.innerHTML = "<p>Error loading SK chairman.</p>";
    skKagawadGrid.innerHTML = "<p>Error loading SK kagawads.</p>";
    skSecretaryGrid.innerHTML = "<p>Error loading SK secretary.</p>";
    skTreasurerGrid.innerHTML = "<p>Error loading SK treasurer.</p>";
  } finally {
    document.getElementById('pageContent').style.display = 'block';
    document.getElementById('loadingScreen').style.display = 'none';
  }
}

loadBarangayMembers();
