const API_URL = 'http://127.0.0.1:8000';

// ==========================================
// FUNCIÓN GENERAL PARA PETICIONES
// ==========================================

async function request(endpoint, options = {}) {
const response = await fetch(`${API_URL}${endpoint}`, {
headers: {
'Content-Type': 'application/json',
...options.headers,
},
...options,
});

if (!response.ok) {
let errorMessage = 'Error en la comunicación con el servidor';


try {
  const errorData = await response.json();
  errorMessage = errorData.detail || errorMessage;
} catch {
  // Si la respuesta no viene en JSON
}

throw new Error(errorMessage);


}

// Para respuestas sin contenido
if (response.status === 204) {
return null;
}

return response.json();
}

// ==========================================
// PRODUCTS
// ==========================================

export async function obtenerProductos() {
return request('/products/');
}

export async function obtenerProducto(productId) {
return request(`/products/${productId}`);
}

export async function crearProducto(datos) {
return request('/products/', {
method: 'POST',
body: JSON.stringify(datos),
});
}

export async function actualizarProducto(productId, datos) {
return request(`/products/${productId}`, {
method: 'PUT',
body: JSON.stringify(datos),
});
}

export async function eliminarProducto(productId) {
return request(`/products/${productId}`, {
method: 'DELETE',
});
}

// ==========================================
// INVENTORY
// ==========================================

export async function obtenerInventario() {
return request('/inventory/');
}

export async function obtenerItemInventario(inventoryId) {
return request(`/inventory/${inventoryId}`);
}

export async function crearItemInventario(datos) {
return request('/inventory/', {
method: 'POST',
body: JSON.stringify(datos),
});
}

export async function actualizarItemInventario(inventoryId, datos) {
return request(`/inventory/${inventoryId}`, {
method: 'PUT',
body: JSON.stringify(datos),
});
}

export async function eliminarItemInventario(inventoryId) {
return request(`/inventory/${inventoryId}`, {
method: 'DELETE',
});
}

// ==========================================
// INVENTORY MOVEMENTS
// ==========================================

export async function obtenerMovimientos() {
return request('/inventory-movements/');
}

export async function crearMovimiento(datos) {
return request('/inventory-movements/', {
method: 'POST',
body: JSON.stringify(datos),
});
}

// ==========================================
// USERS
// ==========================================

export async function obtenerUsuarios() {
return request('/users/');
}

export async function obtenerUsuario(userId) {
return request(`/users/${userId}`);
}

// ==========================================
// COTIZACIONES
// ==========================================

export async function obtenerCotizaciones() {
return request('/cotizaciones/');
}

export async function obtenerCotizacion(cotizacionId) {
return request(`/cotizaciones/${cotizacionId}`);
}

export async function crearCotizacion(datos) {
return request('/cotizaciones/', {
method: 'POST',
body: JSON.stringify(datos),
});
}

export async function actualizarCotizacion(cotizacionId, datos) {
return request(`/cotizaciones/${cotizacionId}`, {
method: 'PUT',
body: JSON.stringify(datos),
});
}

export async function eliminarCotizacion(cotizacionId) {
return request(`/cotizaciones/${cotizacionId}`, {
method: 'DELETE',
});
}

// ==========================================
// DETALLE COTIZACIONES
// ==========================================

export async function obtenerDetallesCotizacion() {
return request('/detalle-cotizaciones/');
}

export async function crearDetalleCotizacion(datos) {
return request('/detalle-cotizaciones/', {
method: 'POST',
body: JSON.stringify(datos),
});
}

export async function eliminarDetalleCotizacion(detalleId) {
return request(`/detalle-cotizaciones/${detalleId}`, {
method: 'DELETE',
});
}
