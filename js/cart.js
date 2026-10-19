let cart = JSON.parse(localStorage.getItem("cart")) || [];

const table = document.getElementById("cart-items");

function displayCart(){

if(!table) return;

table.innerHTML="";

let subtotal=0;

cart.forEach((item,index)=>{

let total=item.price*item.quantity;

subtotal+=total;

table.innerHTML+=`

<tr>

<td>${item.name}</td>

<td>R${item.price}</td>

<td>

<button onclick="decrease(${index})">-</button>

${item.quantity}

<button onclick="increase(${index})">+</button>

</td>

<td>R${total}</td>

<td>

<button onclick="removeItem(${index})">

Remove

</button>

</td>

</tr>

`;

});

let vat=subtotal*0.15;

let delivery=cart.length>0?80:0;

let grand=subtotal+vat+delivery;

document.getElementById("subtotal").innerHTML="R"+subtotal.toFixed(2);

document.getElementById("vat").innerHTML="R"+vat.toFixed(2);

document.getElementById("delivery").innerHTML="R"+delivery.toFixed(2);

document.getElementById("grand-total").innerHTML="R"+grand.toFixed(2);

localStorage.setItem("cart",JSON.stringify(cart));

}

function increase(index){

cart[index].quantity++;

displayCart();

}

function decrease(index){

if(cart[index].quantity>1)

cart[index].quantity--;

displayCart();

}

function removeItem(index){

cart.splice(index,1);

displayCart();

}

displayCart();