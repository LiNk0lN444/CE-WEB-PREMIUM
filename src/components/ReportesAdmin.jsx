import React, { useState, useEffect } from 'react';
import '../assests/css/AdminPanels.css';
import { obtenerReporteVentas, descargarReporteVentas } from '../services/api';

const ESTADO_LABEL = { approved: 'Aprobada', active: 'En curso', completed: 'Finalizada' };

function mesActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

const formatoMoneda = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);

const formatoFecha = (iso) =>
  iso
    ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

export default function ReportesAdmin({ darkMode }) {
  const [periodo, setPeriodo] = useState(mesActual()); // "YYYY-MM"
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [descargando, setDescargando] = useState('');

  const [toast, setToast] = useState(null);
  const mostrarToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const [year, month] = periodo.split('-').map(Number);

  useEffect(() => {
    if (!year || !month) return;
    let cancelado = false; // evita pisar datos si cambian de mes rápido
    setCargando(true);
    setError('');
    obtenerReporteVentas(year, month)
      .then((data) => !cancelado && setReporte(data))
      .catch((err) => !cancelado && setError(err.message))
      .finally(() => !cancelado && setCargando(false));
    return () => {
      cancelado = true;
    };
  }, [year, month]);

  async function handleDescargar(formato) {
    try {
      setDescargando(formato);
      await descargarReporteVentas(year, month, formato);
      mostrarToast(`Reporte ${formato.toUpperCase()} descargado ✅`);
    } catch (err) {
      mostrarToast(err.message, 'error');
    } finally {
      setDescargando('');
    }
  }

  const res = reporte?.resumen;
  const maxDia = reporte ? Math.max(...reporte.por_dia.map((d) => d.total), 0) : 0;

  return (
    <div className={`adm-page ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className="adm-main">
        <div className="adm-titulo">
          <div>
            <h1>Reporte de Ventas</h1>
            <p>Control mensual de las reservas aprobadas.</p>
          </div>

          <div className="adm-periodo">
            <input
              className="adm-input"
              type="month"
              value={periodo}
              max={mesActual()}
              onChange={(e) => e.target.value && setPeriodo(e.target.value)}
              aria-label="Mes del reporte"
            />
            <button
              className="adm-btn adm-btn-ghost"
              onClick={() => handleDescargar('xlsx')}
              disabled={!reporte || cargando || !!descargando}
            >
              {descargando === 'xlsx' ? 'Generando…' : '⬇ Excel'}
            </button>
            <button
              className="adm-btn adm-btn-primary"
              onClick={() => handleDescargar('pdf')}
              disabled={!reporte || cargando || !!descargando}
            >
              {descargando === 'pdf' ? 'Generando…' : '⬇ PDF'}
            </button>
          </div>
        </div>

        {error && <div className="adm-error">{error}</div>}
        {cargando && <p className="adm-cargando">Generando reporte…</p>}

        {!cargando && reporte && (
          <>
            {/* ── Tarjetas resumen ── */}
            <div className="adm-cards">
              <div className="adm-card">
                <span>Total vendido</span>
                <strong>{formatoMoneda(res.total_ventas)}</strong>
                <small>
                  {res.variacion_pct === null ? (
                    'Sin ventas el mes anterior para comparar'
                  ) : (
                    <>
                      <b className={res.variacion_pct >= 0 ? 'adm-sube' : 'adm-baja'}>
                        {res.variacion_pct >= 0 ? '▲' : '▼'} {Math.abs(res.variacion_pct)}%
                      </b>{' '}
                      vs. mes anterior ({formatoMoneda(res.total_mes_anterior)})
                    </>
                  )}
                </small>
              </div>
              <div className="adm-card">
                <span>Ventas</span>
                <strong>{res.num_ventas}</strong>
                <small>{res.clientes_unicos} cliente(s) distinto(s)</small>
              </div>
              <div className="adm-card">
                <span>Ticket promedio</span>
                <strong>{formatoMoneda(res.ticket_promedio)}</strong>
              </div>
              <div className="adm-card">
                <span>Subtotal / IVA</span>
                <strong>{formatoMoneda(res.subtotal)}</strong>
                <small>IVA: {formatoMoneda(res.iva)}</small>
              </div>
            </div>

            {res.num_ventas === 0 ? (
              <p className="adm-vacio">No hubo ventas aprobadas en {reporte.periodo.label}.</p>
            ) : (
              <>
                {/* ── Ventas por día ── */}
                <section className="adm-seccion">
                  <h2>Ventas por día</h2>
                  <div className="adm-grafico" role="img" aria-label="Ventas por día del mes">
                    {reporte.por_dia.map((d) => (
                      <div
                        className="adm-barra-col"
                        key={d.dia}
                        title={`${d.dia} de ${reporte.periodo.label}: ${formatoMoneda(d.total)} (${d.num_ventas} venta${d.num_ventas === 1 ? '' : 's'})`}
                      >
                        <div
                          className={`adm-barra ${d.total === 0 ? 'adm-barra-cero' : ''}`}
                          style={{ height: maxDia ? `${(d.total / maxDia) * 100}%` : '2px' }}
                        />
                        <span className="adm-barra-dia">{d.dia}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ── Por producto ── */}
                <section className="adm-seccion">
                  <h2>Ventas por producto</h2>
                  <div className="adm-tabla-wrap">
                    <table className="adm-tabla">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th className="adm-num">Unidades</th>
                          <th className="adm-num">Ingresos (sin IVA)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporte.por_producto.map((p) => (
                          <tr key={p.product_id}>
                            <td>{p.nombre}</td>
                            <td className="adm-num">{p.unidades}</td>
                            <td className="adm-num">{formatoMoneda(p.ingresos)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* ── Detalle ── */}
                <section className="adm-seccion">
                  <h2>Detalle de ventas</h2>
                  <div className="adm-tabla-wrap">
                    <table className="adm-tabla">
                      <thead>
                        <tr>
                          <th>Cotización</th>
                          <th>Cliente</th>
                          <th>Fecha venta</th>
                          <th>Periodo de reserva</th>
                          <th className="adm-num">Subtotal</th>
                          <th className="adm-num">IVA</th>
                          <th className="adm-num">Total</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporte.ventas.map((v) => (
                          <tr key={v.cotizacion_id}>
                            <td><strong>COT-{v.cotizacion_id}</strong></td>
                            <td>
                              {v.cliente}
                              <br />
                              <small>{v.email}</small>
                            </td>
                            <td>{formatoFecha(v.fecha_venta)}</td>
                            <td>
                              {formatoFecha(v.start_date)} → {formatoFecha(v.end_date)}
                            </td>
                            <td className="adm-num">{formatoMoneda(v.subtotal)}</td>
                            <td className="adm-num">{formatoMoneda(v.iva)}</td>
                            <td className="adm-num"><strong>{formatoMoneda(v.total)}</strong></td>
                            <td>
                              <span className={`adm-badge adm-badge-${v.status === 'active' ? 'active' : v.status}`}>
                                {ESTADO_LABEL[v.status] || v.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4}>TOTAL</td>
                          <td className="adm-num">{formatoMoneda(res.subtotal)}</td>
                          <td className="adm-num">{formatoMoneda(res.iva)}</td>
                          <td className="adm-num">{formatoMoneda(res.total_ventas)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>
              </>
            )}

            <p className="adm-nota">
              Se consideran ventas las cotizaciones aprobadas, en curso o finalizadas, contadas en el mes en que el
              administrador las aprobó. Las pendientes, rechazadas y canceladas no suman.
            </p>
          </>
        )}
      </div>

      {toast && <div className={`toast-notificacion toast-${toast.tipo}`}>{toast.msg}</div>}
    </div>
  );
}
