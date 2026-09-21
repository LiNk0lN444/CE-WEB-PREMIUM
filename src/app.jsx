import React, { useState, useEffect } from 'react';
import './assests/css/index.css';
import Catalogo from './components/catalogo';
import Cotizaciones from './components/cotizaciones';
import Inventario from './components/inventario';
import AuthPage from './components/AuthPage';
import ReservasAdmin from './components/ReservasAdmin';
import { obtenerReservasPendientes } from './services/api';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [vistaActual, setVistaActual] = useState('inicio');

  // 🔔 TOAST GLOBAL
  const [toast, setToast] = useState(null);
  const mostrarToast = (mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const [usuarioSesion, setUsuarioSesion] = useState(() => {
    const sesionGuardada = localStorage.getItem('usuario_sesion');
    return sesionGuardada ? JSON.parse(sesionGuardada) : null;
  });

  // 🔐 ¿El usuario actual es admin?
  const esAdmin = usuarioSesion?.role === 'admin';

  // 📊 Contador de reservas pendientes (para el badge del menú)
  const [reservasPendientes, setReservasPendientes] = useState(0);

  const toggleTheme = () => setDarkMode(!darkMode);

  // Scroll al inicio al cambiar de vista
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [vistaActual]);

  // 🔐 Bloqueo de seguridad: si NO es admin e intenta ver inventario,
  //    lo redirigimos automáticamente al inicio.
  useEffect(() => {
    if (vistaActual === 'inventario' && !esAdmin) {
      mostrarToast('Acceso restringido. Solo administradores. 🔒', 'error');
      setVistaActual('inicio');
    }
    if (vistaActual === 'reservas-admin' && !esAdmin) {
      mostrarToast('Acceso restringido. Solo administradores. 🔒', 'error');
      setVistaActual('inicio');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaActual, esAdmin]);

  // 🔔 Cargar contador de reservas pendientes (solo para admin)
  useEffect(() => {
    if (!esAdmin) {
      setReservasPendientes(0);
      return;
    }

    obtenerReservasPendientes()
      .then((res) => setReservasPendientes(Array.isArray(res) ? res.length : 0))
      .catch(() => setReservasPendientes(0));
  }, [esAdmin, vistaActual]);

  const handleLoginSuccess = (usuario) => {
    setUsuarioSesion(usuario);
    localStorage.setItem('usuario_sesion', JSON.stringify(usuario));
    mostrarToast(`¡Bienvenido de nuevo, ${usuario.username || 'Usuario'}! 👋`);
    setVistaActual('inicio');
  };

  const handleCerrarSesion = () => {
    setUsuarioSesion(null);
    localStorage.removeItem('usuario_sesion');
    mostrarToast('Sesión cerrada correctamente. 👋', 'info');
    setVistaActual('inicio');
  };

  return (
    <div className={`app-root ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <header className="navbar-global">
        <div className="brand-title" onClick={() => setVistaActual('inicio')}>
          <span className="brand-accent">🛠️ CE-Web</span>
        </div>

        <nav>
          <ul className="nav-menu-links">
            {/* ── Inicio ── */}
            <li>
              <button
                className={vistaActual === 'inicio' ? 'active' : ''}
                onClick={() => setVistaActual('inicio')}
              >
                Inicio
              </button>
            </li>

            {/* ── Catálogo ── */}
            <li>
              <button
                className={vistaActual === 'catalogo' ? 'active' : ''}
                onClick={() => setVistaActual('catalogo')}
              >
                Catálogo
              </button>
            </li>

            {/* ── Inventario (solo admin) ── */}
            {esAdmin && (
              <li>
                <button
                  className={vistaActual === 'inventario' ? 'active' : ''}
                  onClick={() => setVistaActual('inventario')}
                >
                  Inventario 🔒
                </button>
              </li>
            )}

            {/* ── Reservas Admin (solo admin, con badge) ── */}
            {esAdmin && (
              <li>
                <button
                  className={vistaActual === 'reservas-admin' ? 'active' : ''}
                  onClick={() => setVistaActual('reservas-admin')}
                >
                  Reservas
                  {reservasPendientes > 0 && (
                    <span
                      style={{
                        marginLeft: '6px',
                        background: '#b21420',
                        color: 'white',
                        borderRadius: '10px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                    >
                      🔔 {reservasPendientes}
                    </span>
                  )}
                </button>
              </li>
            )}

            {/* ── Cotizaciones / Reservas (cliente) ── */}
            <li>
              <button
                className={vistaActual === 'cotizaciones' ? 'active' : ''}
                onClick={() => setVistaActual('cotizaciones')}
              >
                {esAdmin ? 'Cotizaciones' : 'Mis Reservas'}
              </button>
            </li>

            {/* ── Sesión ── */}
            <li>
              {usuarioSesion ? (
                <button
                  className="btn-hero-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  onClick={handleCerrarSesion}
                >
                  👤 {usuarioSesion.username || 'Usuario'}
                  {esAdmin && ' (Admin)'} (Salir)
                </button>
              ) : (
                <button
                  className={vistaActual === 'login' ? 'active' : ''}
                  onClick={() => setVistaActual('login')}
                >
                  🔑 Iniciar Sesión
                </button>
              )}
            </li>

            {/* ── Modo claro/oscuro ── */}
            <li>
              <button className="btn-theme-toggle" onClick={toggleTheme}>
                {darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <main className="main-content-container">
        {/* ═══════════════════════════════════════════
            VISTA: INICIO (landing)
        ═══════════════════════════════════════════ */}
        {vistaActual === 'inicio' && (
          <div className="landing-modern">
            <section className="hero-fixed-background">
              <div className="hero-overlay"></div>
              <div className="hero-content-wrapper">
                <div className="hero-text-side">
                  <div className="welcome-badge">
                    <span className="bot-avatar">🤖</span>
                    <span className="welcome-text">
                      {usuarioSesion
                        ? `¡Hola de nuevo, ${usuarioSesion.username || 'Usuario'}!`
                        : '¡Hola, bienvenido a CE-Web!'}
                    </span>
                    <span className="waving-hand">👋</span>
                  </div>

                  <h1 className="hero-title">
                    Alquiler de{' '}
                    <span className="text-highlight">
                      Herramientas y Maquinaria Pesada
                    </span>
                  </h1>

                  <p className="hero-subtitle">
                    Plataforma inteligente para la gestión, cotizaciones
                    instantáneas y control de equipos para tu obra.
                  </p>

                  <div className="hero-actions">
                    <button
                      className="btn-hero-primary"
                      onClick={() => setVistaActual('catalogo')}
                    >
                      Explorar Catálogo 🏗️
                    </button>
                    <button
                      className="btn-hero-secondary"
                      onClick={() => setVistaActual('cotizaciones')}
                    >
                      {esAdmin ? 'Gestionar Reservas 📑' : 'Solicitar Reserva 📑'}
                    </button>
                  </div>
                </div>

                <div className="hero-image-side"></div>
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            VISTA: LOGIN
        ═══════════════════════════════════════════ */}
        {vistaActual === 'login' && (
          <AuthPage
            onLoginSuccess={handleLoginSuccess}
            onCancel={() => setVistaActual('inicio')}
          />
        )}

        {/* ═══════════════════════════════════════════
            VISTA: CATÁLOGO (todos)
        ═══════════════════════════════════════════ */}
        {vistaActual === 'catalogo' && <Catalogo darkMode={darkMode} />}

        {/* ═══════════════════════════════════════════
            VISTA: RESERVAS (cliente)
        ═══════════════════════════════════════════ */}
        {vistaActual === 'cotizaciones' && (
          <Cotizaciones
            darkMode={darkMode}
            onNavigateLogin={() => setVistaActual('login')}
          />
        )}

        {/* ═══════════════════════════════════════════
            VISTA: INVENTARIO (solo admin)
        ═══════════════════════════════════════════ */}
        {vistaActual === 'inventario' && esAdmin && (
          <Inventario darkMode={darkMode} />
        )}

        {/* ═══════════════════════════════════════════
            VISTA: PANEL RESERVAS (solo admin)
        ═══════════════════════════════════════════ */}
        {vistaActual === 'reservas-admin' && esAdmin && (
          <ReservasAdmin darkMode={darkMode} />
        )}
      </main>

      {/* ═══════════════════════════════════════════
          TOAST GLOBAL
      ═══════════════════════════════════════════ */}
      {toast && (
        <div className={`toast-notificacion toast-${toast.tipo}`}>
          {toast.mensaje}
        </div>
      )}
    </div>
  );
}