/* =========================================================
   SESION.JS - Administración de Perfil (CE-Web Constructora)
   Usa la sesión real creada por auth.js (login/registro).
   Persistencia local (localStorage) simulando la tabla
   "usuarios" del esquema de base de datos.
   ========================================================= */

const STORAGE_PREFS = "ce_usuario_prefs";

// =========================
// GUARDIA DE SESIÓN
// (si no hay una sesión activa -inició en login.html-
//  se saca de esta pantalla)
// =========================

let usuarioActual = ceObtenerSesion();

if(!usuarioActual){
    window.location.href = "/VISTAS/login.html";
    throw new Error("Sesión no iniciada");
}

function guardarUsuario(cambios){
    usuarioActual = ceActualizarUsuarioActual(cambios);
}

// =========================
// ELEMENTOS DEL DOM
// =========================

const themeBtn = document.getElementById("themeBtn");
const prefTheme = document.getElementById("prefTheme");

const avatarCircle = document.getElementById("avatarCircle");
const avatarImg = document.getElementById("avatarImg");
const avatarInitials = document.getElementById("avatarInitials");
const inputAvatar = document.getElementById("inputAvatar");
const btnCambiarFoto = document.getElementById("btnCambiarFoto");
const btnQuitarFoto = document.getElementById("btnQuitarFoto");

const sidebarNombre = document.getElementById("sidebarNombre");
const sidebarEmail = document.getElementById("sidebarEmail");
const sidebarRol = document.getElementById("sidebarRol");
const sidebarEstado = document.getElementById("sidebarEstado");

const tabs = document.querySelectorAll(".tab-btn");
const paneles = document.querySelectorAll(".tab-panel");

const formDatos = document.getElementById("formDatos");
const inputNombre = document.getElementById("inputNombre");
const inputApellido = document.getElementById("inputApellido");
const inputEmail = document.getElementById("inputEmail");
const inputTelefono = document.getElementById("inputTelefono");
const inputCiudad = document.getElementById("inputCiudad");
const btnCancelarDatos = document.getElementById("btnCancelarDatos");

const formSeguridad = document.getElementById("formSeguridad");
const passActual = document.getElementById("passActual");
const passNueva = document.getElementById("passNueva");
const passConfirmar = document.getElementById("passConfirmar");
const btnCancelarPass = document.getElementById("btnCancelarPass");
const fuerzaBarra = document.getElementById("fuerzaBarra");
const fuerzaTexto = document.getElementById("fuerzaTexto");

const btnEliminarCuenta = document.getElementById("btnEliminarCuenta");
const modalConfirm = document.getElementById("modalConfirm");
const modalCancelar = document.getElementById("modalCancelar");
const modalConfirmar = document.getElementById("modalConfirmar");

const btnLogout = document.getElementById("btnLogout");

const prefNotif = document.getElementById("prefNotif");
const prefRecordar = document.getElementById("prefRecordar");

const toast = document.getElementById("toast");

// =========================
// TEMA (claro / oscuro)
// =========================

function aplicarTema(modo){
    if(modo === "dark"){
        document.body.classList.add("dark-mode");
        if(themeBtn) themeBtn.textContent = "☀️";
        if(prefTheme) prefTheme.checked = true;
    }else{
        document.body.classList.remove("dark-mode");
        if(themeBtn) themeBtn.textContent = "🌙";
        if(prefTheme) prefTheme.checked = false;
    }
    localStorage.setItem("theme", modo);
}

if(themeBtn){
    themeBtn.addEventListener("click", () => {
        const nuevoModo = document.body.classList.contains("dark-mode") ? "light" : "dark";
        aplicarTema(nuevoModo);
    });
}

if(prefTheme){
    prefTheme.addEventListener("change", () => {
        aplicarTema(prefTheme.checked ? "dark" : "light");
    });
}

aplicarTema(localStorage.getItem("theme") === "dark" ? "dark" : "light");

// =========================
// AVATAR
// =========================

function obtenerIniciales(nombre, apellido){
    const n = (nombre || "").trim().charAt(0);
    const a = (apellido || "").trim().charAt(0);
    return ((n + a) || "US").toUpperCase();
}

