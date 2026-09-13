import React, { useState, useEffect } from 'react';
import '../assests/css/cotizaciones.css';
import { crearCotizacion } from '../services/api';

const ITEMS_DISPONIBLES = [
  { id: 1, tipo: 'maquinaria', nombre: 'Cargador Frontal 966', precio: 2500000 },
  { id: 2, tipo: 'herramienta', nombre: 'Pulidora Industrial', precio: 150000 },
  { id: 3, tipo: 'maquinaria', nombre: 'Excavadora Hidráulica', precio: 3800000 },
  { id: 4, tipo: 'herramienta', nombre: 'Rotomartillo SDS', precio: 180000 }
];

export default function Cotizaciones({ darkMode, onNavigateLogin }) {
  const [tabActiva, setTabActiva] = useState('nueva');

  // Obtener sesión activa del usuario
  const usuarioSesion = JSON.parse(localStorage.getItem('usuario_sesion')) || null;

  // Carrito / Ítems de la cotización actual
  const [carrito, setCarrito] = useState([]);

  // Selector manual de ítems
  const [tipoSeleccionado, setTipoSeleccionado] = useState('maquinaria');
  const [itemSeleccionadoId, setItemSeleccionadoId] = useState('');
  const [cantidadInput, setCantidadInput] = useState(1);
  const [mesesInput, setMesesInput] = useState(1);

  // Observaciones, Mensajes de error y Notificación flotante (Toast)
  const [observaciones, setObservaciones] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [mensajeCotizacion, setMensajeCotizacion] = useState(null);

  // Historial de cotizaciones
  const [historialCotizaciones, setHistorialCotizaciones] = useState(() => {
    const guardadas = localStorage.getItem('historial_cotizaciones');
    return guardadas ? JSON.parse(guardadas) : [];
  });

  // Cargar productos transferidos desde el Catálogo
  useEffect(() => {
    const cargadosDelCatalogo = localStorage.getItem('carrito_cotizacion');
    if (cargadosDelCatalogo) {
      const items = JSON.parse(cargadosDelCatalogo);
      if (items.length > 0) {
        const formateados = items.map((item) => ({
          id: item.product_id || Date.now() + Math.random(),
          tipo: item.type || 'General',
          nombre: item.name,
          cantidad: item.cantidad || 1,
          meses: 1,
          valorUnitario: item.precio || 2500000
        }));
        setCarrito(formateados);
      }
    }
  }, []);

  // Sincronizar selector
  useEffect(() => {
    const filtrados = ITEMS_DISPONIBLES.filter((i) => i.tipo === tipoSeleccionado);
    setItemSeleccionadoId(filtrados.length > 0 ? filtrados[0].id : '');
  }, [tipoSeleccionado]);

  // Persistir historial
  useEffect(() => {
    localStorage.setItem('historial_cotizaciones', JSON.stringify(historialCotizaciones));
  }, [historialCotizaciones]);

  const handleAgregarItem = () => {
    setErrorMsg('');
    const itemEncontrado = ITEMS_DISPONIBLES.find(
      (i) => i.id === parseInt(itemSeleccionadoId)
    );

    if (!itemEncontrado) {
      setErrorMsg('Selecciona un ítem válido.');
      return;
    }

    const nuevoItem = {
      id: Date.now(),
      tipo: itemEncontrado.tipo,
      nombre: itemEncontrado.nombre,
      cantidad: parseInt(cantidadInput) || 1,
      meses: parseInt(mesesInput) || 1,
      valorUnitario: itemEncontrado.precio
    };

    setCarrito([...carrito, nuevoItem]);
  };

  const handleEliminarItem = (idItem) => {
    const nuevoCarrito = carrito.filter((item) => item.id !== idItem);
    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito_cotizacion', JSON.stringify(nuevoCarrito));
  };

  // Cálculos de totales
  const subtotal = carrito.reduce(
    (acc, item) => acc + item.cantidad * item.meses * item.valorUnitario,
    0
  );
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  const formatoMoneda = (val) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  // GUARDAR COTIZACIÓN CON CONTROL DE SESIÓN
  const handleGuardarCotizacion = async () => {
    setErrorMsg('');

    if (carrito.length === 0) {
      setErrorMsg('Debes agregar al menos un ítem a la cotización.');
      return;
    }

    // Verificar sesión
    if (!usuarioSesion) {
      alert('Para guardar y procesar tu cotización debes iniciar sesión o registrarte.');

      if (onNavigateLogin) {
        onNavigateLogin();
      }

      return;
    }

    // Verificar que tengamos el ID del usuario
    if (!usuarioSesion.user_id) {
      setErrorMsg('No se pudo identificar el usuario. Inicia sesión nuevamente.');
      return;
    }

    try {
      // Enviar cotización al backend
      const cotizacionGuardada = await crearCotizacion({
        user_id: usuarioSesion.user_id,
        iva: iva,
        total_price: total,
        status: 'pending',
        observations: observaciones
      });

      // Crear información para mostrar en el historial
      const nuevaCotizacion = {
        numero: `COT-${cotizacionGuardada.cotizacion_id}`,
        fecha: new Date().toLocaleDateString('es-CO'),
        cliente: {
          nombre: usuarioSesion.username || usuarioSesion.nombre || 'Usuario Registrado',
          correo: usuarioSesion.email || usuarioSesion.correo || 'correo@registrado.com',
          telefono: usuarioSesion.phone_number || usuarioSesion.telefono || 'No registrado'
        },
        items: [...carrito],
        subtotal,
        iva,
        total,
        observaciones,
        estado: 'enviada'
      };

      // Guardar también en el historial visual
      setHistorialCotizaciones([
        nuevaCotizacion,
        ...historialCotizaciones
      ]);

      // Limpiar carrito
      handleLimpiarTodo();

      // Mostrar listado
      setTabActiva('listado');

      // 🌟 REEMPLAZO DE ALERT POR TOAST FLOTANTE MODERNO
      setMensajeCotizacion(`¡Cotización ${nuevaCotizacion.numero} generada con éxito! 🎉 Se ha enviado una confirmación al correo ${usuarioSesion.email || usuarioSesion.correo}.`);

      setTimeout(() => {
        setMensajeCotizacion(null);
      }, 4000);

    } catch (error) {
      console.error('Error creando cotización:', error);

      setErrorMsg(
        error.message ||
        'No fue posible generar la cotización. Verifica que FastAPI esté ejecutándose.'
      );
    }
  };

  const handleLimpiarTodo = () => {
    setCarrito([]);
    setObservaciones('');
    setErrorMsg('');
    localStorage.removeItem('carrito_cotizacion');
  };

  return (
    <div className={`cotizaciones-page ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <main className="cot-main">
        <div className="cot-titulo">
          <h1>Cotizaciones</h1>
          <p>Gestiona y procesa solicitudes de alquiler de maquinaria y herramientas.</p>
        </div>

        <div className="cot-container" id="cotContainer">
          <nav className="cot-tabs" id="cotTabs">
            <button
              className={`cot-tab-btn ${tabActiva === 'nueva' ? 'active' : ''}`}
              type="button"
              onClick={() => setTabActiva('nueva')}
            >
              🧾 Nueva cotización {carrito.length > 0 && `(${carrito.length})`}
            </button>
            <button
              className={`cot-tab-btn ${tabActiva === 'listado' ? 'active' : ''}`}
              type="button"
              onClick={() => setTabActiva('listado')}
            >
              📋 Mis cotizaciones ({historialCotizaciones.length})
            </button>
          </nav>

          {tabActiva === 'nueva' && (
            <section className="cot-tab-panel active" id="tab-nueva">
              
              {/* ESTADO DE SESIÓN DEL CLIENTE */}
              <div className="cot-bloque">
                <h2>Información de Cuenta</h2>
                {usuarioSesion ? (
                  <p style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                    Sesión activa: {usuarioSesion.nombre || usuarioSesion.email || usuarioSesion.username}
                  </p>
                ) : (
                  <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    ⚠️ No has iniciado sesión. Puedes armar tu cotización, pero deberás autenticarte para guardarla.
                  </p>
                )}
              </div>

              {/* SELECTOR MANUAL */}
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
                          {i.nombre} - {formatoMoneda(i.precio)}/mes
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

                  <div className="cot-form-group">
                    <label htmlFor="itemDias">Meses de alquiler</label>
                    <input
                      type="number"
                      id="itemDias"
                      min="1"
                      value={mesesInput}
                      onChange={(e) => setMesesInput(e.target.value)}
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

              {/* TABLA DE ÍTEMS */}
              <div className="cot-bloque">
                <h2>Ítems de la cotización</h2>
                <div className="cot-lista-wrap">
                  <table className="cot-tabla">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Ítem</th>
                        <th>Cant.</th>
                        <th>Meses</th>
                        <th>Valor unitario</th>
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
                          <td>{item.meses}</td>
                          <td>{formatoMoneda(item.valorUnitario)}</td>
                          <td><strong>{formatoMoneda(item.cantidad * item.meses * item.valorUnitario)}</strong></td>
                          <td>
                            <button
                              type="button"
                              style={{ color: '#c62828', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}
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
                      No hay ítems agregados. Selecciónalos arriba o desde el Catálogo.
                    </p>
                  )}
                </div>

                <div className="cot-totales" style={{ marginTop: '1.5rem' }}>
                  <div className="cot-totales-fila">
                    <span>Subtotal</span>
                    <span>{formatoMoneda(subtotal)}</span>
                  </div>
                  <div className="cot-totales-fila">
                    <span>IVA (19%)</span>
                    <span>{formatoMoneda(iva)}</span>
                  </div>
                  <div className="cot-totales-fila cot-total-final" style={{ fontSize: '1.2rem', fontWeight: 'bold', borderTop: '2px solid #ccc', paddingTop: '8px' }}>
                    <span>Total</span>
                    <span style={{ color: '#2e7d32' }}>{formatoMoneda(total)}</span>
                  </div>
                </div>
              </div>

              {/* OBSERVACIONES Y BOTONES */}
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
                  <button
                    type="button"
                    className="cot-btn"
                    onClick={handleGuardarCotizacion}
                  >
                    💾 Guardar cotización
                  </button>
                  <button
                    type="button"
                    className="cot-btn-secundario"
                    onClick={handleLimpiarTodo}
                  >
                    🗑️ Limpiar todo
                  </button>
                </div>
              </div>

            </section>
          )}

          {tabActiva === 'listado' && (
            <section className="cot-tab-panel active" id="tab-listado">
              <div className="cot-bloque">
                <h2>Mis Cotizaciones</h2>
                <div className="cot-lista-wrap">
                  <table className="cot-tabla">
                    <thead>
                      <tr>
                        <th>Número</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Total</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialCotizaciones.map((cot) => (
                        <tr key={cot.numero}>
                          <td><strong>{cot.numero}</strong></td>
                          <td>{cot.fecha}</td>
                          <td>{cot.cliente.nombre}<br /><small style={{ color: '#888' }}>{cot.cliente.correo}</small></td>
                          <td><strong>{formatoMoneda(cot.total)}</strong></td>
                          <td><span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold' }}>{cot.estado.toUpperCase()}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {historialCotizaciones.length === 0 && (
                    <p className="cot-vacio" style={{ padding: '1.5rem', textAlign: 'center' }}>
                      No tienes cotizaciones guardadas.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

        </div>
      </main>

      {/* 🌟 NOTIFICACIÓN FLOTANTE (TOAST) DE COTIZACIÓN */}
      {mensajeCotizacion && (
        <div className="toast-notificacion">
          <span>{mensajeCotizacion}</span>
        </div>
      )}
    </div>
  );
}