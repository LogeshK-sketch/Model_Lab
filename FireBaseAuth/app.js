import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDNC8k3R_98PayYt4zSHDmF1dKa_Q12ACI",
    authDomain: "cloud-fc191.firebaseapp.com",
    projectId: "cloud-fc191",
    appId: "1:904536925276:web:82d7af5554a057b72d3299"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Google Sign-In
document.getElementById("login").onclick = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        alert("Welcome " + result.user.displayName);
    } catch (error) {
        alert("Login failed: " + error.code);
        console.error(error);
    }
};

// Logout
document.getElementById("logout").onclick = async () => {
    try {
        await signOut(auth);
        alert("Logged out successfully!");
    } catch (error) {
        alert(error.code);
    }
};

// Monitor login state
onAuthStateChanged(auth, user => {
    document.getElementById("message").innerText =
        user ? "Welcome " + (user.displayName || user.email) : "Not Logged In";

    document.getElementById("userEmail").innerText =
        user ? user.email || "" : "";
});