function pintarAvatar(){
    const avatarGuardado = ceObtenerAvatar(usuarioActual);

    if(avatarGuardado){
        avatarImg.src = avatarGuardado;
        avatarImg.hidden = false;
        avatarInitials.hidden = true;
        btnQuitarFoto.hidden = false;
    }else{
        avatarImg.hidden = true;
        avatarInitials.hidden = false;
        avatarInitials.textContent = obtenerIniciales(usuarioActual.nombre, usuarioActual.apellido);
        btnQuitarFoto.hidden = true;
    }
}

btnCambiarFoto.addEventListener("click", () => inputAvatar.click());

inputAvatar.addEventListener("change", () => {
    const archivo = inputAvatar.files[0];
    if(!archivo) return;

    if(!archivo.type.startsWith("image/")){
        mostrarToast("El archivo debe ser una imagen", "error");
        return;
    }

    if(archivo.size > 2 * 1024 * 1024){
        mostrarToast("La imagen no debe superar 2MB", "error");
        return;
    }

    const lector = new FileReader();
    lector.onload = (e) => {
        localStorage.setItem(ceAvatarKey(usuarioActual), e.target.result);
        pintarAvatar();
        cePintarNavAuth();
        mostrarToast("Foto de perfil actualizada", "success");
    };
    lector.readAsDataURL(archivo);
});

btnQuitarFoto.addEventListener("click", () => {
    localStorage.removeItem(ceAvatarKey(usuarioActual));
    inputAvatar.value = "";
    pintarAvatar();
    cePintarNavAuth();
    mostrarToast("Foto de perfil eliminada", "success");
});

// =========================
// PESTAÑAS
// =========================

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        paneles.forEach(p => p.classList.remove("active"));

        tab.classList.add("active");
        document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
    });
});

// =========================
// PINTAR DATOS EN PANTALLA
// =========================

function pintarUsuario(){
    sidebarNombre.textContent = `${usuarioActual.nombre} ${usuarioActual.apellido}`;
    sidebarEmail.textContent = usuarioActual.email;
    sidebarRol.textContent = usuarioActual.rol;
    sidebarEstado.textContent = "● " + usuarioActual.estado;

    inputNombre.value = usuarioActual.nombre;
    inputApellido.value = usuarioActual.apellido;
    inputEmail.value = usuarioActual.email;
    inputTelefono.value = usuarioActual.telefono;
    inputCiudad.value = usuarioActual.ciudad || "";

    pintarAvatar();
}

pintarUsuario();

// =========================
// PANEL ADMIN: LISTADO DE CUENTAS
// (solo visible si el usuario en sesión es Administrador)
// =========================

const panelAdminCuentas = document.getElementById("panelAdminCuentas");
const listaCuentas = document.getElementById("listaCuentas");

function renderPanelAdmin(){
    if(!ceEsAdministrador(usuarioActual)){
        panelAdminCuentas.hidden = true;
        return;
    }

    panelAdminCuentas.hidden = false;

    const cuentas = ceListarCuentas()
        .filter(c => c.rol === "Cliente" || c.rol === "Asesor");

    if(cuentas.length === 0){
        listaCuentas.innerHTML = `<tr><td colspan="5">Aún no hay clientes ni asesores registrados.</td></tr>`;
        return;
    }

    listaCuentas.innerHTML = cuentas.map(c => `
        <tr data-id="${c.id}">
            <td>${c.nombre} ${c.apellido}</td>
            <td>${c.email}</td>
            <td>
                <select class="selectRol" data-id="${c.id}">
                    <option value="Cliente" ${c.rol === "Cliente" ? "selected" : ""}>Cliente</option>
                    <option value="Asesor" ${c.rol === "Asesor" ? "selected" : ""}>Asesor</option>
                </select>
            </td>
            <td>
                <span class="badge-estado-fila ${c.estado === "Activo" ? "activo" : "inactivo"}">
                    ● ${c.estado}
                </span>
            </td>
            <td>
                <button type="button" class="btn-fila ${c.estado === "Activo" ? "desactivar" : "activar"}" data-id="${c.id}">
                    ${c.estado === "Activo" ? "Desactivar" : "Activar"}
                </button>
            </td>
        </tr>
    `).join("");
}

