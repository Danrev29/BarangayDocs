// ✅ Firebase SDKs from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCDUhreZ5WL2E6PEV_dn8I1oW68HLQyy88",
  authDomain: "barangaydocs-a4533.firebaseapp.com",
  projectId: "barangaydocs-a4533",
  storageBucket: "barangaydocs-a4533.appspot.com",
  messagingSenderId: "19682468687",
  appId: "1:19682468687:web:373002e9e37df2120f1b3a",
  measurementId: "G-CC1ZGLF3W5"
};

// ✅ Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ Wait for authentication before accessing Firestore
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("✅ User authenticated:", user.email);
    loadBarangayMembers();
  } else {
    console.error("❌ Not logged in. Cannot load barangay members.");
    document.getElementById('captainGrid').innerHTML = "<p>Please log in to view officials.</p>";
    // show page content anyway so user can see message
    document.getElementById('pageContent').style.display = 'block';
    document.getElementById('loadingScreen').style.display = 'none';
  }
});

window.logout = async function () {
  await signOut(auth);
  alert("Logged out successfully!");
  window.location.href = "login.html";
};




// ✅ Load function
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



window.logout = async function () {
  await signOut(auth);
  alert("Logged out successfully!");
  window.location.href = "login.html";
};