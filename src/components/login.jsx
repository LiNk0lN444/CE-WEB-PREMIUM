import React, { useState } from 'react';

export const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validación básica
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    // Aquí conectas con tu servicio de autenticación o localStorage
    const usuarioSimulado = {
      nombre: 'Usuario',
      email: email,
      rol: 'Cliente'
    };

    if (onLoginSuccess) {
      onLoginSuccess(usuarioSimulado);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed px-4" style={{ backgroundImage: "url('/IMG/n.png')" }}>
      
      {/* Tarjeta de Login con estilo Glassmorphism */}
      <div className="w-full max-w-md p-8 rounded-2xl backdrop-blur-md bg-black/45 border border-white/20 shadow-2xl text-white">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-red-500 mb-2">Iniciar Sesión</h2>
          <p className="text-sm text-gray-200">Ingresa tus credenciales para acceder a tu cuenta</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo Correo */}
          <div>
            <label className="block text-sm font-semibold mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full px-4 py-3 rounded-xl bg-white/90 text-gray-900 border-2 border-transparent focus:border-red-500 focus:bg-white outline-none transition-all duration-200"
            />
          </div>

          {/* Campo Contraseña */}
          <div>
            <label className="block text-sm font-semibold mb-1">Contraseña</label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/90 text-gray-900 border-2 border-transparent focus:border-red-500 focus:bg-white outline-none transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-600 hover:text-gray-900 text-lg focus:outline-none"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Acciones */}
          <button
            type="submit"
            className="w-full py-3 bg-red-500 hover:bg-white hover:text-red-500 font-bold text-white rounded-xl transition-all duration-300 shadow-md"
          >
            Ingresar
          </button>
        </form>

        {/* Pie de Registro */}
        <div className="mt-6 text-center text-sm text-gray-300">
          ¿No tienes una cuenta?{' '}
          <a href="#registro" className="text-red-400 font-semibold hover:underline">
            Regístrate aquí
          </a>
        </div>
      </div>
    </div>
  );
};