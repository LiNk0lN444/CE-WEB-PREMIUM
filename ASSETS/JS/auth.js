/* =========================================================
   AUTH.JS - Autenticación de usuarios (CE-Web Constructora)
   Persistencia local (localStorage) simulando la tabla
   "usuarios" del esquema de base de datos. Se incluye en
   TODAS las vistas (index, catalogo, login, sesion) para que
   el estado de sesión y el avatar del nav sean consistentes
   en toda la plataforma.
   ========================================================= */

const CE_USERS_KEY = "ce_usuarios";
const CE_SESSION_KEY = "ce_sesion_activa";
const CE_CURRENT_KEY = "ce_usuario_actual";

// =========================
// USUARIOS REGISTRADOS
// =========================

function ceGenerarId(){
    return "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function ceObtenerUsuarios(){
    const guardado = localStorage.getItem(CE_USERS_KEY);

    if(guardado){
        try{
            const lista = JSON.parse(guardado);
            // Si es un arreglo válido y tiene al menos un usuario, se usa tal cual.
            // Si quedó vacío o corrupto (ej: "[]" guardado por error), se reinicia
            // más abajo para volver a sembrar las cuentas de demostración.
            if(Array.isArray(lista) && lista.length > 0){
                return lista;
            }
        }catch(e){
            /* continua y reinicia la lista */
        }
    }

    // Cuentas de demostración, para poder probar los distintos
    // roles de inmediato (cliente, asesor y administrador).
    const demo = [
        {
            id: "usu_1",
            nombre: "Lincoln",
            apellido: "Castro",
            email: "lincoln.castro@ceconstructora.com",
            usuario: "lcastro",
            telefono: "3001234567",
            ciudad: "Bogotá D.C.",
            rol: "Cliente",
            estado: "Activo",
            contrasena: "Lcastro2024#"
        },
        {
            id: "ase_1",
            nombre: "Emily",
            apellido: "Mora",
            email: "emily.mora@ceconstructora.com",
            usuario: "emilym",
            telefono: "3009876543",
            ciudad: "Bogotá D.C.",
            rol: "Asesor",
            estado: "Activo",
            contrasena: "Emily2025+"
        },
        {
            id: "admi_1",
            nombre: "David",
            apellido: "Pérez",
            email: "david.perez@ceconstructora.com",
            usuario: "dperez",
            telefono: "3012223344",
            ciudad: "Bogotá D.C.",
            rol: "Administrador",
            estado: "Activo",
            contrasena: "David2026*"
        }
    ];

    localStorage.setItem(CE_USERS_KEY, JSON.stringify(demo));
    return demo;
}

function ceGuardarUsuarios(lista){
    localStorage.setItem(CE_USERS_KEY, JSON.stringify(lista));
}

// =========================
// AVATAR (por usuario)
// =========================

function ceAvatarKey(usuario){
    return "ce_avatar_" + (usuario && usuario.id ? usuario.id : "anon");
}

function ceObtenerAvatar(usuario){
    if(!usuario) return null;
    return localStorage.getItem(ceAvatarKey(usuario));
}

// =========================
// SESIÓN
// =========================

function ceObtenerSesion(){
    if(localStorage.getItem(CE_SESSION_KEY) !== "true") return null;

    const guardado = localStorage.getItem(CE_CURRENT_KEY);
    if(!guardado) return null;

    try{
        return JSON.parse(guardado);
    }catch(e){
        return null;
    }
}

function ceIniciarSesion(email, contrasena){
    const usuarios = ceObtenerUsuarios();
    const encontrado = usuarios.find(
        u => u.email.toLowerCase() === email.toLowerCase()
    );

    if(!encontrado){
        return { ok: false, motivo: "No existe una cuenta con ese correo" };
    }

    if(encontrado.contrasena !== contrasena){
        return { ok: false, motivo: "La contraseña es incorrecta" };
    }

    if(encontrado.estado === "Inactivo"){
        return { ok: false, motivo: "Tu cuenta se encuentra desactivada. Contacta a un administrador." };
    }

    localStorage.setItem(CE_CURRENT_KEY, JSON.stringify(encontrado));
    localStorage.setItem(CE_SESSION_KEY, "true");

    return { ok: true, usuario: encontrado };
}

