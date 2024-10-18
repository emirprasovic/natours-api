require("core-js/modules/es.regexp.flags.js");
require("core-js/modules/esnext.map.group-by.js");
require("core-js/modules/esnext.symbol.dispose.js");

/* eslint-disable */ 


/* eslint-disable */ const $c2d892ebf1e61ddb$export$de026b00723010c1 = (type, message)=>{
    $c2d892ebf1e61ddb$export$516836c6a9dfc573();
    const markup = `<div class="alert alert--${type}">${message}</div>`;
    document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
    window.setTimeout($c2d892ebf1e61ddb$export$516836c6a9dfc573, 5000);
};
const $c2d892ebf1e61ddb$export$516836c6a9dfc573 = ()=>{
    const el = document.querySelector(".alert");
    if (el) el.parentElement.removeChild(el);
};


const $7570edde942f4242$var$postData = async (url, data)=>{
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    return response.json();
};
const $7570edde942f4242$export$596d806903d1f59e = async (email, password)=>{
    const res = await $7570edde942f4242$var$postData("http://127.0.0.1:3000/api/v1/users/login", {
        email: email,
        password: password
    });
    if (res.status === "success") {
        (0, $c2d892ebf1e61ddb$export$de026b00723010c1)("success", "Successfully logged in");
        window.setTimeout(()=>location.assign("/"), 1000);
    } else (0, $c2d892ebf1e61ddb$export$de026b00723010c1)("error", res.message);
};
const $7570edde942f4242$export$a0973bcfe11b05c9 = async ()=>{
    // console.log('LOGOUT');
    try {
        const res = await fetch("http://127.0.0.1:3000/api/v1/users/logout");
        const data = await res.json();
        // console.log(data);
        if (data.status === "success") // console.log('Success');
        location.reload(true);
    } catch (err) {
        (0, $c2d892ebf1e61ddb$export$de026b00723010c1)("error", "Error logging out :o");
    }
};


/* eslint-disable */ 
const $d33a86d74089f009$var$patchData = async (url, data)=>{
    const response = await fetch(url, {
        method: "PATCH",
        // headers: {
        //   'Content-Type': 'application/json',
        // },
        // body: JSON.stringify(data), // body data type must match "Content-Type" header
        body: data
    });
    return response.json();
};
const $d33a86d74089f009$export$f558026a994b6051 = async (data, type = "data")=>{
    const url = type === "password" ? "http://127.0.0.1:3000/api/v1/users/update-my-password" : "http://127.0.0.1:3000/api/v1/users/update-me";
    const res = await $d33a86d74089f009$var$patchData(url, data);
    if (res.status === "success") (0, $c2d892ebf1e61ddb$export$de026b00723010c1)("success", `Successfully updated ${type}`);
    else (0, $c2d892ebf1e61ddb$export$de026b00723010c1)("error", res.message);
};



const $cb5878a512e7ac1f$var$stripe = Stripe("pk_test_51QAavcAQvZCakeQq3AIdR7wMyzPY1xCTT1UFwZ0iqWetBeMGg7PwIANjEldgKGaIL8gxGROKSSXsvFRW20LxPSy400Rtz1WDIw");
const $cb5878a512e7ac1f$var$fetchData = async (url)=>{
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return response.json();
};
const $cb5878a512e7ac1f$export$8d5bdbf26681c0c2 = async (tourId)=>{
    try {
        // 1) Get checkout session from API
        const session = await $cb5878a512e7ac1f$var$fetchData(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
        // console.log(session);
        // 2) Create checkout form + charge credit card
        await $cb5878a512e7ac1f$var$stripe.redirectToCheckout({
            sessionId: session.session.id
        });
    } catch (err) {
        // console.log(err);
        (0, $c2d892ebf1e61ddb$export$de026b00723010c1)("error", err);
    }
};


// DOM
const $a386374224be1cff$var$loginForm = document.querySelector(".form-login");
const $a386374224be1cff$var$logoutBtn = document.querySelector(".nav__el--logout");
const $a386374224be1cff$var$updateUserDataForm = document.querySelector(".form-user-data");
const $a386374224be1cff$var$updateUserPasswordForm = document.querySelector(".form-user-settings");
const $a386374224be1cff$var$bookBtn = document.querySelector("#book-tour");
if ($a386374224be1cff$var$loginForm) $a386374224be1cff$var$loginForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    (0, $7570edde942f4242$export$596d806903d1f59e)(email, password);
});
if ($a386374224be1cff$var$logoutBtn) $a386374224be1cff$var$logoutBtn.addEventListener("click", (0, $7570edde942f4242$export$a0973bcfe11b05c9));
if ($a386374224be1cff$var$updateUserDataForm) $a386374224be1cff$var$updateUserDataForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const name = document.querySelector("#name").value;
    const email = document.querySelector("#email").value;
    // Moramo ovako raditi zbog images
    const form = new FormData();
    form.append("name", document.querySelector("#name").value);
    form.append("email", document.querySelector("#email").value);
    form.append("photo", document.querySelector("#photo").files[0]);
    // console.log('FORM');
    // for (let [key, value] of form.entries()) {
    //   console.log(key, value);
    // }
    (0, $d33a86d74089f009$export$f558026a994b6051)(form, "data");
// updateSettings({ name, email }, 'data');
});
if ($a386374224be1cff$var$updateUserPasswordForm) $a386374224be1cff$var$updateUserPasswordForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const btn = document.querySelector(".btn--save-password");
    btn.innerHTML = "Updating...";
    const passwordCurrent = document.querySelector("#password-current").value;
    const newPassword = document.querySelector("#password").value;
    const passwordConfirm = document.querySelector("#password-confirm").value;
    (0, $d33a86d74089f009$export$f558026a994b6051)({
        passwordCurrent: passwordCurrent,
        newPassword: newPassword,
        passwordConfirm: passwordConfirm
    }, "password").then(()=>{
        document.querySelector("#password").value = "";
        document.querySelector("#password-confirm").value = "";
        document.querySelector("#password-current").value = "";
        btn.innerHTML = "Save password";
    });
});
if ($a386374224be1cff$var$bookBtn) $a386374224be1cff$var$bookBtn.addEventListener("click", (e)=>{
    e.target.textContent = "Processing...";
    e.preventDefault();
    const tourId = e.target.dataset.tourId;
    (0, $cb5878a512e7ac1f$export$8d5bdbf26681c0c2)(tourId);
});


//# sourceMappingURL=app.js.map
