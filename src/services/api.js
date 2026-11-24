// ==========================================
// CONFIGURACIÓN DE LA API (Vite)
// ==========================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

if (!API_URL && import.meta.env.DEV) {
  console.info(
    '[CE-Web] VITE_API_URL no está definida. ' +
    'Crea un archivo .env.local en la raíz del proyecto.'
  );
}

// ==========================================
// SESIÓN (token JWT guardado al iniciar sesión)
// ==========================================
function getToken() {
  try {
    return JSON.parse(localStorage.getItem('usuario_sesion'))?.access_token || null;
  } catch {
    return null;
  }
}

// Si el backend responde 401 con un token guardado, la sesión venció o dejó de ser válida:
// se limpia y se avisa a la app (app.jsx escucha este evento y cierra la sesión).
function sesionExpirada() {
  localStorage.removeItem('usuario_sesion');
  window.dispatchEvent(new Event('ce-session-expired'));
}

async function leerError(response) {
  let mensaje = 'No fue posible completar la solicitud.';
  try {
    const errorData = await response.json();
    if (typeof errorData.detail === 'string') {
      mensaje = errorData.detail;
    } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
      mensaje = errorData.detail[0].msg; // errores de validación (422)
    }
  } catch {
    // Respuesta sin JSON
  }
  return mensaje;
}

// ==========================================
// FUNCIÓN GENERAL PARA PETICIONES
// ==========================================
async function request(endpoint, options = {}) {
  try {
    const { headers: extraHeaders, ...rest } = options;
    const token = getToken();

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extraHeaders,
      },
    });

    if (!response.ok) {
      if (response.status === 401 && token && endpoint !== '/auth/login') {
        sesionExpirada();
      }
      throw new Error(await leerError(response));
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (err) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error('No hay conexión con el servicio. Verifica tu red e intenta de nuevo.');
    }
    throw err;
  }
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
  return request('/products/', { method: 'POST', body: JSON.stringify(datos) });
}

export async function actualizarProducto(productId, datos) {
  return request(`/products/${productId}`, { method: 'PUT', body: JSON.stringify(datos) });
}

export async function eliminarProducto(productId) {
  return request(`/products/${productId}`, { method: 'DELETE' });
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
  return request('/inventory/', { method: 'POST', body: JSON.stringify(datos) });
}

export async function actualizarItemInventario(inventoryId, datos) {
  return request(`/inventory/${inventoryId}`, { method: 'PUT', body: JSON.stringify(datos) });
}

export async function eliminarItemInventario(inventoryId) {
  return request(`/inventory/${inventoryId}`, { method: 'DELETE' });
}

// ==========================================
// INVENTORY MOVEMENTS
// ==========================================
export async function obtenerMovimientos() {
  return request('/inventory-movements/');
}

export async function crearMovimiento(datos) {
  return request('/inventory-movements/', { method: 'POST', body: JSON.stringify(datos) });
}

// ==========================================
// USERS
// ==========================================
// Registro público (siempre crea un cliente)
export async function crearUsuario(datos) {
  return request('/users/', { method: 'POST', body: JSON.stringify(datos) });
}

// ==========================================
// ADMIN — GESTIÓN DE USUARIOS (solo admin; los admins nunca vienen en la lista)
// ==========================================
export async function adminListarUsuarios() {
  return request('/admin/users/');
}

export async function adminCrearUsuario(datos) {
  return request('/admin/users/', { method: 'POST', body: JSON.stringify(datos) });
}

export async function adminActualizarUsuario(userId, datos) {
  return request(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(datos) });
}

export async function adminEliminarUsuario(userId) {
  return request(`/admin/users/${userId}`, { method: 'DELETE' });
}

// ==========================================
// ADMIN — REPORTES DE VENTAS
// ==========================================
export async function obtenerReporteVentas(year, month) {
  return request(`/admin/reportes/ventas-mensuales?year=${year}&month=${month}`);
}

