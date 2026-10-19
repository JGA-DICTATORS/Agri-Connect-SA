// ================================
// AgriConnect SA - Main JavaScript
// ================================

// Shopping Cart
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Save Cart
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCounter();
}

// Update Cart Counter
function updateCartCounter() {

    const counter = document.getElementById("cart-count");

    if (!counter) return;

    let total = 0;

    cart.forEach(item => total += item.quantity);

    counter.textContent = total;

}

// Add Product To Cart
function addToCart(name, price) {

    const product = cart.find(item => item.name === name);

    if (product) {

        product.quantity++;

    } else {

        cart.push({

            name: name,

            price: price,

            quantity: 1

        });

    }

    saveCart();

    showToast(name + " added to cart!");

}

// Toast Notification
function showToast(message) {

    let toast = document.createElement("div");

    toast.className = "toast";

    toast.innerHTML = message;

    document.body.appendChild(toast);

    setTimeout(() => {

        toast.classList.add("show");

    }, 100);

    setTimeout(() => {

        toast.remove();

    }, 3000);

}

updateCartCounter();


// ================================
// Search Products
// ================================

const search = document.getElementById("search");

if (search) {

    search.addEventListener("keyup", function () {

        const value = search.value.toLowerCase();

        const products = document.querySelectorAll(".product");

        products.forEach(product => {

            product.style.display =
                product.innerText.toLowerCase().includes(value)
                    ? "block"
                    : "none";

        });

    });

}


// ================================
// Scroll To Top Button
// ================================

const topButton = document.getElementById("topBtn");

window.onscroll = function () {

    if (document.body.scrollTop > 200 ||

        document.documentElement.scrollTop > 200) {

        if (topButton)

            topButton.style.display = "block";

    }

    else {

        if (topButton)

            topButton.style.display = "none";

    }

};

function topFunction() {

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

}
// =====================
// Product Filter
// =====================

function filterProducts(category){

const products = document.querySelectorAll(".product");

products.forEach(product=>{

if(category==="all"){

product.style.display="block";

}

else if(product.classList.contains(category)){

product.style.display="block";

}

else{

product.style.display="none";

}

});

}