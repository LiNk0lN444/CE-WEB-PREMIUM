import React, { useState, useEffect } from 'react';
import '../assests/css/ReservasAdmin.css';
import {
  obtenerReservasPendientes,
  obtenerReservasPorVencer,
  aprobarReserva,
  rechazarReserva,
  marcarNotificada,
  obtenerInventario,
  actualizarItemInventario,
} from '../services/api';

export default function ReservasAdmin({ darkMode }) {
  const usuarioSesion = JSON.parse(localStorage.getItem('usuario_sesion')) || null;

  const [tab, setTab] = useState('pendientes');
  const [pendientes, setPendientes] = useState([]);
  const [porVencer, setPorVencer] = useState([]);
  const [inventario, setInventario] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null);

  // Modales
  const [modalRechazar, setModalRechazar] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const [modalAumentarStock, setModalAumentarStock] = useState(null);
  const [cantidadAumentar, setCantidadAumentar] = useState(0);

  const [toast, setToast] = useState(null);
  const mostrarToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    try {
      setCargando(true);
      const [p, v, inv] = await Promise.all([
        obtenerReservasPendientes(),
        obtenerReservasPorVencer(),
        obtenerInventario(),
      ]);
      setPendientes(p);
      setPorVencer(v);
      setInventario(inv);
    } catch {
      // silencio
    } finally {
      setCargando(false);
    }
  }

  // ─────────────────────────────────────────
  // Aprobar reserva
  // ─────────────────────────────────────────
  async function handleAprobar(reserva) {
    if (!usuarioSesion?.user_id) return;

    try {
      setProcesando(reserva.cotizacion_id);
      await aprobarReserva(reserva.cotizacion_id, usuarioSesion.user_id);
      mostrarToast(`Reserva COT-${reserva.cotizacion_id} aprobada ✅`);
      await cargarTodo();
    } catch (err) {
      // Si falla por stock insuficiente, ofrecemos aumentar stock
      if (err.message && err.message.toLowerCase().includes('stock')) {
        setModalAumentarStock({ reserva, motivo: err.message });
      } else {
        mostrarToast(err.message || 'Error al aprobar', 'error');
      }
    } finally {
      setProcesando(null);
    }
  }

  // ─────────────────────────────────────────
  // Rechazar reserva
  // ─────────────────────────────────────────
  async function handleConfirmarRechazo() {
    if (!modalRechazar || !motivoRechazo.trim() || !usuarioSesion?.user_id) return;

    try {
      setProcesando(modalRechazar.cotizacion_id);
      await rechazarReserva(
        modalRechazar.cotizacion_id,
        usuarioSesion.user_id,
        motivoRechazo.trim()
      );
      mostrarToast(`Reserva COT-${modalRechazar.cotizacion_id} rechazada`, 'info');
      setModalRechazar(null);
      setMotivoRechazo('');
      await cargarTodo();
    } catch (err) {
      mostrarToast(err.message || 'Error al rechazar', 'error');
    } finally {
      setProcesando(null);
    }
  }

  // ─────────────────────────────────────────
  // Aumentar stock
  // ─────────────────────────────────────────
  async function handleAumentarStock() {
    if (!modalAumentarStock || cantidadAumentar <= 0) return;

    const { reserva } = modalAumentarStock;

    // Buscar el inventario del producto de la reserva
    // ⚠️ Asume que la reserva tiene 1 producto principal; si son varios, hay que iterar
    try {
      setProcesando('stock');

      // Buscar el item de inventario del primer producto de la reserva
      // Necesitamos info del detalle, por simplicidad aumentamos el primer producto disponible
      const itemInv = inventario[0]; // ajustar si hay varios

      if (!itemInv) {
        mostrarToast('No se encontró inventario para este producto', 'error');
        return;
      }

      await actualizarItemInventario(itemInv.inventory_id, {
        product_id: itemInv.product_id,
        quantity: itemInv.quantity + cantidadAumentar,
        initial_price: itemInv.initial_price,
      });

      mostrarToast(`Stock aumentado en ${cantidadAumentar} unidades ✅`);
      setModalAumentarStock(null);
      setCantidadAumentar(0);
      await cargarTodo();
    } catch (err) {
      mostrarToast(err.message || 'Error al aumentar stock', 'error');
    } finally {
      setProcesando(null);
    }
  }

  // ─────────────────────────────────────────
  // Marcar por vencer como vistas
  // ─────────────────────────────────────────
  async function handleMarcarVistas() {
    try {
      await Promise.all(
        porVencer
          .filter((r) => !r.notificado_vencimiento)
          .map((r) => marcarNotificada(r.cotizacion_id))
      );
      mostrarToast('Notificaciones marcadas como vistas', 'info');
      await cargarTodo();
    } catch {
      mostrarToast('No se pudieron marcar', 'error');
    }
  }

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

  return (
    <div className={`reservas-admin-page ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className="reservas-admin-main">
        <div className="reservas-admin-titulo">
          <h1>Panel de Reservas</h1>
          <p>Aprueba, rechaza y gestiona las reservas de los clientes.</p>
        </div>

        <nav className="reservas-admin-tabs">
          <button
            className={tab === 'pendientes' ? 'active' : ''}
            onClick={() => setTab('pendientes')}
          >
            ⏳ Pendientes ({pendientes.length})
          </button>
          <button
            className={tab === 'por-vencer' ? 'active' : ''}
            onClick={() => setTab('por-vencer')}
          >
            ⏰ Por vencer ({porVencer.length})
          </button>
        </nav>

        {cargando && <p className="reservas-admin-cargando">Cargando...</p>}

        {/* ══════════════════════════════════════
            TAB PENDIENTES
        ══════════════════════════════════════ */}
        {!cargando && tab === 'pendientes' && (
          <div className="reservas-admin-bloque">
            {pendientes.length === 0 ? (
              <p className="reservas-admin-vacio">No hay reservas pendientes.</p>
            ) : (
              <div className="reservas-admin-grid">
                {pendientes.map((r) => (
                  <div key={r.cotizacion_id} className="reserva-card">
                    <div className="reserva-card-header">
                      <h3>COT-{r.cotizacion_id}</h3>
                      <span className="badge-pending">PENDIENTE</span>
                    </div>

                    <div className="reserva-card-body">
                      <p><strong>Cliente:</strong> {r.username}</p>
                      <p><strong>Email:</strong> {r.cliente_email}</p>
                      <p><strong>Inicio:</strong> {formatoFecha(r.start_date)}</p>
                      <p><strong>Fin:</strong> {formatoFecha(r.end_date)}</p>
                      <p><strong>Meses:</strong> {r.months || '—'}</p>
                      <p><strong>Total:</strong> {formatoMoneda(r.total_price)}</p>
                      {r.observations && (
                        <p style={{ fontStyle: 'italic', color: '#888' }}>
                          "{r.observations}"
                        </p>
                      )}
                    </div>

                    <div className="reserva-card-actions">
                      <button
                        className="btn-aprobar"
                        disabled={procesando === r.cotizacion_id}
                        onClick={() => handleAprobar(r)}
                      >
                        {procesando === r.cotizacion_id ? '...' : '✅ Aprobar'}
                      </button>
                      <button
                        className="btn-rechazar"
                        disabled={procesando === r.cotizacion_id}
                        onClick={() => setModalRechazar(r)}
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB POR VENCER
        ══════════════════════════════════════ */}
        {!cargando && tab === 'por-vencer' && (
          <div className="reservas-admin-bloque">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <p style={{ color: '#888', fontSize: '14px' }}>
                Reservas que vencen en los próximos 3 días.
              </p>
              {porVencer.length > 0 && (
                <button className="btn-secundario-sm" onClick={handleMarcarVistas}>
                  Marcar como vistas
                </button>
              )}
            </div>

            {porVencer.length === 0 ? (
              <p className="reservas-admin-vacio">
                No hay reservas por vencer en los próximos 3 días.
              </p>
            ) : (
              <table className="reservas-admin-tabla">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Vence</th>
                    <th>Días restantes</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {porVencer.map((r) => (
                    <tr key={r.cotizacion_id}>
                      <td><strong>COT-{r.cotizacion_id}</strong></td>
                      <td>
                        {r.username}
                        <br />
                        <small style={{ color: '#888' }}>{r.cliente_email}</small>
                      </td>
                      <td>{formatoFecha(r.end_date)}</td>
                      <td>
                        <span className={r.dias_restantes <= 1 ? 'dias-urgente' : 'dias-normal'}>
                          {r.dias_restantes} día{r.dias_restantes !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td><strong>{formatoMoneda(r.total_price)}</strong></td>
                      <td>
                        <span className="badge-active">{r.status.toUpperCase()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          MODAL RECHAZAR
      ══════════════════════════════════════ */}
      {modalRechazar && (
        <div className="modal-overlay" onClick={() => setModalRechazar(null)}>
          <div className="modal-reserva" onClick={(e) => e.stopPropagation()}>
            <h3>❌ Rechazar COT-{modalRechazar.cotizacion_id}</h3>
            <p>Explica al cliente por qué se rechaza:</p>
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              rows="3"
              placeholder="Ej: No hay stock suficiente para esas fechas"
            />
            <div className="modal-reserva-actions">
              <button className="btn-cancelar" onClick={() => setModalRechazar(null)}>
                Cancelar
              </button>
              <button
                className="btn-rechazar"
                disabled={!motivoRechazo.trim() || procesando === modalRechazar.cotizacion_id}
                onClick={handleConfirmarRechazo}
              >
                {procesando === modalRechazar.cotizacion_id ? 'Rechazando...' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL AUMENTAR STOCK
      ══════════════════════════════════════ */}
      {modalAumentarStock && (
        <div className="modal-overlay" onClick={() => setModalAumentarStock(null)}>
          <div className="modal-reserva" onClick={(e) => e.stopPropagation()}>
            <h3>📦 Aumentar stock</h3>
            <p style={{ color: '#d32f2f' }}>
              {modalAumentarStock.motivo}
            </p>
            <p>
              Puedes agregar más unidades al inventario para poder aprobar esta reserva.
            </p>

            <label>¿Cuántas unidades agregar?</label>
            <input
              type="number"
              min="1"
              value={cantidadAumentar}
              onChange={(e) => setCantidadAumentar(parseInt(e.target.value) || 0)}
            />

            <div className="modal-reserva-actions">
              <button className="btn-cancelar" onClick={() => setModalAumentarStock(null)}>
                Cancelar
              </button>
              <button
                className="btn-aprobar"
                disabled={cantidadAumentar <= 0 || procesando === 'stock'}
                onClick={handleAumentarStock}
              >
                {procesando === 'stock' ? 'Aumentando...' : 'Aumentar stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast-notificacion toast-${toast.tipo}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}