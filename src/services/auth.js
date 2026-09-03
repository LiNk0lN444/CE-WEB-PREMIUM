const API_URL = "http://localhost:3000/api";

export async function ceIniciarSesion(email, contrasena) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password: contrasena })
        });
        
        const data = await response.json();
        if (data.ok) {
            localStorage.setItem("ce_sesion_activa", "true");
            localStorage.setItem("ce_usuario_actual", JSON.stringify(data.usuario));
        }
        return data;
    } catch (error) {
        return { ok: false, motivo: "No se pudo conectar con el servidor" };
    }
}

export async function ceRegistrar(datos) {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: datos.usuario,
                email: datos.email,
                password: datos.contrasena,
                phone_number: datos.telefono
            })
        });

        const data = await response.json();
        if (data.ok) {
            localStorage.setItem("ce_sesion_activa", "true");
            localStorage.setItem("ce_usuario_actual", JSON.stringify(data.usuario));
        }
        return data;
    } catch (error) {
        return { ok: false, motivo: "Error de conexión en el registro" };
    }
}

export function ceObtenerSesion() {
    if (localStorage.getItem("ce_sesion_activa") !== "true") return null;
    const guardado = localStorage.getItem("ce_usuario_actual");
    return guardado ? JSON.parse(guardado) : null;
}

export function ceCerrarSesion() {
    localStorage.removeItem("ce_sesion_activa");
    localStorage.removeItem("ce_usuario_actual");
}

export function ceEsAdministrador(usuario) {
    return usuario && usuario.rol === "Administrador";
}

export function ceObtenerAvatar(usuario) {
    if (!usuario) return null;
    return localStorage.getItem("ce_avatar_" + usuario.user_id);
}

export function ceAvatarKey(usuario) {
    return "ce_avatar_" + (usuario?.user_id || "anon");
}