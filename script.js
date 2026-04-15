// =====================
// FIREBASE IMPORT
// =====================
import { updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
// IMAGE COMPRESSION
// =====================
function compressImage(file, maxWidth = 800) {
    return new Promise((resolve) => {

        const img = new Image();
        const reader = new FileReader();

        reader.onload = e => img.src = e.target.result;

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const scale = maxWidth / img.width;

            canvas.width = maxWidth;
            canvas.height = img.height * scale;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(blob => {
                resolve(blob);
            }, "image/jpeg", 0.7);
        };

        reader.readAsDataURL(file);
    });
}
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
const addSection = document.querySelector(".add-product");

if (!isAdmin && addSection) {
    addSection.style.display = "none";
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
        // EDIT
        if (isAdmin) {
            div.querySelector(".edit-btn").addEventListener("click", () => {

                const newName = prompt("New name:", product.name);
                const newPrice = prompt("New price:", product.price);
                const newDesc = prompt("New description:", product.description);

                if (!newName || !newPrice || !newDesc) return;

                updateDoc(doc(db, "products", docSnap.id), {
                    name: newName,
                    price: newPrice,
                    description: newDesc
                });

                loadProducts();
            });
        }   

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
addBtn.addEventListener("click", async () => {

    if (addBtn.disabled) return;

    const nameInput = document.getElementById("name");
    const priceInput = document.getElementById("price");
    const descInput = document.getElementById("desc");
    const imageInput = document.getElementById("image");

    const name = nameInput.value.trim();
    const price = priceInput.value.trim();
    const desc = descInput.value.trim();
    const category = document.getElementById("category").value;
    const file = imageInput.files[0];

    if (!name || !price || !desc || !file) {
        alert("Fill all fields");
        return;
    }

    // 🔒 lock button
    addBtn.disabled = true;
    addBtn.textContent = "Uploading...";

    try {
        // 📸 compress image
        const compressedFile = await compressImage(file);

        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("upload_preset", UPLOAD_PRESET);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
        );

        const data = await response.json();
        const imageURL = data.secure_url;

        await addDoc(collection(db, "products"), {
            name,
            price,
            description: desc,
            category,
            image: imageURL
        });

        // ✅ CLEAR INPUTS (VERY IMPORTANT)
        nameInput.value = "";
        priceInput.value = "";
        descInput.value = "";
        imageInput.value = "";

        alert("Product added ✅");

        loadProducts();

    } catch (error) {
        console.error(error);
        alert("Error ❌");
    }

    addBtn.disabled = false;
    addBtn.textContent = "Add Product";
});
// =====================
// ADMIN LOGIN
// =====================
const submitLogin = document.getElementById("submitLogin");

if (submitLogin) {
    submitLogin.addEventListener("click", () => {

        const password = document.getElementById("adminPass").value;

        if (password === "boulangerie_admin_2026") {
            localStorage.setItem("isAdmin", "true");

            alert("Admin connected ✅");

            location.reload();
        } else {
            alert("Wrong password ❌");
        }
    });
}
// =====================
// SECRET ADMIN LOGIN (5 CLICKS)
// =====================
const logo = document.getElementById("logo");
const loginBox = document.getElementById("loginBox");

let clickCount = 0;

if (logo) {
    logo.addEventListener("click", () => {
        clickCount++;

        if (clickCount === 5) {
            loginBox.style.display = "flex";
            clickCount = 0;
        }

        setTimeout(() => clickCount = 0, 2000);
    });
}
// =====================
// LOGOUT BUTTON
// =====================
if (isAdmin) {
    const logoutBtn = document.createElement("button");

    logoutBtn.textContent = "Logout";
    logoutBtn.style.position = "fixed";
    logoutBtn.style.top = "10px";
    logoutBtn.style.right = "10px";

    logoutBtn.addEventListener("click", () => {
        localStorage.setItem("isAdmin", "false");
        location.reload();
    });

    document.body.appendChild(logoutBtn);
}