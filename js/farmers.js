const currentUser =
JSON.parse(localStorage.getItem("currentUser"));

if(!currentUser){

window.location="login.html";

}

if(currentUser.role!=="Farmer"){

alert("Access Denied");

window.location="index.html";

}
let products = JSON.parse(localStorage.getItem("farmerProducts")) || [];

const table = document.getElementById("farmerProducts");

function displayProducts(){

table.innerHTML="";

document.getElementById("productsCount").innerHTML=products.length;

products.forEach((item,index)=>{

table.innerHTML+=`

<tr>

<td>${item.name}</td>

<td>${item.category}</td>

<td>R${item.price}</td>

<td>${item.quantity}</td>

<td>

<button onclick="editProduct(${index})">

Edit

</button>

<button onclick="deleteProduct(${index})">

Delete

</button>

</td>

</tr>

`;

});

localStorage.setItem("farmerProducts",

JSON.stringify(products));

}

document.getElementById("productForm")

.addEventListener("submit",function(e){

e.preventDefault();

products.push({

name:productName.value,

price:productPrice.value,

quantity:productQuantity.value,

category:category.value,

description:description.value

});

this.reset();

displayProducts();

});

function deleteProduct(index){

products.splice(index,1);

displayProducts();

}

function editProduct(index){

let p=products[index];

productName.value=p.name;

productPrice.value=p.price;

productQuantity.value=p.quantity;

category.value=p.category;

description.value=p.description;

products.splice(index,1);

displayProducts();

}

displayProducts();