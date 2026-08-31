// =========================
// SI YA HAY SESIÓN ACTIVA, NO MOSTRAR EL LOGIN
// =========================

if(typeof ceObtenerSesion === "function" && ceObtenerSesion()){
    window.location.href = "/VISTAS/sesion.html";
}

// =========================
// BOTONES LOGIN Y REGISTRO
// =========================

document.getElementById("btn__iniciar-sesion")
.addEventListener("click", iniciarSesion);

document.getElementById("btn__registrarse")
.addEventListener("click", register);

window.addEventListener("resize", anchoPage);

// =========================
// VARIABLES
// =========================

var formulario_login =
document.querySelector(".formulario__login");

var formulario_register =
document.querySelector(".formulario__register");

var contenedor_login_register =
document.querySelector(".contenedor__login-register");

var caja_trasera_login =
document.querySelector(".caja__trasera-login");

var caja_trasera_register =
document.querySelector(".caja__trasera-register");

// =========================
// RESPONSIVE
// =========================

function anchoPage(){

    if(window.innerWidth > 850){

        caja_trasera_register.style.display = "block";
        caja_trasera_login.style.display = "block";

    }else{

        caja_trasera_register.style.display = "block";
        caja_trasera_register.style.opacity = "1";

        caja_trasera_login.style.display = "none";

        formulario_login.style.display = "block";

        contenedor_login_register.style.left = "0px";

        formulario_register.style.display = "none";
    }
}

anchoPage();

// =========================
// LOGIN
// =========================

function iniciarSesion(){

    if(window.innerWidth > 850){

        formulario_login.style.display = "block";

        contenedor_login_register.style.left = "10px";

        formulario_register.style.display = "none";

        caja_trasera_register.style.opacity = "1";

        caja_trasera_login.style.opacity = "0";

    }else{

        formulario_login.style.display = "block";

        contenedor_login_register.style.left = "0px";

        formulario_register.style.display = "none";

        caja_trasera_register.style.display = "block";

        caja_trasera_login.style.display = "none";
    }
}

// =========================
// REGISTRO
// =========================

function register(){

    if(window.innerWidth > 850){

        formulario_register.style.display = "block";

        contenedor_login_register.style.left = "410px";

        formulario_login.style.display = "none";

        caja_trasera_register.style.opacity = "0";

        caja_trasera_login.style.opacity = "1";

    }else{

        formulario_register.style.display = "block";

        contenedor_login_register.style.left = "0px";

        formulario_login.style.display = "none";

        caja_trasera_register.style.display = "none";

        caja_trasera_login.style.display = "block";

        caja_trasera_login.style.opacity = "1";
    }
}

// =========================
// LOGIN / REGISTRO FUNCIONALES
// =========================

const formularioLogin = document.getElementById("formularioLogin");
const formularioRegistro = document.getElementById("formularioRegistro");

function mostrarMensaje(id, mensaje){
    const el = document.getElementById(id);
    if(el) el.textContent = mensaje || "";
}

function validarEmail(valor){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

formularioLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    mostrarMensaje("loginError", "");

    const email = document.getElementById("loginEmail").value.trim();
    const contrasena = document.getElementById("loginPassword").value;

    if(!validarEmail(email)){
        mostrarMensaje("loginError", "Ingresa un correo electrónico válido");
        return;
    }

    if(!contrasena){
        mostrarMensaje("loginError", "Ingresa tu contraseña");
        return;
    }

    const resultado = ceIniciarSesion(email, contrasena);

    if(!resultado.ok){
        mostrarMensaje("loginError", resultado.motivo);
        return;
    }

    window.location.href = "/VISTAS/sesion.html";
});

formularioRegistro.addEventListener("submit", (e) => {
    e.preventDefault();
    mostrarMensaje("registerError", "");

    const nombreCompleto = document.getElementById("registerNombre").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const usuario = document.getElementById("registerUsuario").value.trim();
    const contrasena = document.getElementById("registerPassword").value;

    if(nombreCompleto.length < 3){
        mostrarMensaje("registerError", "Ingresa tu nombre completo");
        return;
    }

    if(!validarEmail(email)){
        mostrarMensaje("registerError", "Ingresa un correo electrónico válido");
        return;
    }

    if(!usuario){
        mostrarMensaje("registerError", "Elige un nombre de usuario");
        return;
    }

    if(contrasena.length < 8){
        mostrarMensaje("registerError", "La contraseña debe tener al menos 8 caracteres");
        return;
    }

    const partesNombre = nombreCompleto.split(" ");
    const nombre = partesNombre.shift();
    const apellido = partesNombre.join(" ");

    const resultado = ceRegistrar({
        nombre,
        apellido,
        email,
        usuario,
        contrasena
    });

    if(!resultado.ok){
        mostrarMensaje("registerError", resultado.motivo);
        return;
    }

    window.location.href = "/VISTAS/sesion.html";
});

// =========================
// CAMBIO DE TEMA
// =========================

const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark-mode");

    if(document.body.classList.contains("dark-mode")){

        themeBtn.textContent = "☀️";

        localStorage.setItem(
            "theme",
            "dark"
        );

    }else{

        themeBtn.textContent = "🌙";

        localStorage.setItem(
            "theme",
            "light"
        );
    }
});

// =========================
// GUARDAR TEMA
// =========================

if(localStorage.getItem("theme") === "dark"){

    document.body.classList.add("dark-mode");

    themeBtn.textContent = "☀️";
}