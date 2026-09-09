import React, { useState, useEffect } from 'react';
import { obtenerProductos } from '../services/api';
import '../assests/css/catalogo.css';

// 🌟 IMPORTACIÓN DIRECTA DE TUS IMÁGENES (Con un solo nivel ../ porque estás en src/components/)
import imgCar966 from '../assests/IMG/car966.png';
import imgPuli from '../assests/IMG/puli.png';
import imgEx from '../assests/IMG/ex.png';
import imgRoto from '../assests/IMG/roto.png';

// Creamos un diccionario seguro para asociar el nombre del archivo con su importación
const MAPA_IMAGENES = {
  'car966.png': imgCar966,
  'puli.png': imgPuli,
  'ex.png': imgEx,
  'roto.png': imgRoto
};

// DATOS DE PRUEBA (MOCK)
const PRODUCTOS_DE_PRUEBA = [
  {
    product_id: 1,
    name: 'Cargador Frontal 966',
    type: 'Maquinaria',
    description: 'Maquinaria pesada ideal para movimiento de tierras y carga de materiales.',
    model_number: 'CAT-966',
    stock_quantity: 4,
    status: 'available',
    image_url: 'car966.png',
    pdf_url: '/docs/CAT-966.pdf'
  },
  {
    product_id: 2,
    name: 'Pulidora Industrial',
    type: 'Herramientas',
    description: 'Herramienta de alto rendimiento para corte y pulido de superficies.',
    model_number: 'PUL-2000',
    stock_quantity: 12,
    status: 'available',
    image_url: 'puli.png',
    pdf_url: null
  },
  {
    product_id: 3,
    name: 'Excavadora Hidráulica',
    type: 'Maquinaria',
    description: 'Excavadora de orugas para excavación profunda y demolición.',
    model_number: 'EXC-320',
    stock_quantity: 2,
    status: 'available',
    image_url: 'ex.png',
    pdf_url: null
  },
  {
    product_id: 4,
    name: 'Rotomartillo SDS',
    type: 'Herramientas',
    description: 'Herramienta para perforación en concreto y mampostería.',
    model_number: 'ROTO-800',
    stock_quantity: 8,
    status: 'available',
    image_url: 'roto.png',
    pdf_url: null
  }
];

