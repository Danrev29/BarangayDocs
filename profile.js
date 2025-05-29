import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-storage.js";

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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dv6kpdk7n/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'unsigned_preset';

const uploadPicBtn = document.getElementById("uploadPicBtn");
const profilePicInput = document.getElementById("profilePicInput");

uploadPicBtn.addEventListener("click", () => profilePicInput.click());

profilePicInput.addEventListener("change", async () => {
  const file = profilePicInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    const imageUrl = data.secure_url;

    // Save image URL to Firestore
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { photoURL: imageUrl }, { merge: true });

    // Show image
    document.getElementById("profilePicture").src = imageUrl;
    alert("Profile picture updated!");
  } catch (err) {
    console.error("Upload failed:", err);
    alert("Failed to upload image.");
  }
});


onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const data = docSnap.data();

    const fields = [
      "name", "email", "gender", "dob", "placeOfBirth", "voters", "pwd", "singleParent",
      "civilStatus", "religion", "nationality", "contactNumber", "fatherName", "motherName"
    ];

    fields.forEach(field => {
      const el = document.getElementById(field);
      if (el) el.value = data[field] || "";
    });

    const address = data.address || {};
    document.getElementById("houseNumber").value = address.houseNumber || "";
    document.getElementById("streetAddress").value = address.streetAddress || "";
    document.getElementById("barangay").value = address.barangay || "";
    document.getElementById("municipality").value = address.municipality || "";
    document.getElementById("zipCode").value = address.zipCode || "";

document.getElementById("profilePicture").src = data.photoURL || "img/default-profile.png";


    // Load profile image
    const profileImage = document.getElementById("profileImage");
    if (data.profileImage) {
      profileImage.src = data.profileImage;
    }

  } else {
    alert("No user data found.");
  }
});

const editBtn = document.getElementById("editProfileBtn");
const saveBtn = document.getElementById("saveProfileBtn");

editBtn.addEventListener("click", () => {
  toggleInputs(true);
  editBtn.style.display = "none";
  saveBtn.style.display = "inline-block";
});

saveBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const updatedData = {
    name: document.getElementById("name").value,
    gender: document.getElementById("gender").value,
    dob: document.getElementById("dob").value,
    placeOfBirth: document.getElementById("placeOfBirth").value,
    voters: document.getElementById("voters").value,
    pwd: document.getElementById("pwd").value,
    singleParent: document.getElementById("singleParent").value,
    civilStatus: document.getElementById("civilStatus").value,
    religion: document.getElementById("religion").value,
    nationality: document.getElementById("nationality").value,
    contactNumber: document.getElementById("contactNumber").value,
    fatherName: document.getElementById("fatherName").value,
    motherName: document.getElementById("motherName").value,
    address: {
      houseNumber: document.getElementById("houseNumber").value,
      streetAddress: document.getElementById("streetAddress").value,
      barangay: document.getElementById("barangay").value,
      municipality: document.getElementById("municipality").value,
      zipCode: document.getElementById("zipCode").value
    }
  };

  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, updatedData, { merge: true });

    alert("Profile updated successfully!");
    toggleInputs(false);
    editBtn.style.display = "inline-block";
    saveBtn.style.display = "none";
  } catch (error) {
    console.error("Error updating profile:", error);
    alert("Failed to update profile.");
  }
});

function toggleInputs(enable) {
  const inputs = document.querySelectorAll("input");
  inputs.forEach(input => input.disabled = !enable);
}

// Profile image upload
const uploadBtn = document.getElementById("uploadImageBtn");
const fileInput = document.getElementById("profileImageInput");
const profileImage = document.getElementById("profileImage");

uploadBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  const user = auth.currentUser;
  if (!user) return;

  const storageRef = ref(storage, `profile_pictures/${user.uid}`);
  try {
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    await setDoc(doc(db, "users", user.uid), {
      profileImage: downloadURL
    }, { merge: true });

    profileImage.src = downloadURL;
    alert("Profile picture updated!");
  } catch (error) {
    console.error("Upload error:", error);
    alert("Failed to upload image.");
  }
});

window.logout = async function () {
  await signOut(auth);
  alert("Logged out successfully!");
  window.location.href = "login.html";
};

