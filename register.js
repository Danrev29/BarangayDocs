import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

// Firebase config
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

document.addEventListener("DOMContentLoaded", () => {
  const requiredFields = [
    "voters", "gender", "dob", "pwd", "singleParent",
    "firstName", "middleName", "lastName", "suffix", "religion", "nationality", "civilStatus",
    "houseNumber", "streetAddress", "barangay", "municipality", "zipCode", "contactNumber",
    "fatherName", "motherName", "email", "password", "confirmPassword", "pob"
  ];

  // === Password Validation Feedback ===
  const passwordInput = document.getElementById("password");
  passwordInput.addEventListener("input", () => {
    const password = passwordInput.value;
    document.getElementById("length").className = password.length >= 8 ? "valid" : "invalid";
    document.getElementById("uppercase").className = /[A-Z]/.test(password) ? "valid" : "invalid";
    document.getElementById("number").className = /[0-9]/.test(password) ? "valid" : "invalid";
  });

  // === Tab Button Functionality ===
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(tab => tab.classList.remove('active'));

      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // === Form Submission ===
  const registerBtn = document.querySelector("button[type='submit']");
  registerBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    // Validate all required fields
    let isValid = true;
    requiredFields.forEach(id => {
      const field = document.getElementById(id);
      const value = field.value.trim();
      if (!value) {
        field.classList.add("error");
        isValid = false;
      } else {
        field.classList.remove("error");
      }
    });

    if (!isValid) {
      alert("Please fill in all required fields.");
      const firstInvalid = document.querySelector(".error");
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Collect form values
    const voters = document.getElementById("voters").value;
    const gender = document.getElementById("gender").value;
    const dob = document.getElementById("dob").value;
    const placeOfBirth = document.getElementById("pob").value.trim().toUpperCase();
    const pwd = document.getElementById("pwd").value;
    const singleParent = document.getElementById("singleParent").value;

    const firstName = document.getElementById("firstName").value.trim().toUpperCase();
    const middleName = document.getElementById("middleName").value.trim().toUpperCase();
    const lastName = document.getElementById("lastName").value.trim().toUpperCase();
    const suffix = document.getElementById("suffix").value.trim().toUpperCase();
    const religion = document.getElementById("religion").value.trim().toUpperCase();
    const nationality = document.getElementById("nationality").value.trim().toUpperCase();
    const civilStatus = document.getElementById("civilStatus").value;

    const houseNumber = document.getElementById("houseNumber").value.trim().toUpperCase();
    const streetAddress = document.getElementById("streetAddress").value.trim().toUpperCase();
    const barangay = document.getElementById("barangay").value.trim().toUpperCase();
    const municipality = document.getElementById("municipality").value.trim().toUpperCase();
    const zipCode = document.getElementById("zipCode").value.trim();
    const contactNumber = document.getElementById("contactNumber").value.trim();

    const fatherName = document.getElementById("fatherName").value.trim().toUpperCase();
    const motherName = document.getElementById("motherName").value.trim().toUpperCase();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Construct proper name formatting
      const fullName = `${firstName}${middleName ? ' ' + middleName : ''} ${lastName}${suffix ? ', ' + suffix : ''}`.trim();

      // Create user data object
      const userData = {
        email: user.email,
        name: fullName,
        firstName,
        middleName,
        lastName,
        suffix,
        gender,
        dob,
        placeOfBirth,
        voters,
        pwd,
        singleParent,
        civilStatus,
        religion,
        nationality,
        contactNumber,
        address: {
          houseNumber,
          streetAddress,
          barangay,
          municipality,
          zipCode
        },
        fatherName,
        motherName,
        role: "normal",
        archived: false,
        createdAt: new Date()
      };

      // Save to Firestore
      await setDoc(doc(db, "users", user.uid), userData);

      // Send verification email
      await sendEmailVerification(user);

      alert("Registration successful! A verification email has been sent. Please verify before logging in.");

      await auth.signOut();
      window.location.href = "login.html";

    } catch (error) {
      console.error("Registration Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("This email is already in use. Please use a different one or log in.");
      } else {
        alert("Error: " + error.message);
      }
    }
  });
});
