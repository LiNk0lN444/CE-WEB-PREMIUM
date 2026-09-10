import React, { useState, useEffect } from 'react';
import './assests/css/index.css';
import Catalogo from './components/catalogo';
import Cotizaciones from './components/cotizaciones';
import Inventario from './components/inventario';
import AuthPage from './components/AuthPage';

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

  const toggleTheme = () => setDarkMode(!darkMode);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaActual, esAdmin]);

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
            <li>
              <button
                className={vistaActual === 'inicio' ? 'active' : ''}
                onClick={() => setVistaActual('inicio')}
              >
                Inicio
              </button>
            </li>

            <li>
              <button
                className={vistaActual === 'catalogo' ? 'active' : ''}
                onClick={() => setVistaActual('catalogo')}
              >
                Catálogo
              </button>
            </li>

            {/* 🔐 Inventario: SOLO visible para admins */}
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

            <li>
              <button
                className={vistaActual === 'cotizaciones' ? 'active' : ''}
                onClick={() => setVistaActual('cotizaciones')}
              >
                Cotizaciones
              </button>
            </li>

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

            <li>
              <button className="btn-theme-toggle" onClick={toggleTheme}>
                {darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <main className="main-content-container">
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
                      Solicitar Cotización 📑
                    </button>
                  </div>
                </div>

                <div className="hero-image-side"></div>
              </div>
            </section>
          </div>
        )}

        {vistaActual === 'login' && (
          <AuthPage
            onLoginSuccess={handleLoginSuccess}
            onCancel={() => setVistaActual('inicio')}
          />
        )}

        {vistaActual === 'catalogo' && <Catalogo darkMode={darkMode} />}

        {vistaActual === 'cotizaciones' && (
          <Cotizaciones
            darkMode={darkMode}
            onNavigateLogin={() => setVistaActual('login')}
          />
        )}

        {/* 🔐 Doble validación: además de ocultar el botón, bloqueamos la vista */}
        {vistaActual === 'inventario' && esAdmin && (
          <Inventario darkMode={darkMode} />
        )}
      </main>

      {/* 🔔 TOAST GLOBAL */}
      {toast && (
        <div className={`toast-notificacion toast-${toast.tipo}`}>
          {toast.mensaje}
        </div>
      )}
    </div>
  );
}