// Descarga el reporte (xlsx | pdf). Usa fetch directo porque la respuesta es un archivo.
export async function descargarReporteVentas(year, month, formato) {
  const token = getToken();
  const response = await fetch(
    `${API_URL}/admin/reportes/ventas-mensuales/export?formato=${formato}&year=${year}&month=${month}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );

  if (!response.ok) {
    if (response.status === 401 && token) sesionExpirada();
    throw new Error(await leerError(response));
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_ventas_${year}-${String(month).padStart(2, '0')}.${formato}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ==========================================
// AUTH  👈 NUEVO
// ==========================================
export async function login(credenciales) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credenciales),
  });
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
  return request('/cotizaciones/', { method: 'POST', body: JSON.stringify(datos) });
}

export async function actualizarCotizacion(cotizacionId, datos) {
  return request(`/cotizaciones/${cotizacionId}`, { method: 'PUT', body: JSON.stringify(datos) });
}

export async function eliminarCotizacion(cotizacionId) {
  return request(`/cotizaciones/${cotizacionId}`, { method: 'DELETE' });
}

// ==========================================
// DETALLE COTIZACIONES
// ==========================================
export async function obtenerDetallesCotizacion() {
  return request('/detalle-cotizaciones/');
}

export async function crearDetalleCotizacion(datos) {
  return request('/detalle-cotizaciones/', { method: 'POST', body: JSON.stringify(datos) });
}

export async function eliminarDetalleCotizacion(detalleId) {
  return request(`/detalle-cotizaciones/${detalleId}`, { method: 'DELETE' });
}

// ==========================================
// RESERVAS
// ==========================================
export async function crearReserva(datos) {
  return request('/reservas/', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function obtenerReservasPendientes() {
  return request('/reservas/pendientes');
}

export async function obtenerMisReservas(userId) {
  return request(`/reservas/mis-reservas/${userId}`);
}

export async function obtenerReservasPorVencer() {
  return request('/reservas/por-vencer');
}

export async function aprobarReserva(cotizacionId, adminId) {
  return request(`/reservas/${cotizacionId}/aprobar`, {
    method: 'POST',
    body: JSON.stringify({ admin_id: adminId }),
  });
}

export async function rechazarReserva(cotizacionId, adminId, motivo) {
  return request(`/reservas/${cotizacionId}/rechazar`, {
    method: 'POST',
    body: JSON.stringify({ admin_id: adminId, motivo }),
  });
}

export async function consultarDisponibilidad(productId, startDate, endDate) {
  return request(
    `/reservas/disponibilidad/${productId}?start_date=${startDate}&end_date=${endDate}`
  );
}

export async function marcarNotificada(cotizacionId) {
  return request(`/reservas/${cotizacionId}/marcar-notificada`, {
    method: 'POST',
  });
}

// ==========================================
// ASESORES
// ==========================================
export async function obtenerAsesores() {
  return request('/asesores/');
}

export async function obtenerAsesor(asesorId) {
  return request(`/asesores/${asesorId}`);
}

export async function crearAsesor(datos) {
  return request('/asesores/', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function desactivarAsesor(asesorId) {
  return request(`/asesores/${asesorId}`, { method: 'DELETE' });
}

// Horarios
export async function obtenerHorariosAsesor(asesorId) {
  return request(`/asesores/${asesorId}/horarios`);
}

export async function crearHorarioAsesor(asesorId, datos) {
  return request(`/asesores/${asesorId}/horarios`, {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function eliminarHorarioAsesor(horarioId) {
  return request(`/asesores/horarios/${horarioId}`, { method: 'DELETE' });
}

// Contratos
export async function obtenerContratosAsesor(asesorId) {
  return request(`/asesores/${asesorId}/contratos`);
}

export async function crearContratoAsesor(asesorId, datos) {
  return request(`/asesores/${asesorId}/contratos`, {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

// Disponibilidad
export async function verificarDisponibilidadAsesor(userId) {
  return request(`/asesores/disponibilidad/${userId}`);
}

// Citas (panel del asesor)
export async function obtenerMisCitas(userId) {
  return request(`/asesores/mis-citas/${userId}`);
}

export async function actualizarEstadoCita(slotId, datos) {
  return request(`/asesores/citas/${slotId}/estado`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
}

export async function obtenerReservasEnCurso() {
  return request('/reservas/en-curso');
}