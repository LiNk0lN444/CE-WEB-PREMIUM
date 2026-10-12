import React, { useState, useEffect } from 'react';
import '../assests/css/PanelAsesor.css';
import {
  obtenerMisCitas,
  actualizarEstadoCita,
  verificarDisponibilidadAsesor,
} from '../services/api';

export default function PanelAsesor({ darkMode }) {
  const usuarioSesion = JSON.parse(localStorage.getItem('usuario_sesion')) || null;

  const [citas, setCitas] = useState([]);
  const [disponible, setDisponible] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null);

  const [modalEstado, setModalEstado] = useState(null);
  const [notasEstado, setNotasEstado] = useState('');

  const [toast, setToast] = useState(null);
  const mostrarToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargar() {
    if (!usuarioSesion?.user_id) return;
    try {
      setCargando(true);
      const [c, d] = await Promise.all([
        obtenerMisCitas(usuarioSesion.user_id),
        verificarDisponibilidadAsesor(usuarioSesion.user_id),
      ]);
      setCitas(c);
      setDisponible(d.disponible);
    } catch {
      // silencio
    } finally {
      setCargando(false);
    }
  }

  async function handleCambiarEstado(slotId, nuevoEstado, notas) {
    try {
      setProcesando(slotId);
      await actualizarEstadoCita(slotId, { estado: nuevoEstado, notas });
      mostrarToast(`Cita marcada como ${nuevoEstado}`, 'info');
      setModalEstado(null);
      setNotasEstado('');
      await cargar();
    } catch (err) {
      mostrarToast(err.message || 'Error al actualizar', 'error');
    } finally {
      setProcesando(null);
    }
  }

  const formatoFecha = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatoMoneda = (val) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val || 0);

  // Separar citas: hoy, próximas, pasadas
  const hoy = new Date().toISOString().split('T')[0];
  const citasHoy = citas.filter((c) => c.fecha === hoy);
  const citasProximas = citas.filter((c) => c.fecha > hoy);

  return (
    <div className={`panel-asesor-page ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className="panel-asesor-main">
        <div className="panel-asesor-titulo">
          <h1>Panel de Asesor</h1>
          <p>Gestiona tus llamadas y citas con clientes.</p>
        </div>

        {/* Estado de disponibilidad */}
        <div className={`disponibilidad-card ${disponible ? 'disponible' : 'no-disponible'}`}>
          <span className="disponibilidad-dot"></span>
          <div>
            <strong>{disponible ? '🟢 Disponible ahora' : '🔴 Fuera de horario'}</strong>
            <p>
              {disponible
                ? 'Estás dentro de tu horario laboral.'
                : 'Volverás a estar disponible en tu próximo horario.'}
            </p>
          </div>
        </div>

        {cargando && <p className="panel-cargando">Cargando citas...</p>}

        {/* Citas de hoy */}
        {!cargando && citasHoy.length > 0 && (
          <div className="panel-bloque">
            <h2>📅 Citas de hoy ({citasHoy.length})</h2>
            <div className="citas-grid">
              {citasHoy.map((c) => (
                <CitaCard
                  key={c.slot_id}
                  cita={c}
                  formatoMoneda={formatoMoneda}
                  onMarcar={(estado) => setModalEstado({ cita: c, estado })}
                  procesando={procesando === c.slot_id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Citas próximas */}
        {!cargando && citasProximas.length > 0 && (
          <div className="panel-bloque">
            <h2>📆 Próximas citas ({citasProximas.length})</h2>
            <table className="panel-tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Total cotización</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {citasProximas.map((c) => (
                  <tr key={c.slot_id}>
                    <td>{formatoFecha(c.fecha)}</td>
                    <td>
                      {String(c.hora_inicio).slice(0, 5)} - {String(c.hora_fin).slice(0, 5)}
                    </td>
                    <td>
                      {c.cliente_username || '—'}
                      <br />
                      <small>{c.cliente_email}</small>
                    </td>
                    <td>{formatoMoneda(c.cotizacion_total)}</td>
                    <td>
                      <span className={`estado-badge estado-${c.estado}`}>
                        {c.estado.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!cargando && citas.length === 0 && (
          <p className="panel-vacio">No tienes citas asignadas por el momento.</p>
        )}
      </div>

      {/* Modal para cambiar estado */}
      {modalEstado && (
        <div className="modal-overlay" onClick={() => setModalEstado(null)}>
          <div className="modal-asesor" onClick={(e) => e.stopPropagation()}>
            <h3>Marcar como {modalEstado.estado}</h3>
            <p>
              Cliente: <strong>{modalEstado.cita.cliente_username}</strong>
              <br />
              Teléfono: <strong>{modalEstado.cita.cliente_telefono || 'No disponible'}</strong>
            </p>

            <label>Notas (opcional)</label>
            <textarea
              rows="3"
              value={notasEstado}
              onChange={(e) => setNotasEstado(e.target.value)}
              placeholder="Detalles de la llamada..."
            />

            <div className="modal-asesor-acciones">
              <button className="btn-cancelar" onClick={() => setModalEstado(null)}>
                Cancelar
              </button>
              <button
                className="btn-confirmar"
                disabled={procesando === modalEstado.cita.slot_id}
                onClick={() =>
                  handleCambiarEstado(modalEstado.cita.slot_id, modalEstado.estado, notasEstado)
                }
              >
                {procesando === modalEstado.cita.slot_id ? 'Guardando...' : 'Confirmar'}
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

function CitaCard({ cita, formatoMoneda, onMarcar, procesando }) {
  return (
    <div className="cita-card">
      <div className="cita-card-header">
        <span className="cita-hora">
          {String(cita.hora_inicio).slice(0, 5)} - {String(cita.hora_fin).slice(0, 5)}
        </span>
        <span className={`estado-badge estado-${cita.estado}`}>
          {cita.estado.toUpperCase()}
        </span>
      </div>

      <div className="cita-card-body">
        <p><strong>Cliente:</strong> {cita.cliente_username || '—'}</p>
        <p><strong>Email:</strong> {cita.cliente_email || '—'}</p>
        <p><strong>Teléfono:</strong> {cita.cliente_telefono || 'No disponible'}</p>
        <p><strong>Total:</strong> {formatoMoneda(cita.cotizacion_total)}</p>
      </div>

      <div className="cita-card-actions">
        <button
          className="btn-realizada"
          disabled={procesando}
          onClick={() => onMarcar('realizada')}
        >
          ✅ Realizada
        </button>
        <button
          className="btn-no-contesto"
          disabled={procesando}
          onClick={() => onMarcar('no_contesto')}
        >
          📵 No contestó
        </button>
      </div>
    </div>
  );
}