import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
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

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ Save to "users" collection
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: user.email,
            createdAt: new Date(),
            role: "normal" // Optional: helps with role-based checks
        });

        alert("Registration successful!");
        window.location.href = "login.html";

    } catch (error) {
        alert("Registration failed: " + error.message);
        console.error(error);
    }
});
