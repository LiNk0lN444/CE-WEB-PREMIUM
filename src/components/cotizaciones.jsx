import React, { useState, useEffect } from 'react';
import '../assests/css/cotizaciones.css';
import { crearReserva, obtenerMisReservas } from '../services/api';

const ITEMS_DISPONIBLES = [
  { id: 1, tipo: 'maquinaria', nombre: 'Cargador Frontal 966', precio: 2500000 },
  { id: 2, tipo: 'herramienta', nombre: 'Pulidora Industrial', precio: 150000 },
  { id: 3, tipo: 'maquinaria', nombre: 'Excavadora Hidráulica', precio: 3800000 },
  { id: 4, tipo: 'herramienta', nombre: 'Rotomartillo SDS', precio: 180000 },
];

const OPCIONES_MESES = [1, 2, 3, 6, 12];

export default function Cotizaciones({ darkMode, onNavigateLogin }) {
  const [tabActiva, setTabActiva] = useState('nueva');

  const usuarioSesion = JSON.parse(localStorage.getItem('usuario_sesion')) || null;

  // Carrito de la reserva
  const [carrito, setCarrito] = useState([]);

  // Selector
  const [tipoSeleccionado, setTipoSeleccionado] = useState('maquinaria');
  const [itemSeleccionadoId, setItemSeleccionadoId] = useState('');
  const [cantidadInput, setCantidadInput] = useState(1);

  // Fechas y duración
  const hoy = new Date().toISOString().split('T')[0];
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [meses, setMeses] = useState(1);

  // Observaciones y error
  const [observaciones, setObservaciones] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Mis reservas
  const [misReservas, setMisReservas] = useState([]);
  const [cargandoReservas, setCargandoReservas] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const mostrarToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  // Sincronizar selector
  useEffect(() => {
    const filtrados = ITEMS_DISPONIBLES.filter((i) => i.tipo === tipoSeleccionado);
    setItemSeleccionadoId(filtrados.length > 0 ? filtrados[0].id : '');
  }, [tipoSeleccionado]);

  // Cargar reservas del usuario
  useEffect(() => {
    if (tabActiva === 'listado' && usuarioSesion?.user_id) {
      cargarMisReservas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabActiva, usuarioSesion?.user_id]);

  async function cargarMisReservas() {
    try {
      setCargandoReservas(true);
      const data = await obtenerMisReservas(usuarioSesion.user_id);
      setMisReservas(data);
    } catch {
      // silencio
    } finally {
      setCargandoReservas(false);
    }
  }

  // Agregar ítem al carrito local
  const handleAgregarItem = () => {
    setErrorMsg('');
    const itemEncontrado = ITEMS_DISPONIBLES.find(
      (i) => i.id === parseInt(itemSeleccionadoId)
    );

    if (!itemEncontrado) {
      setErrorMsg('Selecciona un ítem válido.');
      return;
    }

    if (parseInt(cantidadInput) < 1) {
      setErrorMsg('La cantidad mínima es 1.');
      return;
    }

    const nuevoItem = {
      id: Date.now(),
      tipo: itemEncontrado.tipo,
      nombre: itemEncontrado.nombre,
      product_id: itemEncontrado.id,
      cantidad: parseInt(cantidadInput) || 1,
      precioMensual: itemEncontrado.precio,
    };

    setCarrito([...carrito, nuevoItem]);
    setCantidadInput(1);
  };

  const handleEliminarItem = (idItem) => {
    setCarrito(carrito.filter((item) => item.id !== idItem));
  };

  // Cálculo visual de totales
  const subtotal = carrito.reduce(
    (acc, item) => acc + item.cantidad * meses * item.precioMensual,
    0
  );
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  const formatoMoneda = (val) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);

  const formatoFecha = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Guardar la reserva
  const handleGuardarReserva = async () => {
    setErrorMsg('');

    if (carrito.length === 0) {
      setErrorMsg('Debes agregar al menos un ítem a la reserva.');
      return;
    }

    if (!usuarioSesion) {
      setErrorMsg('Para reservar debes iniciar sesión.');
      setTimeout(() => onNavigateLogin && onNavigateLogin(), 1500);
      return;
    }

    if (!usuarioSesion.user_id) {
      setErrorMsg('No se pudo identificar el usuario. Inicia sesión nuevamente.');
      return;
    }

    if (meses < 1) {
      setErrorMsg('La reserva mínima es de 1 mes.');
      return;
    }

    try {
      const payload = {
        user_id: usuarioSesion.user_id,
        start_date: fechaInicio,
        months: meses,
        observations: observaciones,
        items: carrito.map((it) => ({
          product_id: it.product_id,
          quantity: it.cantidad,
        })),
      };

      const respuesta = await crearReserva(payload);

      mostrarToast(
        `Reserva COT-${respuesta.cotizacion_id} creada. Espera aprobación. ⏳`
      );

      handleLimpiarTodo();
      setTabActiva('listado');
    } catch (err) {
      setErrorMsg(err.message || 'No fue posible crear la reserva.');
    }
  };

  const handleLimpiarTodo = () => {
    setCarrito([]);
    setObservaciones('');
    setErrorMsg('');
  };

  return (
    <div className={`cotizaciones-page ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <main className="cot-main">
        <div className="cot-titulo">
          <h1>Reservas</h1>
          <p>Reserva maquinaria y herramientas por meses. Requiere aprobación del administrador.</p>
        </div>

        <div className="cot-container">
          <nav className="cot-tabs">
            <button
              className={`cot-tab-btn ${tabActiva === 'nueva' ? 'active' : ''}`}
              type="button"
              onClick={() => setTabActiva('nueva')}
            >
              🧾 Nueva reserva {carrito.length > 0 && `(${carrito.length})`}
            </button>
            <button
              className={`cot-tab-btn ${tabActiva === 'listado' ? 'active' : ''}`}
              type="button"
              onClick={() => setTabActiva('listado')}
            >
              📋 Mis reservas
            </button>
          </nav>

          {/* ═══════════════════════════════════════
              TAB NUEVA RESERVA
          ═══════════════════════════════════════ */}
          {tabActiva === 'nueva' && (
            <section className="cot-tab-panel active">
              <div className="cot-bloque">
                <h2>Información de Cuenta</h2>
                {usuarioSesion ? (
                  <p style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                    Sesión activa: {usuarioSesion.username || usuarioSesion.email}
                  </p>
                ) : (
                  <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    ⚠️ No has iniciado sesión. Puedes armar tu reserva, pero deberás autenticarte para guardarla.
                  </p>
                )}
              </div>

              {/* Fechas y duración */}
              <div className="cot-bloque">
                <h2>Fechas y Duración</h2>
                <div className="cot-selector-grid">
                  <div className="cot-form-group">
                    <label htmlFor="fechaInicio">📅 Fecha de inicio</label>
                    <input
                      id="fechaInicio"
                      type="date"
                      value={fechaInicio}
                      min={hoy}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>

                  <div className="cot-form-group">
                    <label htmlFor="meses">⏱️ Duración (meses)</label>
                    <select
                      id="meses"
                      value={meses}
                      onChange={(e) => setMeses(parseInt(e.target.value))}
                    >
                      {OPCIONES_MESES.map((m) => (
                        <option key={m} value={m}>
                          {m} {m === 1 ? 'mes' : 'meses'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#888', marginTop: '8px' }}>
                  La reserva mínima es de 1 mes. El administrador deberá aprobarla.
                </p>
              </div>

              {/* Agregar ítems */}
              <div className="cot-bloque">
                <h2>Agregar ítems</h2>
                <div className="cot-selector-grid">
                  <div className="cot-form-group">
                    <label htmlFor="itemTipo">Tipo</label>
                    <select
                      id="itemTipo"
                      value={tipoSeleccionado}
                      onChange={(e) => setTipoSeleccionado(e.target.value)}
                    >
                      <option value="maquinaria">🚜 Maquinaria</option>
                      <option value="herramienta">🛠️ Herramienta</option>
                    </select>
                  </div>

                  <div className="cot-form-group cot-form-group-full">
                    <label htmlFor="itemSelect">Ítem</label>
                    <select
                      id="itemSelect"
                      value={itemSeleccionadoId}
                      onChange={(e) => setItemSeleccionadoId(e.target.value)}
                    >
                      {ITEMS_DISPONIBLES.filter((i) => i.tipo === tipoSeleccionado).map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nombre} — {formatoMoneda(i.precio)}/mes
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cot-form-group">
                    <label htmlFor="itemCantidad">Cantidad</label>
                    <input
                      type="number"
                      id="itemCantidad"
                      min="1"
                      value={cantidadInput}
                      onChange={(e) => setCantidadInput(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="cot-btn"
                    onClick={handleAgregarItem}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              {/* Tabla de ítems */}
              <div className="cot-bloque">
                <h2>Ítems de la reserva</h2>
                <div className="cot-lista-wrap">
                  <table className="cot-tabla">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Ítem</th>
                        <th>Cant.</th>
                        <th>Meses</th>
                        <th>Precio/mes</th>
                        <th>Subtotal</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {carrito.map((item) => (
                        <tr key={item.id}>
                          <td style={{ textTransform: 'capitalize' }}>{item.tipo}</td>
                          <td><strong>{item.nombre}</strong></td>
                          <td>{item.cantidad}</td>
                          <td>{meses}</td>
                          <td>{formatoMoneda(item.precioMensual)}</td>
                          <td>
                            <strong>
                              {formatoMoneda(item.cantidad * meses * item.precioMensual)}
                            </strong>
                          </td>
                          <td>
                            <button
                              type="button"
                              style={{
                                color: '#c62828',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                              }}
                              onClick={() => handleEliminarItem(item.id)}
                            >
                              ✕ Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {carrito.length === 0 && (
                    <p className="cot-vacio" style={{ padding: '1.5rem', textAlign: 'center' }}>
                      No hay ítems agregados.
                    </p>
                  )}
                </div>

                {/* Totales */}
                <div className="cot-totales" style={{ marginTop: '1.5rem' }}>
                  <div className="cot-totales-fila">
                    <span>Subtotal</span>
                    <span>{formatoMoneda(subtotal)}</span>
                  </div>
                  <div className="cot-totales-fila">
                    <span>IVA (19%)</span>
                    <span>{formatoMoneda(iva)}</span>
                  </div>
                  <div
                    className="cot-totales-fila cot-total-final"
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      borderTop: '2px solid #ccc',
                      paddingTop: '8px',
                    }}
                  >
                    <span>Total</span>
                    <span style={{ color: '#2e7d32' }}>{formatoMoneda(total)}</span>
                  </div>
                </div>
              </div>

              {/* Observaciones y botones */}
              <div className="cot-bloque">
                <h2>Observaciones</h2>
                <div className="cot-form-grid">
                  <div className="cot-form-group cot-form-group-full">
                    <label htmlFor="cotObservaciones">Notas adicionales (opcional)</label>
                    <textarea
                      id="cotObservaciones"
                      rows="3"
                      placeholder="Condiciones especiales, tiempos de entrega, etc."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                {errorMsg && (
                  <p style={{ color: '#ff5252', marginTop: '10px', fontWeight: 'bold' }}>
                    {errorMsg}
                  </p>
                )}

                <div className="cot-form-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                  <button type="button" className="cot-btn" onClick={handleGuardarReserva}>
                    📅 Solicitar reserva
                  </button>
                  <button type="button" className="cot-btn-secundario" onClick={handleLimpiarTodo}>
                    🗑️ Limpiar todo
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════
              TAB MIS RESERVAS
          ═══════════════════════════════════════ */}
          {tabActiva === 'listado' && (
            <section className="cot-tab-panel active">
              <div className="cot-bloque">
                <h2>Mis Reservas</h2>

                {cargandoReservas && <p>Cargando reservas...</p>}

                {!cargandoReservas && misReservas.length === 0 && (
                  <p className="cot-vacio" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    No tienes reservas registradas.
                  </p>
                )}

                {!cargandoReservas && misReservas.length > 0 && (
                  <div className="cot-lista-wrap">
                    <table className="cot-tabla">
                      <thead>
                        <tr>
                          <th>Número</th>
                          <th>Inicio</th>
                          <th>Fin</th>
                          <th>Meses</th>
                          <th>Total</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {misReservas.map((r) => (
                          <tr key={r.cotizacion_id}>
                            <td><strong>COT-{r.cotizacion_id}</strong></td>
                            <td>{formatoFecha(r.start_date)}</td>
                            <td>{formatoFecha(r.end_date)}</td>
                            <td>{r.months || '—'}</td>
                            <td><strong>{formatoMoneda(r.total_price)}</strong></td>
                            <td>
                              <EstadoBadge estado={r.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {toast && (
        <div className={`toast-notificacion toast-${toast.tipo}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ==========================================
// Componente auxiliar: Badge de estado
// ==========================================
function EstadoBadge({ estado }) {
  const colores = {
    pending: { bg: '#fff3cd', color: '#856404', label: 'PENDIENTE' },
    approved: { bg: '#d1ecf1', color: '#0c5460', label: 'APROBADA' },
    rejected: { bg: '#f8d7da', color: '#721c24', label: 'RECHAZADA' },
    active: { bg: '#d4edda', color: '#155724', label: 'ACTIVA' },
    completed: { bg: '#e2e3e5', color: '#383d41', label: 'COMPLETADA' },
    cancelled: { bg: '#e2e3e5', color: '#6c757d', label: 'CANCELADA' },
  };
  const c = colores[estado] || colores.pending;
  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: '4px',
        backgroundColor: c.bg,
        color: c.color,
        fontWeight: 'bold',
        fontSize: '12px',
      }}
    >
      {c.label}
    </span>
  );
}