function ceRegistrar(datos){
    const usuarios = ceObtenerUsuarios();

    const yaExiste = usuarios.some(
        u => u.email.toLowerCase() === datos.email.toLowerCase()
    );

    if(yaExiste){
        return { ok: false, motivo: "Ya existe una cuenta con ese correo" };
    }

    const nuevoUsuario = {
        id: ceGenerarId(),
        nombre: datos.nombre || "",
        apellido: datos.apellido || "",
        email: datos.email,
        usuario: datos.usuario || "",
        telefono: datos.telefono || "",
        ciudad: datos.ciudad || "",
        rol: "Cliente",
        estado: "Activo",
        contrasena: datos.contrasena
    };

    usuarios.push(nuevoUsuario);
    ceGuardarUsuarios(usuarios);

    localStorage.setItem(CE_CURRENT_KEY, JSON.stringify(nuevoUsuario));
    localStorage.setItem(CE_SESSION_KEY, "true");

    return { ok: true, usuario: nuevoUsuario };
}

function ceActualizarUsuarioActual(cambios){
    const actual = ceObtenerSesion();
    if(!actual) return null;

    const actualizado = { ...actual, ...cambios };
    localStorage.setItem(CE_CURRENT_KEY, JSON.stringify(actualizado));

    const usuarios = ceObtenerUsuarios();
    const idx = usuarios.findIndex(u => u.id === actualizado.id);
    if(idx !== -1){
        usuarios[idx] = actualizado;
        ceGuardarUsuarios(usuarios);
    }

    return actualizado;
}

function ceEliminarUsuarioActual(){
    const actual = ceObtenerSesion();

    if(actual){
        const usuarios = ceObtenerUsuarios().filter(u => u.id !== actual.id);
        ceGuardarUsuarios(usuarios);
        localStorage.removeItem(ceAvatarKey(actual));
    }

    localStorage.removeItem(CE_CURRENT_KEY);
    localStorage.removeItem(CE_SESSION_KEY);
}

function ceCerrarSesion(){
    localStorage.removeItem(CE_SESSION_KEY);
}

function ceIniciales(nombre, apellido){
    const n = (nombre || "").trim().charAt(0);
    const a = (apellido || "").trim().charAt(0);
    return ((n + a) || "US").toUpperCase();
}

// =========================
// ROLES Y PERMISOS
// =========================

function ceEsAdministrador(usuario){
    return !!usuario && usuario.rol === "Administrador";
}

function ceEsAsesorOAdministrador(usuario){
    return !!usuario && (usuario.rol === "Asesor" || usuario.rol === "Administrador");
}

// =========================
// GESTIÓN DE CUENTAS (solo Administrador)
// =========================

function ceListarCuentas(){
    return ceObtenerUsuarios().map(u => ({
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        telefono: u.telefono,
        rol: u.rol,
        estado: u.estado
    }));
}

function ceActualizarCuentaPorId(id, cambios){
    const usuarios = ceObtenerUsuarios();
    const idx = usuarios.findIndex(u => u.id === id);
    if(idx === -1) return null;

    usuarios[idx] = { ...usuarios[idx], ...cambios };
    ceGuardarUsuarios(usuarios);

    // Si la cuenta editada es la que tiene la sesión activa, se refresca.
    const actual = ceObtenerSesion();
    if(actual && actual.id === id){
        localStorage.setItem(CE_CURRENT_KEY, JSON.stringify(usuarios[idx]));
    }

    return usuarios[idx];
}

// =========================
// AVATAR / SESIÓN EN EL NAV
// (se pinta automáticamente en cualquier vista que tenga
//  un contenedor con id="navAuth" en su barra de navegación)
// =========================

function cePintarNavAuth(){
    const contenedor = document.getElementById("navAuth");
    if(!contenedor) return;

    const usuario = ceObtenerSesion();

    if(!usuario){
        contenedor.innerHTML =
            '<a href="/VISTAS/login.html" class="login-btn">Iniciar Sesión</a>';
        return;
    }

    const avatar = ceObtenerAvatar(usuario);
    const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.trim();

    contenedor.innerHTML = `
        <a href="/VISTAS/sesion.html" class="nav-avatar" title="${nombreCompleto}">
            ${avatar
                ? `<img src="${avatar}" alt="Foto de perfil">`
                : `<span>${ceIniciales(usuario.nombre, usuario.apellido)}</span>`
            }
        </a>
        <button type="button" id="btnLogoutNav" class="login-btn">Cerrar Sesión</button>
    `;

    document.getElementById("btnLogoutNav").addEventListener("click", () => {
        ceCerrarSesion();
        window.location.href = "/index.html";
    });
}

document.addEventListener("DOMContentLoaded", cePintarNavAuth);