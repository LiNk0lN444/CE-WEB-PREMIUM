import React, { useState, useEffect } from 'react';
import { obtenerProductos } from '../services/api';
import '../assests/css/catalogo.css';

export default function Catalogo({ darkMode }) {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    try {
      setCargando(true);
      setError('');

      const data = await obtenerProductos();
      setProductos(data);
    } catch (error) {
      console.error('Error cargando catálogo:', error);
      setError(
        'No fue posible cargar los productos. Verifica que FastAPI esté ejecutándose.'
      );
    } finally {
      setCargando(false);
    }
  }

  const productosFiltrados = productos.filter((item) => {
    const texto = busqueda.toLowerCase();

    return (
      item.name?.toLowerCase().includes(texto) ||
      item.type?.toLowerCase().includes(texto) ||
      item.model_number?.toLowerCase().includes(texto)
    );
  });

  return (
    <div className={`catalogo-page ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <section id="inicio" className="hero">
        <div className="hero-content">
          <h1>Catálogo</h1>
          <p>
            En este espacio podrás visualizar nuestra maquinaria y herramientas disponibles.
          </p>

          <a href="#catalogo" className="btn">
            Ver catálogo
          </a>
        </div>
      </section>

      <section id="catalogo" className="section">
        <h2 className="title-pro">
          Nuestros Productos
        </h2>

        <div className="buscador">
          <input
            type="text"
            placeholder="🔍 Buscar producto..."
            autoComplete="off"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {cargando && (
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>
            Cargando catálogo...
          </p>
        )}

        {error && (
          <div className="sin-resultados">
            <p>{error}</p>

            <button
              className="btn"
              onClick={cargarProductos}
            >
              Intentar nuevamente
            </button>
          </div>
        )}

        {!cargando && !error && (
          <div className="grid-productos">
            {productosFiltrados.map((item) => (
              <div
                key={item.product_id}
                className="tarjeta-producto"
              >
                <img
                  src={
                    item.image_url
                      ? item.image_url.startsWith('http') || item.image_url.startsWith('/')
                        ? item.image_url
                        : `/IMG/${item.image_url}`
                      : 'https://via.placeholder.com/300x200?text=Sin+imagen'
                  }
                  alt={item.name}
                />

                <div className="producto-info">
                  <span className="producto-tipo">
                    {item.type}
                  </span>

                  <h3>
                    {item.name}
                  </h3>

                  <p>
                    {item.description || 'Sin descripción disponible.'}
                  </p>

                  {item.model_number && (
                    <p>
                      <strong>Modelo:</strong>{' '}
                      {item.model_number}
                    </p>
                  )}

                  <p>
                    <strong>Disponibles:</strong>{' '}
                    {item.stock_quantity}
                  </p>

                  <p>
                    <strong>Estado:</strong>{' '}
                    {item.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!cargando &&
          !error &&
          productosFiltrados.length === 0 && (
            <p className="sin-resultados">
              No se encontraron productos con ese criterio.
            </p>
          )}
      </section>

      <footer>
        <p>
          © 2026 CE Constructora | Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
}