export default function Catalogo({ darkMode }) {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos');
  const [cargando, setCargando] = useState(true);

  // ESTADO PARA EL MODAL DE FICHA TÉCNICA
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // ESTADO PARA LA NOTIFICACIÓN FLOTANTE DE COTIZACIÓN
  const [mensajeCotizacion, setMensajeCotizacion] = useState(null);

  // ESTADO DEL CARRITO DE COTIZACIÓN
  const [carrito, setCarrito] = useState(() => {
    const guardado = localStorage.getItem('carrito_cotizacion');
    return guardado ? JSON.parse(guardado) : [];
  });

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('carrito_cotizacion', JSON.stringify(carrito));
  }, [carrito]);

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    try {
      setCargando(true);
      const data = await obtenerProductos();

      if (data && data.length > 0) {
        setProductos(data);
      } else {
        setProductos(PRODUCTOS_DE_PRUEBA);
      }
    } catch (err) {
      console.warn('Backend no detectado. Modo diseño activado.');
      setProductos(PRODUCTOS_DE_PRUEBA);
    } finally {
      setCargando(false);
    }
  }

  // Resolver la ruta de la imagen local usando el mapa estático de confianza
  function obtenerRutaImagen(nombreImagen) {
    if (!nombreImagen) return null;

    let nombreArchivo = nombreImagen;
    
    if (nombreImagen.startsWith('http')) {
      if (nombreImagen.includes('img.example.com')) {
        const partes = nombreImagen.split('/');
        nombreArchivo = partes[partes.length - 1];
      } else {
        return nombreImagen;
      }
    }

    const nombreLimpio = nombreArchivo.replace(/^\/?(IMG\/)?/, '').trim().toLowerCase();

    return MAPA_IMAGENES[nombreLimpio] || null;
  }

  // AGREGAR AL CARRITO DE COTIZACIÓN
  function agregarACotizacion(producto) {
    setCarrito((actual) => {
      const existe = actual.find((item) => item.product_id === producto.product_id);
      if (existe) {
        return actual.map((item) =>
          item.product_id === producto.product_id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...actual, { ...producto, cantidad: 1 }];
    });

    setMensajeCotizacion(`¡"${producto.name}" se agregó a tu lista de cotización! 📋`);
    
    setTimeout(() => {
      setMensajeCotizacion(null);
    }, 3000);
  }

  function abrirFichaTecnica(producto) {
    if (producto.pdf_url) {
      window.open(producto.pdf_url, '_blank');
    } else {
      setProductoSeleccionado(producto);
    }
  }

  const productosFiltrados = productos.filter((item) => {
    const texto = busqueda.toLowerCase();
    const coincideTexto =
      item.name?.toLowerCase().includes(texto) ||
      item.type?.toLowerCase().includes(texto) ||
      item.model_number?.toLowerCase().includes(texto);

    const coincideCategoria =
      categoriaSeleccionada === 'todos' ||
      item.type?.toLowerCase() === categoriaSeleccionada.toLowerCase();

    return coincideTexto && coincideCategoria;
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
        <h2 className="title-pro">Nuestros Productos</h2>

        <div className="filtros">
          <button
            type="button"
            className={categoriaSeleccionada === 'todos' ? 'activo' : ''}
            onClick={() => setCategoriaSeleccionada('todos')}
          >
            Todos
          </button>
          <button
            type="button"
            className={categoriaSeleccionada === 'maquinaria' ? 'activo' : ''}
            onClick={() => setCategoriaSeleccionada('maquinaria')}
          >
            Maquinaria
          </button>
          <button
            type="button"
            className={categoriaSeleccionada === 'herramientas' ? 'activo' : ''}
            onClick={() => setCategoriaSeleccionada('herramientas')}
          >
            Herramientas
          </button>
        </div>

        <div className="buscador">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, categoría o modelo..."
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

        {!cargando && (
          <div className="grid-productos">
            {productosFiltrados.map((item) => {
              const srcImagen = obtenerRutaImagen(item.image_url);

              return (
                <div key={item.product_id} className="card">
                  <div>
                    {item.type && (
                      <span className="categoria-tag">{item.type}</span>
                    )}

                    <div className="img-pro">
                      {srcImagen ? (
                        <img src={srcImagen} alt={item.name} />
                      ) : (
                        <div className="img-placeholder">
                          <span>⚙️</span>
                        </div>
                      )}
                    </div>

                    <h3 className="title">{item.name}</h3>

                    <p className="text">
                      {item.description || 'Sin descripción disponible.'}
                    </p>

                    <div style={{ marginTop: '15px', fontSize: '14px' }}>
                      {item.model_number && (
                        <p>
                          <strong>Modelo:</strong> {item.model_number}
                        </p>
                      )}
                      <p>
                        <strong>Disponibles:</strong> {item.stock_quantity}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button
                      type="button"
                      className="btn-pro"
                      style={{ flex: 1, margin: 0 }}
                      onClick={() => abrirFichaTecnica(item)}
                    >
                      Leer más 📄
                    </button>

                    <button
                      type="button"
                      className="btn-pro"
                      style={{
                        flex: 1,
                        margin: 0,
                        backgroundColor: '#2e7d32'
                      }}
                      onClick={() => agregarACotizacion(item)}
                    >
                      + Cotizar 🛒
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!cargando && productosFiltrados.length === 0 && (
          <p className="sin-resultados">
            No se encontraron productos en esta categoría o búsqueda.
          </p>
        )}
      </section>

      {productoSeleccionado && (
        <div className="modal-overlay-custom" onClick={() => setProductoSeleccionado(null)}>
          <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>📄 Ficha Técnica: {productoSeleccionado.name}</h3>
              <button className="btn-close-custom" onClick={() => setProductoSeleccionado(null)}>✕</button>
            </div>
            
            <div className="modal-body-custom">
              <p><strong>Modelo:</strong> {productoSeleccionado.model_number || 'N/A'}</p>
              <p><strong>Categoría:</strong> {productoSeleccionado.type}</p>
              <p><strong>Descripción:</strong> {productoSeleccionado.description || 'Sin detalles adicionales.'}</p>
              <p><strong>Stock Disponible:</strong> {productoSeleccionado.stock_quantity}</p>
            </div>

            <div className="modal-footer-custom" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              {productoSeleccionado.pdf_url ? (
                <a 
                  href={productoSeleccionado.pdf_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-pro"
                  style={{ textAlign: 'center', textDecoration: 'none', flex: 1 }}
                >
                  Ver Documento PDF 📑
                </a>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#aaa', alignSelf: 'center', flex: 1 }}>
                  Este equipo no cuenta con un PDF externo adjunto.
                </p>
              )}
              
              <button 
                type="button" 
                className="btn-pro" 
                style={{ backgroundColor: '#d32f2f', flex: 1 }}
                onClick={() => setProductoSeleccionado(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {mensajeCotizacion && (
        <div className="toast-notificacion">
          <span>{mensajeCotizacion}</span>
        </div>
      )}

      <footer>
        <p>© 2026 CE Constructora | Todos los derechos reservados</p>
      </footer>
    </div>
  );
}