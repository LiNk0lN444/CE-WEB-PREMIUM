import React, { useState, useEffect } from 'react';
import '../assests/css/CotizacionesAdmin.css';
import {
  obtenerReservasPendientes,
  aprobarReserva,
  rechazarReserva,
} from '../services/api';

export default function CotizacionesAdmin({ darkMode }) {
  const usuarioSesion = JSON.parse(localStorage.getItem('usuario_sesion')) || null;

  const [pendientes, setPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null);

  const [modalRechazar, setModalRechazar] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const [toast, setToast] = useState(null);
  const mostrarToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      setCargando(true);
      const data = await obtenerReservasPendientes();
      setPendientes(data);
    } catch {
      // silencio
    } finally {
      setCargando(false);
    }
  }

  async function handleAprobar(reserva) {
    if (!usuarioSesion?.user_id) return;
    try {
      setProcesando(reserva.cotizacion_id);
      await aprobarReserva(reserva.cotizacion_id, usuarioSesion.user_id);
      mostrarToast(`COT-${reserva.cotizacion_id} aprobada ✅`);
      await cargar();
    } catch (err) {
      mostrarToast(err.message || 'Error al aprobar', 'error');
    } finally {
      setProcesando(null);
    }
  }

  async function handleConfirmarRechazo() {
    if (!modalRechazar || !motivoRechazo.trim() || !usuarioSesion?.user_id) return;
    try {
      setProcesando(modalRechazar.cotizacion_id);
      await rechazarReserva(
        modalRechazar.cotizacion_id,
        usuarioSesion.user_id,
        motivoRechazo.trim()
      );
      mostrarToast(`COT-${modalRechazar.cotizacion_id} rechazada`, 'info');
      setModalRechazar(null);
      setMotivoRechazo('');
      await cargar();
    } catch (err) {
      mostrarToast(err.message || 'Error al rechazar', 'error');
    } finally {
      setProcesando(null);
    }
  }

  const formatoMoneda = (val) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val || 0);

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
    <div className={`cotizaciones-admin-page ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className="cotizaciones-admin-main">
        <div className="cotizaciones-admin-titulo">
          <h1>Cotizaciones Pendientes</h1>
          <p>Aprueba o rechaza las solicitudes de reserva de tus clientes.</p>
        </div>

        {cargando && <p className="cotizaciones-admin-cargando">Cargando...</p>}

        {!cargando && pendientes.length === 0 && (
          <p className="cotizaciones-admin-vacio">
            🎉 No hay cotizaciones pendientes por revisar.
          </p>
        )}

        {!cargando && pendientes.length > 0 && (
          <div className="cotizaciones-admin-grid">
            {pendientes.map((r) => (
              <div key={r.cotizacion_id} className="cotizacion-card">
                <div className="cotizacion-card-header">
                  <h3>COT-{r.cotizacion_id}</h3>
                  <span className="badge-pendiente">PENDIENTE</span>
                </div>

                <div className="cotizacion-card-body">
                  <p><strong>Cliente:</strong> {r.username}</p>
                  <p><strong>Email:</strong> {r.cliente_email}</p>
                  <p><strong>Inicio:</strong> {formatoFecha(r.start_date)}</p>
                  <p><strong>Fin:</strong> {formatoFecha(r.end_date)}</p>
                  <p><strong>Duración:</strong> {r.months || '—'} mes(es)</p>
                  <p className="cotizacion-total">
                    <strong>Total:</strong> {formatoMoneda(r.total_price)}
                  </p>
                  {r.observations && (
                    <p className="cotizacion-observaciones">"{r.observations}"</p>
                  )}
                </div>

                <div className="cotizacion-card-actions">
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

      {modalRechazar && (
        <div className="modal-overlay" onClick={() => setModalRechazar(null)}>
          <div className="modal-cotizacion" onClick={(e) => e.stopPropagation()}>
            <h3>❌ Rechazar COT-{modalRechazar.cotizacion_id}</h3>
            <p>Explica al cliente por qué se rechaza:</p>
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              rows="3"
              placeholder="Ej: No hay stock suficiente para esas fechas"
            />
            <div className="modal-cotizacion-acciones">
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

      {toast && (
        <div className={`toast-notificacion toast-${toast.tipo}`}>{toast.msg}</div>
      )}
    </div>
  );
}