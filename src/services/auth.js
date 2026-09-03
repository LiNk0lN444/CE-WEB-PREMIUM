// Ajusta la URL base según el puerto en el que corra tu backend (por ejemplo, FastAPI suele correr en el 8000)
const API_URL = 'http://localhost:8000'; 

// --- SERVICIOS DE INVENTARIO ---
export async function obtenerInventario(tipo) {
    try {
        const response = await fetch(`${API_URL}/inventario/${tipo}`);
        return await response.json();
    } catch (error) {
        console.error("Error al obtener inventario:", error);
        return [];
    }
}

export async function guardarItemInventario(tipo, datos) {
    try {
        const response = await fetch(`${API_URL}/inventario/${tipo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        return await response.json();
    } catch (error) {
        console.error("Error al guardar ítem:", error);
    }
}

// --- SERVICIOS DE COTIZACIONES ---
export async function guardarCotizacion(datosCotizacion) {
    try {
        const response = await fetch(`${API_URL}/cotizaciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosCotizacion)
        });
        return await response.json();
    } catch (error) {
        console.error("Error al guardar cotización:", error);
    }
}