// =====================
// FIREBASE IMPORTS
// =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.2.0/firebase-firestore.js";

// =====================
// FIREBASE CONFIG (PUT YOURS HERE)
// =====================
const firebaseConfig = {
    apiKey: "AIzaSyDs-3awjX2blWcwGTkNMrU_zfNXio4octc",
    authDomain: "le-pain-boulangerie-7b19e.firebaseapp.com",
    projectId: "le-pain-boulangerie-7b19e",
    storageBucket: "le-pain-boulangerie-7b19e.firebasestorage.app",
    messagingSenderId: "281743981904",
    appId: "1:281743981904:web:9f9d0d9c9532613b624055"
};

// =====================
// INIT FIREBASE
// =====================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =====================
// PAGE DETECTION
// =====================
const currentPage = window.location.pathname
    .split("/")
    .pop()
    .replace(".html", "");

// =====================
// ADMIN SYSTEM
// =====================
let isAdmin = localStorage.getItem("isAdmin") === "true";

const loginBox = document.getElementById("loginBox");
const submitLogin = document.getElementById("submitLogin");

if (submitLogin) {
    submitLogin.addEventListener("click", () => {
        const password = document.getElementById("adminPass").value;
        const ADMIN_PASSWORD = "azer1234";

        if (password === ADMIN_PASSWORD) {
            localStorage.setItem("isAdmin", "true");
            alert("Admin connected");
            location.reload();
        } else {
            alert("Wrong password");
        }
    });
}

// SECRET LOGIN
const logo = document.getElementById("logo");
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
// LOAD & DISPLAY PRODUCTS
// =====================
const container = document.querySelector(".products");

async function loadProducts() {

    if (!container) return;

    container.innerHTML = "";

    const snapshot = await getDocs(collection(db, "products"));

    const today = new Date();

    snapshot.forEach((docItem) => {

        const product = docItem.data();
        const id = docItem.id;

        // FILTER
        if (product.category !== currentPage) return;

        if (product.expireDate) {
            if (new Date(product.expireDate) < today) return;
        }

        const div = document.createElement("div");
        div.className = "product";

        div.innerHTML = `
            <img src="${product.image}">
            <h2>${product.name}</h2>
            <p>Prix: ${product.price}</p>
            <p>${product.description}</p>

            ${isAdmin && product.expireDate 
                ? `<p>Expire: ${new Date(product.expireDate).toLocaleDateString()}</p>` 
                : ""}

            ${isAdmin ? `<button class="edit-btn">Edit</button>` : ""}
            ${isAdmin ? `<button class="delete-btn">Delete</button>` : ""}
        `;

        // DELETE
        const deleteBtn = div.querySelector(".delete-btn");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", async () => {
                if (!confirm("Delete this product?")) return;

                await deleteDoc(doc(db, "products", id));
                loadProducts();
            });
        }

        // EDIT
        const editBtn = div.querySelector(".edit-btn");
        if (editBtn) {
            editBtn.addEventListener("click", () => {
                document.getElementById("editName").value = product.name;
                document.getElementById("editPrice").value = product.price;
                document.getElementById("editDesc").value = product.description;

                document.getElementById("editBox").style.display = "flex";

                currentEditId = id;
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

        addBtn.disabled = true; // 🔥 prevent multiple clicks

        const name = document.getElementById("name").value;
        const price = document.getElementById("price").value;
        const desc = document.getElementById("desc").value;
        const category = document.getElementById("category").value;

        const expireDateInput = document.getElementById("expireDate");
        const expireDate = expireDateInput && expireDateInput.value
            ? expireDateInput.value
            : null;

        const imageInput = document.getElementById("image");
        const file = imageInput.files[0];

        if (!file) {
            alert("Select image");
            addBtn.disabled = false;
            return;
        }

        const reader = new FileReader();

        reader.onload = async function () {

            try {
                const newProduct = {
                    name,
                    price,
                    description: desc,
                    image: reader.result,
                    expireDate,
                    category
                };

                await addDoc(collection(db, "products"), newProduct);

                alert("Product added ✅");

            } catch (error) {
                console.error(error);
                alert("Error ❌");
            }

            addBtn.disabled = false; // 🔥 re-enable button
        };

        reader.readAsDataURL(file);
    });

}

// =====================
// EDIT SAVE
// =====================
let currentEditId = null;

const saveEdit = document.getElementById("saveEdit");

if (saveEdit) {
    saveEdit.addEventListener("click", async () => {

        if (!currentEditId) return;

        const newName = document.getElementById("editName").value;
        const newPrice = document.getElementById("editPrice").value;
        const newDesc = document.getElementById("editDesc").value;

        await updateDoc(doc(db, "products", currentEditId), {
            name: newName,
            price: newPrice,
            description: newDesc
        });

        location.reload();
    });
}

// =====================
// CLOSE POPUPS
// =====================
const closeLogin = document.getElementById("closeLogin");
const closeEdit = document.getElementById("closeEdit");

if (closeLogin) {
    closeLogin.addEventListener("click", () => {
        loginBox.style.display = "none";
    });
}

if (closeEdit) {
    closeEdit.addEventListener("click", () => {
        document.getElementById("editBox").style.display = "none";
    });
}

// =====================
// LOGOUT
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