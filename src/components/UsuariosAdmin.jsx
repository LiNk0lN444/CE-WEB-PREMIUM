import React, { useState, useEffect, useMemo } from 'react';
import '../assests/css/AdminPanels.css';
import {
  adminListarUsuarios,
  adminCrearUsuario,
  adminActualizarUsuario,
  adminEliminarUsuario,
} from '../services/api';

const FORM_VACIO = {
  username: '',
  email: '',
  phone_number: '',
  status: 'active',
  password: '',
};

const ROL_LABEL = { client: 'Cliente', asesor: 'Asesor' };
const ESTADO_LABEL = { active: 'Activo', inactive: 'Inactivo' };

export default function UsuariosAdmin({ darkMode }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // Filtros (se aplican en el navegador; la lista es pequeña)
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Modal crear/editar
  const [modal, setModal] = useState(null); // null | { modo: 'crear' | 'editar', usuario? }
  const [form, setForm] = useState(FORM_VACIO);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Confirmación de eliminar
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  const [toast, setToast] = useState(null);
  const mostrarToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Escape cierra los diálogos
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (!guardando) setModal(null);
      if (!eliminando) setAEliminar(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [guardando, eliminando]);

  async function cargarUsuarios() {
    try {
      setCargando(true);
      setErrorCarga('');
      setUsuarios(await adminListarUsuarios());
    } catch (err) {
      setErrorCarga(err.message);
    } finally {
      setCargando(false);
    }
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (filtroRol && u.role !== filtroRol) return false;
      if (filtroEstado && u.status !== filtroEstado) return false;
      if (!q) return true;
      return [u.username, u.email, u.phone_number]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  const formatoFecha = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

  // ---------- Crear / editar ----------
  function abrirCrear() {
    setForm(FORM_VACIO);
    setErrorForm('');
    setModal({ modo: 'crear' });
  }

  function abrirEditar(u) {
    setForm({
      username: u.username,
      email: u.email,
      phone_number: u.phone_number || '',
      status: u.status,
      password: '',
    });
    setErrorForm('');
    setModal({ modo: 'editar', usuario: u });
  }

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  function validar() {
    if (form.username.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Ingresa un correo válido.';
    if (modal.modo === 'crear' && form.password.length < 6)
      return 'La contraseña debe tener al menos 6 caracteres.';
    if (modal.modo === 'editar' && form.password && form.password.length < 6)
      return 'La nueva contraseña debe tener al menos 6 caracteres.';
    return '';
  }

  async function handleGuardar(e) {
    e.preventDefault();
    const problema = validar();
    if (problema) {
      setErrorForm(problema);
      return;
    }

    const datos = {
      username: form.username.trim(),
      email: form.email.trim(),
      phone_number: form.phone_number.trim() || null,
      status: form.status,
    };
    if (form.password) datos.password = form.password;

    try {
      setGuardando(true);
      setErrorForm('');
      if (modal.modo === 'crear') {
        await adminCrearUsuario(datos);
        mostrarToast('Usuario creado correctamente ✅');
      } else {
        await adminActualizarUsuario(modal.usuario.user_id, datos);
        mostrarToast('Usuario actualizado ✅');
      }
      setModal(null);
      await cargarUsuarios();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  // ---------- Activar / desactivar ----------
  async function handleToggleEstado(u) {
    const nuevo = u.status === 'active' ? 'inactive' : 'active';
    try {
      await adminActualizarUsuario(u.user_id, { status: nuevo });
      mostrarToast(nuevo === 'active' ? 'Usuario activado' : 'Usuario desactivado', 'info');
      await cargarUsuarios();
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  }

  // ---------- Eliminar ----------
  async function handleEliminar() {
    try {
      setEliminando(true);
      setErrorEliminar('');
      await adminEliminarUsuario(aEliminar.user_id);
      setAEliminar(null);
      mostrarToast('Usuario eliminado 🗑️', 'info');
      await cargarUsuarios();
    } catch (err) {
      setErrorEliminar(err.message);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className={`adm-page ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className="adm-main">
        <div className="adm-titulo">
          <div>
            <h1>Gestión de Usuarios</h1>
            <p>Crea, edita, activa o elimina las cuentas de clientes y asesores.</p>
          </div>
          <button className="adm-btn adm-btn-primary" onClick={abrirCrear}>
            + Nuevo usuario
          </button>
        </div>

        <div className="adm-filtros">
          <input
            className="adm-input"
            type="search"
            placeholder="Buscar por nombre, correo o teléfono…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar usuarios"
          />
          <select className="adm-select" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} aria-label="Filtrar por rol">
            <option value="">Todos los roles</option>
            <option value="client">Clientes</option>
            <option value="asesor">Asesores</option>
          </select>
          <select className="adm-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>

        {errorCarga && <div className="adm-error">{errorCarga}</div>}
        {cargando && <p className="adm-cargando">Cargando usuarios…</p>}

        {!cargando && !errorCarga && (
          <div className="adm-tabla-wrap">
            {visibles.length === 0 ? (
              <p className="adm-vacio">
                {usuarios.length === 0 ? 'Aún no hay usuarios registrados.' : 'Ningún usuario coincide con la búsqueda.'}
              </p>
            ) : (
              <table className="adm-tabla">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((u) => (
                    <tr key={u.user_id}>
                      <td>{u.user_id}</td>
                      <td>
                        <strong>{u.username}</strong>
                        <br />
                        <small>{u.email}</small>
                      </td>
                      <td>{u.phone_number || '—'}</td>
                      <td>
                        <span className={`adm-badge adm-badge-${u.role}`}>{ROL_LABEL[u.role] || u.role}</span>
                      </td>
                      <td>
                        <span className={`adm-badge adm-badge-${u.status}`}>{ESTADO_LABEL[u.status] || u.status}</span>
                      </td>
                      <td>{formatoFecha(u.date_registered)}</td>
                      <td>
                        <div className="adm-acciones">
                          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => abrirEditar(u)}>
                            Editar
                          </button>
                          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => handleToggleEstado(u)}>
                            {u.status === 'active' ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            className="adm-btn adm-btn-danger adm-btn-sm"
                            onClick={() => {
                              setErrorEliminar('');
                              setAEliminar(u);
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {!cargando && !errorCarga && usuarios.length > 0 && (
          <p className="adm-nota">
            Mostrando {visibles.length} de {usuarios.length} usuarios. Los asesores se crean desde el módulo de
            asesores; las cuentas de administrador no se gestionan aquí.
          </p>
        )}
      </div>

      {/* ───── Modal crear / editar ───── */}
      {modal && (
        <div className="adm-overlay" onClick={() => !guardando && setModal(null)}>
          <form
            className="adm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adm-modal-titulo"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleGuardar}
            noValidate
          >
            <h2 id="adm-modal-titulo">{modal.modo === 'crear' ? 'Nuevo usuario' : 'Editar usuario'}</h2>

            {errorForm && <div className="adm-error">{errorForm}</div>}

            <div className="adm-campo">
              <label htmlFor="u-nombre">Nombre</label>
              <input id="u-nombre" className="adm-input" value={form.username} onChange={cambiar('username')} autoFocus />
            </div>
            <div className="adm-campo">
              <label htmlFor="u-email">Correo</label>
              <input id="u-email" className="adm-input" type="email" value={form.email} onChange={cambiar('email')} />
            </div>
            <div className="adm-campo">
              <label htmlFor="u-tel">Teléfono (opcional)</label>
              <input id="u-tel" className="adm-input" value={form.phone_number} onChange={cambiar('phone_number')} maxLength={15} />
            </div>
            <div className="adm-campo">
              <label htmlFor="u-estado">Estado</label>
              <select id="u-estado" className="adm-select" value={form.status} onChange={cambiar('status')}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo (no puede iniciar sesión)</option>
              </select>
            </div>
            <div className="adm-campo">
              <label htmlFor="u-pass">{modal.modo === 'crear' ? 'Contraseña' : 'Nueva contraseña (opcional)'}</label>
              <input
                id="u-pass"
                className="adm-input"
                type="password"
                value={form.password}
                onChange={cambiar('password')}
                autoComplete="new-password"
              />
              <span className="adm-ayuda">
                {modal.modo === 'crear' ? 'Mínimo 6 caracteres.' : 'Déjala vacía para conservar la actual.'}
              </span>
            </div>

            <div className="adm-modal-acciones">
              <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setModal(null)} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ───── Confirmar eliminar ───── */}
      {aEliminar && (
        <div className="adm-overlay" onClick={() => !eliminando && setAEliminar(null)}>
          <div className="adm-modal" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Eliminar usuario</h2>
            <p>
              ¿Seguro que quieres eliminar a <strong>{aEliminar.username}</strong> ({aEliminar.email})? Esta acción
              no se puede deshacer.
            </p>
            {errorEliminar && <div className="adm-error">{errorEliminar}</div>}
            <div className="adm-modal-acciones">
              <button className="adm-btn adm-btn-ghost" onClick={() => setAEliminar(null)} disabled={eliminando}>
                Cancelar
              </button>
              <button className="adm-btn adm-btn-danger" onClick={handleEliminar} disabled={eliminando}>
                {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast-notificacion toast-${toast.tipo}`}>{toast.msg}</div>}
    </div>
  );
}
