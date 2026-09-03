const API_URL = 'http://localhost:8000'; // URL de tu backend en FastAPI

// Obtener todas las herramientas
export async function obtenerHerramientas() {
    try {
        const response = await fetch(`${API_URL}/herramientas/`); // Ajusta la ruta exacta según tu router de FastAPI
        if (!response.ok) {
            throw new Error('Error al obtener las herramientas');
        }
        return await response.json();
    } catch (error) {
        console.error("Error:", error);
        return [];
    }
}

// Guardar una nueva herramienta
export async function crearHerramienta(datosHerramienta) {
    try {
        const response = await fetch(`${API_URL}/herramientas/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosHerramient)
        });
        return await response.json();
    } catch (error) {
        console.error("Error al crear herramienta:", error);
    }
}