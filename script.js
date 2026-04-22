// =====================
// FIREBASE IMPORTS
// =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// =====================
// CONFIG
// =====================
const firebaseConfig = {
    apiKey: "AIzaSyBK-vY3-6JfxBQlKjmJvt5EVyVH14k2-1M",
    authDomain: "boulangerie-app-eaf44.firebaseapp.com",
    projectId: "boulangerie-app-eaf44",
};

const ADMIN_EMAIL = "boudjemakamour@gmail.com";


// =====================
// INIT
// =====================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let isAdmin = false;


// =====================
// PAGE DETECTION
// =====================
const currentPage = window.location.pathname
    .split("/")
    .pop()
    .replace(".html", "");


// =====================
// AUTH STATE
// =====================
onAuthStateChanged(auth, (user) => {

    if (user && user.email === ADMIN_EMAIL) {
        isAdmin = true;
        console.log("Admin connected");
    } else {
        isAdmin = false;
    }

    setupUI();
    loadProducts();
});


// =====================
// LOGIN FUNCTION
// =====================
const logo = document.getElementById("logo");
let clickCount = 0;

if (logo) {
    logo.addEventListener("click", () => {
        clickCount++;

        if (clickCount === 5) {
            loginWithGoogle(); // 👈 THIS is the change
            clickCount = 0;
        }

        setTimeout(() => clickCount = 0, 2000);
    });
}


window.loginWithGoogle = async function () {
    try {
        const result = await signInWithPopup(auth, provider);
        console.log("Logged in:", result.user.email);
    } catch (err) {
        console.error(err);
        alert("Login error");
    }
};


// =====================
// LOGOUT
// =====================
window.logout = async function () {
    await signOut(auth);
};


// =====================
// UI SETUP
// =====================
function setupUI() {

    const addSection = document.querySelector(".add-product");

    if (addSection) {
        addSection.style.display = isAdmin ? "flex" : "none";
    }

    // Logout button
    if (isAdmin && !document.getElementById("logoutBtn")) {
        const btn = document.createElement("button");
        btn.id = "logoutBtn";
        btn.textContent = "Logout";

        btn.style.position = "fixed";
        btn.style.top = "10px";
        btn.style.right = "10px";

        btn.onclick = logout;
        document.body.appendChild(btn);
    }
}


// =====================
// LOAD PRODUCTS
// =====================
const container = document.querySelector(".products");

async function loadProducts() {

    if (!container) return;

    container.innerHTML = "";

    const snapshot = await getDocs(collection(db, "products"));

    snapshot.forEach((docSnap) => {

        const product = docSnap.data();

        if (product.category !== currentPage) return;

        const div = document.createElement("div");
        div.className = "product";

        div.innerHTML = `
            <img src="${product.image}">
            <h2>${product.name}</h2>
            <p>Prix: ${product.price}</p>
            <p>${product.description}</p>

            ${isAdmin ? `
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            ` : ""}
        `;

        // DELETE
        if (isAdmin) {
            div.querySelector(".delete-btn").onclick = async () => {
                await deleteDoc(doc(db, "products", docSnap.id));
                loadProducts();
            };
        }

        // EDIT
        if (isAdmin) {
            div.querySelector(".edit-btn").onclick = async () => {

                const newName = prompt("New name:", product.name);
                const newPrice = prompt("New price:", product.price);
                const newDesc = prompt("New description:", product.description);

                if (!newName || !newPrice || !newDesc) return;

                await updateDoc(doc(db, "products", docSnap.id), {
                    name: newName,
                    price: newPrice,
                    description: newDesc
                });

                loadProducts();
            };
        }

        container.appendChild(div);
    });
}


// =====================
// ADD PRODUCT
// =====================
const addBtn = document.getElementById("addBtn");

if (addBtn) {
    addBtn.addEventListener("click", async () => {

        const name = document.getElementById("name").value;
        const price = document.getElementById("price").value;
        const desc = document.getElementById("desc").value;
        const category = document.getElementById("category").value;
        const file = document.getElementById("image").files[0];

        if (!name || !price || !desc || !file) {
            alert("Fill all fields");
            return;
        }

        // SIMPLE upload (you can re-add Cloudinary later)
        const reader = new FileReader();

        reader.onload = async function () {

            await addDoc(collection(db, "products"), {
                name,
                price,
                description: desc,
                category,
                image: reader.result
            });

            loadProducts();
        };

        reader.readAsDataURL(file);
    });
}