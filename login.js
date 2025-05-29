import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

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

// Function to show custom alert
function showCustomAlert(message) {
  const alertElement = document.getElementById('customAlert');
  const messageElement = document.getElementById('alertMessage');
  const closeButton = document.getElementById('closeAlertBtn');
  
  // Set the alert message
  messageElement.textContent = message;

  // Display the alert
  alertElement.style.display = 'block';

  // Close alert on button click
  closeButton.addEventListener('click', () => {
    alertElement.style.display = 'none';
  });

  // Optionally: auto-close alert after 5 seconds
  setTimeout(() => {
    alertElement.style.display = 'none';
  }, 5000);
}

// Login form listener
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const submitBtn = form.querySelector("button[type='submit']");

  if (!form) {
    console.error("Login form not found.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Disable the submit button to prevent multiple clicks
    submitBtn.disabled = true;

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();

        if (userData.archived === true) {
          showCustomAlert("Your account has been archived. Please contact the administrator.");
          await auth.signOut();
          submitBtn.disabled = false;  // re-enable button
          return;
        }

        if (userData.role === "admin") {
          window.location.href = "staff/admindashboard.html";
        } else {
          if (!user.emailVerified) {
            showCustomAlert("Please verify your email address before logging in.");
            await auth.signOut();
            submitBtn.disabled = false;  // re-enable button
            return;
          }
          window.location.href = "dashboard.html";
        }

      } else {
        showCustomAlert("User data not found.");
        submitBtn.disabled = false;  // re-enable button
      }

    } catch (error) {
      console.error(error);

      let errorMessage = "Login failed.";

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with that email address.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password. Please try again.";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        default:
          errorMessage = "An unexpected error occurred. Please try again.";
          break;
      }

      showCustomAlert(errorMessage);
      submitBtn.disabled = false;  // re-enable button on error
    }
  });
});
