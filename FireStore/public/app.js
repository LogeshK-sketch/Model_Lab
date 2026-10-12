
import { initializeApp } from
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
} from
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Replace with your Firebase web app configuration
const firebaseConfig = {
    apiKey: "AIzaSyDNC8k3R_98PayYt4zSHDmF1dKa_Q12ACI",
    authDomain: "cloud-fc191.firebaseapp.com",
    projectId: "cloud-fc191",
    appId: "1:904536925276:web:82d7af5554a057b72d3299"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const studentsRef = collection(db, "students");

const form = document.getElementById("studentForm");
const studentList = document.getElementById("studentList");
const message = document.getElementById("message");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

let editingId = null;

// CREATE or UPDATE
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const student = {
        name: document.getElementById("name").value.trim(),
        regNo: document.getElementById("regNo").value.trim(),
        department: document.getElementById("department").value.trim(),
        email: document.getElementById("email").value.trim()
    };

    if (Object.values(student).some(value => !value)) {
        message.textContent = "Please fill all fields.";
        return;
    }

    try {
        if (editingId) {
            await updateDoc(doc(db, "students", editingId), student);
            message.textContent = "Student updated successfully!";
        } else {
            await addDoc(studentsRef, student);
            message.textContent = "Student registered successfully!";
        }

        resetForm();
        await loadStudents();
    } catch (error) {
        console.error(error);
        message.textContent = "Error: " + error.message;
    }
});

// READ
async function loadStudents() {
    studentList.replaceChildren();

    try {
        const snapshot = await getDocs(studentsRef);

        snapshot.forEach((studentDoc) => {
            const student = studentDoc.data();
            const tr = document.createElement("tr");

            [student.name, student.regNo, student.department, student.email]
                .forEach(value => {
                    const td = document.createElement("td");
                    td.textContent = value || "";
                    tr.appendChild(td);
                });

            const actions = document.createElement("td");

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.onclick = () => editStudent(studentDoc.id, student);

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.onclick = () => deleteStudent(studentDoc.id);

            actions.append(editBtn, deleteBtn);
            tr.appendChild(actions);
            studentList.appendChild(tr);
        });

        if (snapshot.empty) {
            message.textContent = "No students registered yet.";
        }
    } catch (error) {
        console.error(error);
        message.textContent = "Could not load students: " + error.message;
    }
}

// Load details into the form for editing
function editStudent(id, student) {
    editingId = id;

    document.getElementById("name").value = student.name || "";
    document.getElementById("regNo").value = student.regNo || "";
    document.getElementById("department").value = student.department || "";
    document.getElementById("email").value = student.email || "";

    saveBtn.textContent = "Update Student";
    cancelBtn.hidden = false;
    message.textContent = "Editing student: " + student.name;
}

// DELETE
async function deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student?")) {
        return;
    }

    try {
        await deleteDoc(doc(db, "students", id));
        message.textContent = "Student deleted successfully!";
        await loadStudents();
    } catch (error) {
        console.error(error);
        message.textContent = "Delete failed: " + error.message;
    }
}

// Reset form after saving or cancelling
function resetForm() {
    form.reset();
    editingId = null;
    saveBtn.textContent = "Register Student";
    cancelBtn.hidden = true;
}

cancelBtn.addEventListener("click", resetForm);
document.getElementById("refreshBtn").addEventListener("click", loadStudents);

// Display existing records on startup
loadStudents();
