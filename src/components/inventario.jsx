import React, { useState, useEffect } from 'react';
import {
  obtenerInventario,
  obtenerProductos,
  eliminarItemInventario,
  actualizarItemInventario
} from '../services/api';

import '../assests/css/inventario.css';

export default function Inventario({ darkMode }) {
  const [inventario, setInventario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // ==========================================
  // ESTADOS DEL MODAL DE EDICIÓN
  // ==========================================

  const [modalEditar, setModalEditar] = useState(false);

  const [registroEditando, setRegistroEditando] = useState(null);

  const [formulario, setFormulario] = useState({
    product_id: '',
    quantity: '',
    initial_price: ''
  });

  const [guardando, setGuardando] = useState(false);


  // ==========================================
  // CARGAR INVENTARIO Y PRODUCTOS
  // ==========================================

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      setError('');

      const [datosInventario, datosProductos] = await Promise.all([
        obtenerInventario(),
        obtenerProductos()
      ]);

      setInventario(datosInventario);
      setProductos(datosProductos);

    } catch (error) {
      console.error('Error cargando inventario:', error);

      setError(
        'No fue posible cargar la información del inventario.'
      );

    } finally {
      setCargando(false);
    }
  }


  // ==========================================
  // BUSCAR PRODUCTO POR ID
  // ==========================================

  function buscarProducto(productId) {
    return productos.find(
      (producto) => producto.product_id === productId
    );
  }


  // ==========================================
  // ELIMINAR REGISTRO
  // ==========================================

  async function manejarEliminar(inventoryId, nombreProducto) {
    const confirmar = window.confirm(
      `¿Estás segura de que deseas eliminar "${nombreProducto}" del inventario?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await eliminarItemInventario(inventoryId);

      setInventario((inventarioActual) =>
        inventarioActual.filter(
          (item) => item.inventory_id !== inventoryId
        )
      );

      alert('Registro eliminado correctamente.');

    } catch (error) {
      console.error('Error eliminando registro:', error);

      alert(
        `No fue posible eliminar el registro: ${error.message}`
      );
    }
  }


  // ==========================================
  // ABRIR MODAL DE EDICIÓN
  // ==========================================

  function manejarEditar(item) {
    setRegistroEditando(item);

    setFormulario({
      product_id: item.product_id,
      quantity: item.quantity,
      initial_price: item.initial_price
    });

    setModalEditar(true);
  }


  // ==========================================
  // CAMBIAR VALORES DEL FORMULARIO
  // ==========================================

  function manejarCambio(event) {
    const { name, value } = event.target;

    setFormulario((datosActuales) => ({
      ...datosActuales,
      [name]: value
    }));
  }


  // ==========================================
  // GUARDAR CAMBIOS
  // ==========================================

  async function manejarGuardarCambios(event) {
    event.preventDefault();

    if (!registroEditando) {
      return;
    }

    try {
      setGuardando(true);

      const datosActualizados = {
        product_id: Number(formulario.product_id),
        quantity: Number(formulario.quantity),
        initial_price: Number(formulario.initial_price)
      };

      const respuesta = await actualizarItemInventario(
        registroEditando.inventory_id,
        datosActualizados
      );

      setInventario((inventarioActual) =>
        inventarioActual.map((item) =>
          item.inventory_id === respuesta.inventory_id
            ? respuesta
            : item
        )
      );

      setModalEditar(false);
      setRegistroEditando(null);

      alert('Registro actualizado correctamente.');

    } catch (error) {
      console.error('Error actualizando registro:', error);

      alert(
        `No fue posible actualizar el registro: ${error.message}`
      );

    } finally {
      setGuardando(false);
    }
  }


  // ==========================================
  // CERRAR MODAL
  // ==========================================

  function cerrarModal() {
    if (guardando) {
      return;
    }

    setModalEditar(false);
    setRegistroEditando(null);
  }


  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div
      className={`inventario-container ${
        darkMode ? 'theme-dark' : 'theme-light'
      }`}
    >

      {/* ENCABEZADO */}

      <div className="inventario-encabezado">
        <div>
          <h2>Gestión de Inventario</h2>

          <p>
            Administra y controla los productos registrados en el sistema.
          </p>
        </div>

        <button
          type="button"
          className="btn-agregar"
        >
          + Agregar registro
        </button>
      </div>


      {/* CARGANDO */}

      {cargando && (
        <div className="inventario-mensaje">
          Cargando información...
        </div>
      )}


      {/* ERROR */}

      {error && (
        <div className="inventario-error">
          <p>{error}</p>

          <button
            type="button"
            onClick={cargarDatos}
          >
            Intentar nuevamente
          </button>
        </div>
      )}


      {/* TABLA */}

      {!cargando && !error && (
        <div className="tabla-responsive">

          <table className="tabla-inventario">

            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio inicial</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>

              {inventario.length > 0 ? (

                inventario.map((item) => {

                  const producto = buscarProducto(
                    item.product_id
                  );

                  return (

                    <tr key={item.inventory_id}>

                      <td className="col-id">
                        #{item.inventory_id}
                      </td>

                      <td className="producto-nombre">
                        {producto
                          ? producto.name
                          : `Producto ${item.product_id}`}
                      </td>

                      <td>
                        <span className="tipo-badge">
                          {producto
                            ? producto.type
                            : 'Sin información'}
                        </span>
                      </td>

                      <td className="descripcion">
                        {producto?.description ||
                          'Sin descripción disponible'}
                      </td>

                      <td>
                        <span className="cantidad-badge">
                          {item.quantity}
                        </span>
                      </td>

                      <td className="precio">
                        $
                        {Number(
                          item.initial_price
                        ).toLocaleString('es-CO')}
                      </td>

                      <td>
                        <span
                          className={`estado ${
                            producto?.status === 'available'
                              ? 'disponible'
                              : 'no-disponible'
                          }`}
                        >
                          {producto?.status || 'Desconocido'}
                        </span>
                      </td>

                      <td>
                        <div className="acciones">

                          {/* EDITAR */}

                          <button
                            type="button"
                            className="btn-editar"
                            title="Editar registro"
                            onClick={() => manejarEditar(item)}
                          >
                            ✏️
                          </button>


                          {/* ELIMINAR */}

                          <button
                            type="button"
                            className="btn-eliminar"
                            title="Eliminar registro"
                            onClick={() =>
                              manejarEliminar(
                                item.inventory_id,
                                producto?.name ||
                                  `Producto ${item.product_id}`
                              )
                            }
                          >
                            🗑️
                          </button>

                        </div>
                      </td>

                    </tr>

                  );
                })

              ) : (

                <tr>
                  <td
                    colSpan="8"
                    className="sin-inventario"
                  >
                    No hay registros en el inventario.
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>
      )}


      {/* =====================================
          MODAL EDITAR
      ====================================== */}

      {modalEditar && (
        <div
          className="modal-overlay"
          onClick={cerrarModal}
        >

          <div
            className="modal-editar"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="modal-header">

              <div>
                <h3>Editar registro</h3>

                <p>
                  Actualiza la información del inventario.
                </p>
              </div>

              <button
                type="button"
                className="btn-cerrar-modal"
                onClick={cerrarModal}
              >
                ×
              </button>

            </div>


            <form
              className="formulario-editar"
              onSubmit={manejarGuardarCambios}
            >

              {/* PRODUCTO */}

              <div className="campo-formulario">

                <label htmlFor="product_id">
                  Producto
                </label>

                <select
                  id="product_id"
                  name="product_id"
                  value={formulario.product_id}
                  onChange={manejarCambio}
                  required
                >

                  <option value="">
                    Selecciona un producto
                  </option>

                  {productos.map((producto) => (

                    <option
                      key={producto.product_id}
                      value={producto.product_id}
                    >
                      {producto.name}
                    </option>

                  ))}

                </select>

              </div>


              {/* CANTIDAD */}

              <div className="campo-formulario">

                <label htmlFor="quantity">
                  Cantidad
                </label>

                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="0"
                  value={formulario.quantity}
                  onChange={manejarCambio}
                  required
                />

              </div>


              {/* PRECIO */}

              <div className="campo-formulario">

                <label htmlFor="initial_price">
                  Precio inicial
                </label>

                <input
                  type="number"
                  id="initial_price"
                  name="initial_price"
                  min="0"
                  step="0.01"
                  value={formulario.initial_price}
                  onChange={manejarCambio}
                  required
                />

              </div>


              {/* BOTONES */}

              <div className="modal-acciones">

                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-guardar"
                  disabled={guardando}
                >
                  {guardando
                    ? 'Guardando...'
                    : 'Guardar cambios'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}