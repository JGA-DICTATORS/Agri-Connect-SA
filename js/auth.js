// ====================================
// AgriConnect Authentication
// ====================================

const registerForm = document.getElementById("registerForm");

if(registerForm){

registerForm.addEventListener("submit",function(e){

e.preventDefault();

const fullname=document.getElementById("fullname").value;

const email=document.getElementById("email").value;

const phone=document.getElementById("phone").value;

const role=document.getElementById("role").value;

const password=document.getElementById("password").value;

const confirm=document.getElementById("confirmPassword").value;

if(password!==confirm){

alert("Passwords do not match.");

return;

}

let users=JSON.parse(localStorage.getItem("users"))||[];

if(users.find(user=>user.email===email)){

alert("Email already registered.");

return;

}

users.push({

fullname,

email,

phone,

role,

password

});

localStorage.setItem("users",JSON.stringify(users));

alert("Registration Successful!");

window.location="login.html";

});

}

const loginForm=document.getElementById("loginForm");

if(loginForm){

loginForm.addEventListener("submit",function(e){

e.preventDefault();

const email=document.getElementById("loginEmail").value;

const password=document.getElementById("loginPassword").value;

let users=JSON.parse(localStorage.getItem("users"))||[];

const user=users.find(

u=>u.email===email && u.password===password

);

if(!user){

alert("Invalid Email or Password");

return;

}

localStorage.setItem("currentUser",

JSON.stringify(user));

if(user.role==="Farmer"){

window.location="farmers.html";

}

else{

window.location="index.html";

}

});

}