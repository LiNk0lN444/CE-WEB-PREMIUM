import React, { useState, useEffect } from 'react';
import { obtenerProductos } from '../services/api';
import '../assests/css/catalogo.css';

// Importación dinámica de imágenes locales
const imagenesLocales = import.meta.glob('../assests/IMG/*.{png,jpg,jpeg,svg}', {
  eager: true,
  import: 'default'
});

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

  // Resolver la ruta de la imagen local ignorando URLs de prueba del backend
  function obtenerRutaImagen(nombreImagen) {
    if (!nombreImagen) return null;

    let nombreArchivo = nombreImagen;
    
    // Si viene como URL completa
    if (nombreImagen.startsWith('http')) {
      // Si es una URL de prueba del tipo img.example.com, extraemos el nombre del archivo final
      if (nombreImagen.includes('img.example.com')) {
        const partes = nombreImagen.split('/');
        nombreArchivo = partes[partes.length - 1];
      } else {
        // Si es una URL externa real y válida, la devolvemos tal cual
        return nombreImagen;
      }
    }

    const nombreLimpio = nombreArchivo.replace(/^\/?(IMG\/)?/, '');
    
    // Buscar coincidencia insensible a mayúsculas/minúsculas en las imágenes locales
    const claveEncontrada = Object.keys(imagenesLocales).find((key) =>
      key.toLowerCase().endsWith(`/${nombreLimpio.toLowerCase()}`)
    );

    return claveEncontrada ? imagenesLocales[claveEncontrada] : null;
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

    alert(`¡"${producto.name}" se agregó a tu lista de cotización! 📋`);
  }

  // ABRIR PDF O LEER MÁS
  function abrirFichaTecnica(producto) {
    if (producto.pdf_url) {
      window.open(producto.pdf_url, '_blank');
    } else {
      alert(
        `📄 Ficha Técnica: ${producto.name}\n\n` +
        `Modelo: ${producto.model_number || 'N/A'}\n` +
        `Categoría: ${producto.type}\n` +
        `Descripción: ${producto.description || 'Sin detalles adicionales.'}`
      );
    }
  }

  // Filtrado de productos
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
      {/* HERO SECTION */}
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

      {/* SECCIÓN CATÁLOGO */}
      <section id="catalogo" className="section">
        <h2 className="title-pro">Nuestros Productos</h2>

        {/* BOTONES DE FILTRO */}
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

        {/* BUSCADOR */}
        <div className="buscador">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, categoría o modelo..."
            autoComplete="off"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* CARGANDO */}
        {cargando && (
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>
            Cargando catálogo...
          </p>
        )}

        {/* LISTADO DE PRODUCTOS */}
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

                  {/* BOTONES DE ACCIÓN EN CADA TARJETA */}
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

        {/* SIN RESULTADOS */}
        {!cargando && productosFiltrados.length === 0 && (
          <p className="sin-resultados">
            No se encontraron productos en esta categoría o búsqueda.
          </p>
        )}
      </section>

      {/* FOOTER */}
      <footer>
        <p>© 2026 CE Constructora | Todos los derechos reservados</p>
      </footer>
    </div>
  );
}
