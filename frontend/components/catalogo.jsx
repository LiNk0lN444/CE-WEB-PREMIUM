import React from 'react';
import '../assests/css/catalogo.css';

export default function Catalogo() {
    return (
        <div className="catalogo-page">
            <header>
                <nav className="navbar">
                    <div className="logo">CE-Web Constructora</div>
                    <ul className="menu">
                        <li><a href="/">Inicio</a></li>
                        <li><a href="/#nosotros">Nosotros</a></li>
                        <li><a href="/catalogo">Catálogo</a></li>
                        <li><a href="/inventario">Inventario</a></li>
                        <li><a href="/#servicios">Servicios</a></li>
                        <li><a href="/#contacto">Contacto</a></li>
                    </ul>
                    <div className="acciones">
                        <button id="themeBtn">🌙</button>
                        <div className="nav-auth" id="navAuth"></div>
                    </div>
                </nav>
            </header>

            <section id="inicio" className="hero">
                <div className="hero-content">
                    <h1>Catálogo</h1>
                    <p>En este espacio podrás visualizar nuestra maquinaria y herramientas disponibles</p>
                    <a href="#catalogo" className="btn">Ver catálogo</a>
                </div>
            </section>

            <section id="catalogo" className="section">
                <h2 className="title-pro">Nuestros Productos</h2>

                <div className="filtros" id="filtros">
                    {/* Los botones de categoría se pueden renderizar dinámicamente aquí con estados */}
                </div>

                <div className="buscador">
                    <input
                        type="text"
                        id="buscadorInput"
                        placeholder="🔍 Buscar producto por nombre..."
                        autoComplete="off"
                    />
                </div>

                <div className="grid-productos" id="gridProductos">
                    {/* Las tarjetas de producto se insertan aquí */}
                </div>

                <p className="sin-resultados" id="sinResultados" style={{ display: 'none' }}>
                    No se encontraron productos con ese criterio.
                </p>
            </section>

            <footer>
                <p>© 2026 CE Constructora | Todos los derechos reservados</p>
            </footer>
        </div>
    );
}