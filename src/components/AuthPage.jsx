import React, { useState } from 'react';
import '../assests/css/AuthPage.css';
import { obtenerUsuarios, crearUsuario } from '../services/api';

export default function AuthPage({ onLoginSuccess, onCancel }) {
  const [isLogin, setIsLogin] = useState(true);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔔 Toast local
  const [toast, setToast] = useState(null);
  const mostrarToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const usuarios = await obtenerUsuarios();

      const usuarioEncontrado = usuarios.find(
        (u) => u.email && u.email.trim().toLowerCase() === loginEmail.trim().toLowerCase()
      );

      if (!usuarioEncontrado) {
        throw new Error('El correo ingresado no está registrado.');
      }

      if (onLoginSuccess) onLoginSuccess(usuarioEncontrado);
    } catch (err) {
      setError(err.message || 'No fue posible iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await crearUsuario({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        phone_number: regPhone,
        status: 'active'
      });

      mostrarToast('¡Usuario registrado con éxito! 🎉');
      setIsLogin(true);
    } catch (err) {
      setError(err.message || 'No fue posible completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <style>{`
        .auth-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          width: 100%;
          background: #0b0b0c;
          background-image:
            radial-gradient(ellipse 800px 500px at 50% -10%, rgba(178,20,32,0.18), transparent 60%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          padding: 24px;
          box-sizing: border-box;
        }

        .auth-card {
          position: relative;
          background: #141416;
          padding: 40px 36px;
          width: 100%;
          max-width: 400px;
          border: 1px solid #2a2a2d;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }

        .auth-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: #b21420;
        }

        .auth-toggle-buttons {
          display: flex;
          margin-bottom: 30px;
          border-bottom: 1px solid #2a2a2d;
        }

        .auth-toggle-buttons button {
          flex: 1;
          background: transparent;
          border: none;
          padding: 12px 4px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          color: #6f6f75;
          position: relative;
          transition: color 0.2s ease;
        }

        .auth-toggle-buttons button.active {
          color: #f2f0ee;
        }

        .auth-toggle-buttons button.active::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background: #b21420;
        }

        .auth-toggle-buttons button:hover {
          color: #d8d6d4;
        }

        .login-error {
          color: #ff6b6b !important;
          background: rgba(178,20,32,0.1);
          border: 1px solid rgba(178,20,32,0.35);
          padding: 10px 12px;
          margin-bottom: 18px !important;
          font-size: 13px !important;
          text-align: left !important;
          line-height: 1.4;
        }

        .auth-form h2 {
          margin: 0 0 24px 0;
          font-size: 21px;
          font-weight: 600;
          color: #f2f0ee;
          text-align: left;
          letter-spacing: -0.01em;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 12.5px;
          color: #9a989c;
        }

        .form-group input {
          width: 100%;
          padding: 11px 12px;
          background: #1c1c1f;
          border: 1px solid #303034;
          border-radius: 4px;
          color: #f2f0ee;
          font-size: 14px;
          box-sizing: border-box;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .form-group input::placeholder {
          color: #55545a;
        }

        .form-group input:focus {
          border-color: #b21420;
          background: #202023;
          outline: none;
        }

        .auth-btn {
          width: 100%;
          padding: 13px;
          background: #b21420;
          color: #f2f0ee;
          border: none;
          border-radius: 4px;
          font-size: 14.5px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          margin-top: 8px;
          transition: background 0.2s ease;
        }

        .auth-btn:hover:not(:disabled) {
          background: #8f0f19;
        }

        .auth-btn:disabled {
          background: #4a2226;
          color: #8a7a7c;
          cursor: not-allowed;
        }

        .cot-btn-secundario {
          background: transparent;
          border: 1px solid #303034;
          color: #9a989c;
          border-radius: 4px;
          padding: 11px;
          font-size: 13.5px;
          transition: border-color 0.2s ease, color 0.2s ease;
        }

        .cot-btn-secundario:hover {
          border-color: #6f6f75;
          color: #f2f0ee;
        }
      `}</style>

      <div className="auth-card">
        <div className="auth-toggle-buttons">
          <button
            className={isLogin ? 'active' : ''}
            onClick={() => { setIsLogin(true); setError(''); }}
            type="button"
          >
            Iniciar Sesión
          </button>
          <button
            className={!isLogin ? 'active' : ''}
            onClick={() => { setIsLogin(false); setError(''); }}
            type="button"
          >
            Registrarse
          </button>
        </div>

        {error && <div className="login-error">{error}</div>}

        {isLogin ? (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <h2>Bienvenido de nuevo</h2>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            {onCancel && (
              <button
                type="button"
                className="cot-btn-secundario"
                onClick={onCancel}
                style={{ marginTop: '0.5rem', width: '100%', cursor: 'pointer' }}
              >
                Volver al Inicio
              </button>
            )}
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <h2>Crear Cuenta</h2>
            <div className="form-group">
              <label>Nombre de Usuario</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="text"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
            {onCancel && (
              <button
                type="button"
                className="cot-btn-secundario"
                onClick={onCancel}
                style={{ marginTop: '0.5rem', width: '100%', cursor: 'pointer' }}
              >
                Volver al Inicio
              </button>
            )}
          </form>
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