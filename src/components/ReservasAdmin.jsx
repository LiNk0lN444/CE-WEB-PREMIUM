import React, { useState, useEffect } from 'react';
import '../assests/css/ReservasAdmin.css';
import {
  obtenerReservasEnCurso,
  obtenerReservasPorVencer,
  marcarNotificada,
} from '../services/api';

export default function ReservasAdmin({ darkMode }) {
  const [tab, setTab] = useState('en-curso');
  const [enCurso, setEnCurso] = useState([]);
  const [porVencer, setPorVencer] = useState([]);
  const [cargando, setCargando] = useState(true);

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
      const [cursos, v] = await Promise.all([
        obtenerReservasEnCurso(),
        obtenerReservasPorVencer(),
      ]);
      setEnCurso(cursos);
      setPorVencer(v);
    } catch (err) {
      console.error('Error cargando reservas:', err);
    } finally {
      setCargando(false);
    }
  }

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
    <div className={`reservas-admin-page ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className="reservas-admin-main">
        <div className="reservas-admin-titulo">
          <h1>Reservas en Curso</h1>
          <p>Reservas aprobadas y activas de tus clientes.</p>
        </div>

        <nav className="reservas-admin-tabs">
          <button
            className={tab === 'en-curso' ? 'active' : ''}
            onClick={() => setTab('en-curso')}
          >
            🚚 En Curso ({enCurso.length})
          </button>
          <button
            className={tab === 'por-vencer' ? 'active' : ''}
            onClick={() => setTab('por-vencer')}
          >
            ⏰ Por Vencer ({porVencer.length})
          </button>
        </nav>

        {cargando && <p className="reservas-admin-cargando">Cargando...</p>}

        {/* TAB EN CURSO */}
        {!cargando && tab === 'en-curso' && (
          <div className="reservas-admin-bloque">
            {enCurso.length === 0 ? (
              <p className="reservas-admin-vacio">No hay reservas en curso.</p>
            ) : (
              <table className="reservas-admin-tabla">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Meses</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {enCurso.map((r) => (
                    <tr key={r.cotizacion_id}>
                      <td><strong>COT-{r.cotizacion_id}</strong></td>
                      <td>
                        {r.username}
                        <br />
                        <small style={{ color: '#888' }}>{r.cliente_email}</small>
                      </td>
                      <td>{formatoFecha(r.start_date)}</td>
                      <td>{formatoFecha(r.end_date)}</td>
                      <td>{r.months || '—'}</td>
                      <td><strong>{formatoMoneda(r.total_price)}</strong></td>
                      <td>
                        <span className={`badge-${r.status}`}>
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB POR VENCER */}
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

      {toast && (
        <div className={`toast-notificacion toast-${toast.tipo}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}