if(panelAdminCuentas){
    listaCuentas.addEventListener("change", (e) => {
        if(!e.target.classList.contains("selectRol")) return;

        const id = e.target.dataset.id;
        ceActualizarCuentaPorId(id, { rol: e.target.value });
        mostrarToast("Rol actualizado correctamente", "success");
        renderPanelAdmin();
    });

    listaCuentas.addEventListener("click", (e) => {
        if(!e.target.classList.contains("btn-fila")) return;

        const id = e.target.dataset.id;
        const cuentas = ceListarCuentas();
        const cuenta = cuentas.find(c => c.id === id);
        if(!cuenta) return;

        const nuevoEstado = cuenta.estado === "Activo" ? "Inactivo" : "Activo";
        ceActualizarCuentaPorId(id, { estado: nuevoEstado });
        mostrarToast(
            nuevoEstado === "Activo" ? "Cuenta activada" : "Cuenta desactivada",
            "success"
        );
        renderPanelAdmin();
    });

    renderPanelAdmin();
}

// =========================
// VALIDACIONES - FORM DATOS
// =========================

function limpiarError(input, spanId){
    input.classList.remove("input-error");
    const span = document.getElementById(spanId);
    if(span) span.textContent = "";
}

function marcarError(input, spanId, mensaje){
    input.classList.add("input-error");
    const span = document.getElementById(spanId);
    if(span) span.textContent = mensaje;
}

function validarEmail(valor){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function validarTelefono(valor){
    if(!valor) return true; // opcional
    return /^[0-9\s()+-]{7,20}$/.test(valor);
}

formDatos.addEventListener("submit", (e) => {
    e.preventDefault();

    let valido = true;

    [ [inputNombre, "errNombre"], [inputApellido, "errApellido"],
      [inputEmail, "errEmail"], [inputTelefono, "errTelefono"] ]
    .forEach(([input, id]) => limpiarError(input, id));

    if(inputNombre.value.trim().length < 2){
        marcarError(inputNombre, "errNombre", "Ingresa un nombre válido");
        valido = false;
    }

    if(inputApellido.value.trim().length < 2){
        marcarError(inputApellido, "errApellido", "Ingresa un apellido válido");
        valido = false;
    }

    if(!validarEmail(inputEmail.value.trim())){
        marcarError(inputEmail, "errEmail", "Ingresa un correo electrónico válido");
        valido = false;
    }

    if(!validarTelefono(inputTelefono.value.trim())){
        marcarError(inputTelefono, "errTelefono", "Ingresa un teléfono válido");
        valido = false;
    }

    if(!valido) return;

    guardarUsuario({
        nombre: inputNombre.value.trim(),
        apellido: inputApellido.value.trim(),
        email: inputEmail.value.trim(),
        telefono: inputTelefono.value.trim(),
        ciudad: inputCiudad.value.trim()
    });

    pintarUsuario();
    cePintarNavAuth();

    mostrarToast("Datos actualizados correctamente", "success");
});

btnCancelarDatos.addEventListener("click", () => {
    pintarUsuario();
    [ [inputNombre, "errNombre"], [inputApellido, "errApellido"],
      [inputEmail, "errEmail"], [inputTelefono, "errTelefono"] ]
    .forEach(([input, id]) => limpiarError(input, id));
    mostrarToast("Cambios descartados");
});

// =========================
// MOSTRAR / OCULTAR CONTRASEÑA
// =========================

document.querySelectorAll(".btn-ver-pass").forEach(btn => {
    btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.target);
        if(target.type === "password"){
            target.type = "text";
            btn.textContent = "🙈";
        }else{
            target.type = "password";
            btn.textContent = "👁";
        }
    });
});

// =========================
// FUERZA DE CONTRASEÑA
// =========================

function calcularFuerza(valor){
    let puntos = 0;

    if(valor.length >= 8) puntos++;
    if(valor.length >= 12) puntos++;
    if(/[A-Z]/.test(valor)) puntos++;
    if(/[0-9]/.test(valor)) puntos++;
    if(/[^A-Za-z0-9]/.test(valor)) puntos++;

    return puntos;
}

passNueva.addEventListener("input", () => {
    const puntos = calcularFuerza(passNueva.value);
    const porcentaje = Math.min((puntos / 5) * 100, 100);

    fuerzaBarra.style.width = porcentaje + "%";

    if(passNueva.value.length === 0){
        fuerzaBarra.style.width = "0%";
        fuerzaTexto.textContent = "";
        return;
    }

    if(puntos <= 2){
        fuerzaBarra.style.background = "#ff4d4d";
        fuerzaTexto.textContent = "Débil";
        fuerzaTexto.style.color = "#ff8080";
    }else if(puntos <= 4){
        fuerzaBarra.style.background = "#ffb84d";
        fuerzaTexto.textContent = "Media";
        fuerzaTexto.style.color = "#ffcf8a";
    }else{
        fuerzaBarra.style.background = "#4dff88";
        fuerzaTexto.textContent = "Fuerte";
        fuerzaTexto.style.color = "#8affb1";
    }
});

