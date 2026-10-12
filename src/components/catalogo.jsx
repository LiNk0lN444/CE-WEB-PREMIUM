import React, { useState, useEffect } from 'react';
import { obtenerProductos } from '../services/api';
import '../assests/css/catalogo.css';

// Carga dinámica de todas las imágenes de la carpeta IMG
const imagenesLocales = import.meta.glob('../assests/IMG/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  import: 'default',
});

// Convierte el mapa { '../assests/IMG/xxx.png': 'url' } a { 'xxx.png': 'url' }
const MAPA_IMAGENES = Object.fromEntries(
  Object.entries(imagenesLocales).map(([ruta, url]) => {
    const nombreArchivo = ruta.split('/').pop();
    return [nombreArchivo.toLowerCase(), url];
  })
);

// ==========================================
// Normaliza el tipo a "Maquinaria" o "Herramienta"
// ==========================================
function normalizarTipo(tipo) {
  if (!tipo) return 'Otro';
  const t = tipo.toLowerCase().trim();

  if (t.includes('maquin')) return 'Maquinaria';
  if (t.includes('herramient')) return 'Herramienta';

  return tipo;
}


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
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mensajeCotizacion, setMensajeCotizacion] = useState(null);

  const [carrito, setCarrito] = useState(() => {
    const guardado = localStorage.getItem('carrito_cotizacion');
    return guardado ? JSON.parse(guardado) : [];
  });

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
        const dataNormalizada = data.map((p) => ({
        ...p,
        type: normalizarTipo(p.type),
      }));
      setProductos(dataNormalizada);
      } else {
        setProductos(PRODUCTOS_DE_PRUEBA);
      }
    } catch {
      setProductos(PRODUCTOS_DE_PRUEBA);
    } finally {
      setCargando(false);
    }
  }

  function obtenerRutaImagen(nombreImagen) {
  if (!nombreImagen) return null;

  // Si ya es una URL completa (http/https), devolverla tal cual
  if (nombreImagen.startsWith('http://') || nombreImagen.startsWith('https://')) {
    return nombreImagen;
  }

  // Normalizar: minúsculas, sin espacios, sin rutas
  let nombre = nombreImagen
    .toLowerCase()
    .trim()
    .replace(/^\/?(IMG\/)?/i, '');   // quita "IMG/" o "/IMG/" al inicio

  // Buscar en el mapa
  if (MAPA_IMAGENES[nombre]) {
    return MAPA_IMAGENES[nombre];
  }

  // Búsqueda flexible: si el nombre no tiene extensión, probar con .png
  if (!nombre.includes('.')) {
    const nombrePng = `${nombre}.png`;
    if (MAPA_IMAGENES[nombrePng]) return MAPA_IMAGENES[nombrePng];
  }

  // No se encontró
  return null;
}

  function agregarACotizacion(producto) {
    // 🔴 Validar stock
  if (Number(producto.stock_quantity) <= 0) {
    setMensajeCotizacion(`"${producto.name}" está agotado. No se puede agregar. 🚫`);
    setTimeout(() => setMensajeCotizacion(null), 3000);
    return;
  }
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
    setTimeout(() => setMensajeCotizacion(null), 3000);
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

    let coincideCategoria = true;

  if (categoriaSeleccionada !== 'todos') {
    const tipoItem = (item.type || '').toLowerCase();
    const categoria = categoriaSeleccionada.toLowerCase();

    if (categoria === 'maquinaria') {
      coincideCategoria = tipoItem.includes('maquin');
    } else if (categoria === 'herramientas') {
      coincideCategoria = tipoItem.includes('herramient');
    } else {
      coincideCategoria = tipoItem === categoria;
    }
  }

  return coincideTexto && coincideCategoria;
});

  return (
    <div className={`catalogo-page ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <section id="inicio" className="hero">
        <div className="hero-content">
          <h1>Catálogo</h1>
          <p>En este espacio podrás visualizar nuestra maquinaria y herramientas disponibles.</p>
          <a href="#catalogo" className="btn">Ver catálogo</a>
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
                    {item.type && <span className="categoria-tag">{item.type}</span>}

                    <div className="img-pro">
                    {srcImagen ? (
                    <img src={srcImagen} alt={item.name} />
                    ) : (
                    <div className="img-placeholder">
                    <span>⚙️</span>
                    </div>
                    )}

                    {/* 🔴 Badge AGOTADO */}
                    {Number(item.stock_quantity) <= 0 && (
                    <span className="badge-agotado">AGOTADO</span>
                    )}
                </div>
                    <h3 className="title">{item.name}</h3>
                    <p className="text">{item.description || 'Sin descripción disponible.'}</p>

                    <div style={{ marginTop: '15px', fontSize: '14px' }}>
                      {item.model_number && (
                        <p><strong>Modelo:</strong> {item.model_number}</p>
                      )}
                      <p><strong>Disponibles:</strong> {item.stock_quantity}</p>
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
                     backgroundColor: Number(item.stock_quantity) > 0 ? '#2e7d32' : '#555',
                     cursor: Number(item.stock_quantity) > 0 ? 'pointer' : 'not-allowed',
                     opacity: Number(item.stock_quantity) > 0 ? 1 : 0.6,
                     }}
                     disabled={Number(item.stock_quantity) <= 0}
                     onClick={() => agregarACotizacion(item)}
                   >
                     {Number(item.stock_quantity) > 0 ? '+ Cotizar 🛒' : '🚫 Agotado'}
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
        <div className="toast-notificacion toast-success">
          <span>{mensajeCotizacion}</span>
        </div>
      )}

      <footer>
        <p>© 2026 CE Constructora | Todos los derechos reservados</p>
      </footer>
    </div>
  );
}
