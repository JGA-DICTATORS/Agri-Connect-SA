let cart = JSON.parse(localStorage.getItem("cart")) || [];

const container = document.getElementById("checkout-items");

let total = 0;

cart.forEach(item=>{

let subtotal=item.price*item.quantity;

total += subtotal;

container.innerHTML += `

<div class="checkout-product">

<h4>${item.name}</h4>

<p>

${item.quantity} × R${item.price}

</p>

</div>

`;

});

let vat = total * 0.15;

let delivery = cart.length > 0 ? 80 : 0;

let grand = total + vat + delivery;

document.getElementById("checkout-total").innerHTML =
"R" + grand.toFixed(2);

document.getElementById("checkoutForm")

.addEventListener("submit",function(e){

e.preventDefault();

alert("🎉 Order placed successfully!\nThank you for shopping with AgriConnect SA.");

localStorage.removeItem("cart");

window.location="index.html";

});