// =========================
// FORM SEGURIDAD
// =========================

formSeguridad.addEventListener("submit", (e) => {
    e.preventDefault();

    let valido = true;

    [ [passActual, "errPassActual"], [passNueva, "errPassNueva"],
      [passConfirmar, "errPassConfirmar"] ]
    .forEach(([input, id]) => limpiarError(input, id));

    if(passActual.value !== usuarioActual.contrasena){
        marcarError(passActual, "errPassActual", "La contraseña actual no es correcta");
        valido = false;
    }

    if(passNueva.value.length < 8){
        marcarError(passNueva, "errPassNueva", "Debe tener al menos 8 caracteres");
        valido = false;
    }

    if(passConfirmar.value !== passNueva.value){
        marcarError(passConfirmar, "errPassConfirmar", "Las contraseñas no coinciden");
        valido = false;
    }

    if(!valido) return;

    guardarUsuario({ contrasena: passNueva.value });

    formSeguridad.reset();
    fuerzaBarra.style.width = "0%";
    fuerzaTexto.textContent = "";

    mostrarToast("Contraseña actualizada correctamente", "success");
});

btnCancelarPass.addEventListener("click", () => {
    formSeguridad.reset();
    fuerzaBarra.style.width = "0%";
    fuerzaTexto.textContent = "";
    [ [passActual, "errPassActual"], [passNueva, "errPassNueva"],
      [passConfirmar, "errPassConfirmar"] ]
    .forEach(([input, id]) => limpiarError(input, id));
});

// =========================
// PREFERENCIAS ADICIONALES
// =========================

function cargarPrefs(){
    const guardado = localStorage.getItem(STORAGE_PREFS);
    const prefs = guardado ? JSON.parse(guardado) : { notif: true, recordar: true };

    prefNotif.checked = prefs.notif;
    prefRecordar.checked = prefs.recordar;
}

function guardarPrefs(){
    localStorage.setItem(STORAGE_PREFS, JSON.stringify({
        notif: prefNotif.checked,
        recordar: prefRecordar.checked
    }));
}

prefNotif.addEventListener("change", () => {
    guardarPrefs();
    mostrarToast(prefNotif.checked ? "Notificaciones activadas" : "Notificaciones desactivadas");
});

prefRecordar.addEventListener("change", () => {
    guardarPrefs();
    mostrarToast(prefRecordar.checked ? "Sesión recordada en este dispositivo" : "Ya no se recordará la sesión");
});

cargarPrefs();

// =========================
// ELIMINAR CUENTA (MODAL)
// =========================

btnEliminarCuenta.addEventListener("click", () => {
    modalConfirm.hidden = false;
});

modalCancelar.addEventListener("click", () => {
    modalConfirm.hidden = true;
});

modalConfirm.addEventListener("click", (e) => {
    if(e.target === modalConfirm) modalConfirm.hidden = true;
});

modalConfirmar.addEventListener("click", () => {
    ceEliminarUsuarioActual();
    localStorage.removeItem(STORAGE_PREFS);

    modalConfirm.hidden = true;
    mostrarToast("Cuenta eliminada. Redirigiendo...", "success");

    setTimeout(() => {
        window.location.href = "/VISTAS/login.html";
    }, 1200);
});

// =========================
// CERRAR SESIÓN
// =========================

function cerrarSesion(){
    ceCerrarSesion();
    mostrarToast("Cerrando sesión...");
    setTimeout(() => {
        window.location.href = "/VISTAS/login.html";
    }, 700);
}

btnLogout.addEventListener("click", cerrarSesion);

// =========================
// TOAST (notificaciones)
// =========================

let toastTimeout;

function mostrarToast(mensaje, tipo){
    clearTimeout(toastTimeout);

    toast.textContent = mensaje;
    toast.className = "toast show";

    if(tipo === "success") toast.classList.add("toast-success");
    if(tipo === "error") toast.classList.add("toast-error");

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}