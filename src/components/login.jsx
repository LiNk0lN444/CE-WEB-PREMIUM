import React, { useState } from 'react';
import '../assests/css/login.css'; // Ajusta la ruta a tu archivo CSS si difiere

export const Login = ({ onLoginSuccess, onCancel }) => {
  const [esRegistro, setEsRegistro] = useState(false);

  // Estados del Formulario
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (esRegistro) {
      // Validaciones de Registro
      if (!username || !email || !password) {
        setError('Por favor, completa todos los campos obligatorios.');
        return;
      }

      // Obtener usuarios locales para simular persistencia
      const usuariosExistentes = JSON.parse(localStorage.getItem('bd_users')) || [];
      const yaExiste = usuariosExistentes.some((u) => u.email === email);

      if (yaExiste) {
        setError('El correo electrónico ya está registrado.');
        return;
      }

      const nuevoUsuario = {
        user_id: Date.now(),
        username,
        email,
        password, // En producción el backend encripta esto
        phone_number: phoneNumber,
        status: 'active',
        rol: 'Cliente'
      };

      usuariosExistentes.push(nuevoUsuario);
      localStorage.setItem('bd_users', JSON.stringify(usuariosExistentes));

      alert('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
      setEsRegistro(false);
      setPassword('');
    } else {
      // Validaciones de Login
      if (!email || !password) {
        setError('Por favor, ingresa tu correo y contraseña.');
        return;
      }

      const usuariosExistentes = JSON.parse(localStorage.getItem('bd_users')) || [];
      const usuarioValido = usuariosExistentes.find(
        (u) => u.email === email && u.password === password
      );

      // Credenciales de prueba si la lista está vacía
      if (usuarioValido || (email === 'admin@ceweb.com' && password === '123456')) {
        const usuarioSesion = usuarioValido || {
          user_id: 1,
          username: 'Administrador CE-Web',
          email: email,
          phone_number: '3000000000',
          rol: 'Admin'
        };

        if (onLoginSuccess) {
          onLoginSuccess(usuarioSesion);
        }
      } else {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        
        <div className="login-header">
          <h2 className="login-title">
            {esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>
          <p className="login-subtitle">
            {esRegistro
              ? 'Ingresa tus datos para registrarte en CE-Web'
              : 'Ingresa tus credenciales para acceder a la plataforma'}
          </p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {/* Campo Nombre de Usuario (Solo en Registro) */}
          {esRegistro && (
            <div className="form-group">
              <label className="form-label">Nombre Completo / Usuario *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="form-input"
              />
            </div>
          )}

          {/* Campo Correo */}
          <div className="form-group">
            <label className="form-label">Correo Electrónico *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="form-input"
            />
          </div>

          {/* Campo Teléfono (Solo en Registro) */}
          {esRegistro && (
            <div className="form-group">
              <label className="form-label">Teléfono (Opcional)</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="300 123 4567"
                className="form-input"
              />
            </div>
          )}

          {/* Campo Contraseña */}
          <div className="form-group">
            <label className="form-label">Contraseña *</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input form-input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password-btn"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Botón Principal */}
          <button type="submit" className="submit-btn">
            {esRegistro ? 'Registrarse' : 'Ingresar'}
          </button>

          {onCancel && (
            <button
              type="button"
              className="cot-btn-secundario"
              onClick={onCancel}
              style={{ marginTop: '0.5rem', width: '100%' }}
            >
              Volver al Inicio
            </button>
          )}
        </form>

        {/* Pie de Alternancia Login/Registro */}
        <div className="login-footer">
          {esRegistro ? (
            <>
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                className="register-link"
                onClick={() => {
                  setEsRegistro(false);
                  setError('');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Inicia sesión aquí
              </button>
            </>
          ) : (
            <>
              ¿No tienes una cuenta?{' '}
              <button
                type="button"
                className="register-link"
                onClick={() => {
                  setEsRegistro(true);
                  setError('');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Regístrate aquí
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};