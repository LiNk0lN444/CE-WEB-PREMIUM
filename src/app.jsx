import React, { useState, useEffect } from 'react';
import './assests/css/index.css';
import Catalogo from './components/catalogo';
import Cotizaciones from './components/cotizaciones';
import Inventario from './components/inventario';
import { Login } from './components/login';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [vistaActual, setVistaActual] = useState('inicio');

  // Estado global de la sesión del usuario
  const [usuarioSesion, setUsuarioSesion] = useState(() => {
    const sesionGuardada = localStorage.getItem('usuario_sesion');
    return sesionGuardada ? JSON.parse(sesionGuardada) : null;
  });

  const toggleTheme = () => setDarkMode(!darkMode);

  // Cada vez que cambia la vista, sube automáticamente al inicio de la página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [vistaActual]);

  const handleLoginSuccess = (usuario) => {
    setUsuarioSesion(usuario);
    localStorage.setItem('usuario_sesion', JSON.stringify(usuario));
    alert(`¡Bienvenido de nuevo, ${usuario.username || usuario.nombre || 'Usuario'}!`);
    setVistaActual('inicio');
  };

  const handleCerrarSesion = () => {
    setUsuarioSesion(null);
    localStorage.removeItem('usuario_sesion');
    alert('Sesión cerrada correctamente.');
    setVistaActual('inicio');
  };

  return (
    <div className={`app-root ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <header className="navbar-global">
        <div className="brand-title" onClick={() => setVistaActual('inicio')}>
          <span className="brand-accent">CE-Web</span>
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
            <li>
              <button 
                className={vistaActual === 'inventario' ? 'active' : ''} 
                onClick={() => setVistaActual('inventario')}
              >
                Inventario 🔒
              </button>
            </li>
            <li>
              <button 
                className={vistaActual === 'cotizaciones' ? 'active' : ''} 
                onClick={() => setVistaActual('cotizaciones')}
              >
                Cotizaciones
              </button>
            </li>

            {/* CONTROL DE AUTENTICACIÓN EN NAVBAR */}
            <li>
              {usuarioSesion ? (
                <button 
                  className="btn-hero-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  onClick={handleCerrarSesion}
                >
                  👤 {usuarioSesion.username || 'Usuario'} (Salir)
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
        {/* VISTA 1: INICIO */}
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
                    Alquiler de <span className="text-highlight">Herramientas y Maquinaria Pesada</span>
                  </h1>
                  <p className="hero-subtitle">
                    Plataforma inteligente para la gestión, cotizaciones instantáneas y control de equipos para tu obra.
                  </p>
                  
                  <div className="hero-actions">
                    <button className="btn-hero-primary" onClick={() => setVistaActual('catalogo')}>
                      Explorar Catálogo 🏗️
                    </button>
                    <button className="btn-hero-secondary" onClick={() => setVistaActual('cotizaciones')}>
                      Solicitar Cotización 📑
                    </button>
                  </div>
                </div>

                <div className="hero-visual-side">
                  <div className="glowing-sphere"></div>
                  <div className="mascot-card">
                    <div className="mascot-animated-icons">
                      <span className="icon-machine">🏗️</span>
                      <span className="icon-tool">🔨</span>
                    </div>
                    <div className="mascot-status">
                      <span className="status-dot"></span>
                      <span>Sistema Operativo Online</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="features-grid-section">
              <div className="section-header">
                <h2>Módulos del Sistema</h2>
                <p>Accede rápidamente a las funciones principales de la plataforma</p>
              </div>

              <div className="features-container">
                <div className="feature-card" onClick={() => setVistaActual('catalogo')}>
                  <div className="card-badge public">Público</div>
                  <div className="card-icon">🧰</div>
                  <h3>Catálogo de Herramientas y Equipos</h3>
                  <p>Explora disponibilidad y fichas técnicas de herramientas y flota pesada.</p>
                  <span className="card-link">Ver catálogo ➔</span>
                </div>

                <div className="feature-card" onClick={() => setVistaActual('cotizaciones')}>
                  <div className="card-badge auth">
                    {usuarioSesion ? 'Sesión Activa' : 'Requiere Login'}
                  </div>
                  <div className="card-icon">🧾</div>
                  <h3>Cotizador Digital</h3>
                  <p>Calcula presupuestos para proyectos por días o meses de forma automática.</p>
                  <span className="card-link">Cotizar ahora ➔</span>
                </div>

                <div className="feature-card admin-only" onClick={() => setVistaActual('inventario')}>
                  <div className="card-badge admin">Solo Administradores</div>
                  <div className="card-icon">📦</div>
                  <h3>Control de Inventario</h3>
                  <p>Gestión interna del stock, mantenimientos y bajas del equipo.</p>
                  <span className="card-link">Ingresar a Gestión ➔</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VISTA LOGIN / REGISTRO */}
        {vistaActual === 'login' && (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onCancel={() => setVistaActual('inicio')}
          />
        )}

        {/* VISTAS INDEPENDIENTES */}
        {vistaActual === 'catalogo' && (
          <div className="view-wrapper">
            <div className="page-header-banner">
              <h2>Catálogo de Equipos y Herramientas</h2>
              <p>Consulta nuestra flota disponible para alquiler inmediato</p>
            </div>
            <Catalogo darkMode={darkMode} />
          </div>
        )}

        {vistaActual === 'cotizaciones' && (
          <div className="view-wrapper">
            <div className="page-header-banner">
              <h2>Cotizador Digital</h2>
              <p>Genera tu presupuesto personalizado según la duración de tu obra</p>
            </div>
            <Cotizaciones 
              darkMode={darkMode} 
              onNavigateLogin={() => setVistaActual('login')} 
            />
          </div>
        )}

        {vistaActual === 'inventario' && (
          <div className="view-wrapper">
            <div className="page-header-banner">
              <h2>Módulo de Inventario</h2>
              <p>Gestión interna y mantenimiento de parque automotor y herramientas</p>
            </div>
            <Inventario darkMode={darkMode} />
          </div>
        )}
      </main>
    </div>
  );
}