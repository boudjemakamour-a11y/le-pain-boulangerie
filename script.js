// =====================
// FIREBASE IMPORT
// =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, collection, addDoc, getDocs, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =====================
// FIREBASE CONFIG (PUT YOURS)
// =====================
const firebaseConfig = {
    apiKey: "AIzaSyBK-vY3-6JfxBQlKjmJvt5EVyVH14k2-1M",
    authDomain: "boulangerie-app-eaf44.firebaseapp.com",
    projectId: "boulangerie-app-eaf44",
    storageBucket: "boulangerie-app-eaf44.firebasestorage.app",
    messagingSenderId: "462668655178",
    appId: "1:462668655178:web:7709105f67964b27fdd4b3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =====================
// CLOUDINARY CONFIG
// =====================
const CLOUD_NAME = "dlvu4e3h1";
const UPLOAD_PRESET = "unsigned_preset";

// =====================
// PAGE DETECTION
// =====================
const currentPage = window.location.pathname
    .split("/")
    .pop()
    .replace(".html", "");

// =====================
// ADMIN
// =====================
let isAdmin = localStorage.getItem("isAdmin") === "true";

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
            ${isAdmin ? `<button class="delete-btn">Delete</button>` : ""}
        `;

        // DELETE
        if (isAdmin) {
            div.querySelector(".delete-btn").addEventListener("click", async () => {
                await deleteDoc(doc(db, "products", docSnap.id));
                loadProducts();
            });
        }

        container.appendChild(div);
    });
}

loadProducts();

// =====================
// ADD PRODUCT
// =====================
const addBtn = document.getElementById("addBtn");

if (addBtn) {

    const addSection = document.querySelector(".add-product");

    if (!isAdmin && addSection) {
        addSection.style.display = "none";
    }

    addBtn.addEventListener("click", async () => {

        const name = document.getElementById("name").value.trim();
        const price = document.getElementById("price").value.trim();
        const desc = document.getElementById("desc").value.trim();
        const category = document.getElementById("category").value;
        const file = document.getElementById("image").files[0];

        if (!name || !price || !desc || !file) {
            alert("Fill all fields");
            return;
        }

        try {
            // =====================
            // UPLOAD TO CLOUDINARY
            // =====================
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", UPLOAD_PRESET);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();

            const imageURL = data.secure_url;

            // =====================
            // SAVE TO FIRESTORE
            // =====================
            await addDoc(collection(db, "products"), {
                name,
                price,
                description: desc,
                category,
                image: imageURL
            });

            alert("Product added ✅");
            location.reload();

        } catch (error) {
            console.error(error);
            alert("Error ❌");
        }
    });
}

// =====================
// ADMIN LOGIN
// =====================
const submitLogin = document.getElementById("submitLogin");

if (submitLogin) {
    submitLogin.addEventListener("click", () => {

        const password = document.getElementById("adminPass").value;

        if (password === "azer1234") {
            localStorage.setItem("isAdmin", "true");
            location.reload();
        } else {
            alert("Wrong password");
        }
    });
}