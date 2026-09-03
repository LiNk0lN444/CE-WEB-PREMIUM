import React from 'react';
import '../assests/css/inventario.css';

export default function Inventario() {
    return (
        <div className="inventario-page">
            <header>
                <nav className="navbar">
                    <div className="logo">CE-Web Constructora</div>
                    <ul className="menu">
                        <li><a href="/">Inicio</a></li>
                        <li><a href="/#nosotros">Nosotros</a></li>
                        <li><a href="/catalogo">Catalogo</a></li>
                        <li><a href="/#contacto">Contacto</a></li>
                    </ul>
                    <div className="acciones">
                        <button id="themeBtn" title="Cambiar tema">🌙</button>
                        <div className="nav-auth" id="navAuth"></div>
                    </div>
                </nav>
            </header>

            <main className="inv-main">
                <div className="inv-titulo">
                    <h1>Inventario</h1>
                    <p>Administra la maquinaria y las herramientas disponibles para alquiler.</p>
                </div>

                {/* ACCESO RESTRINGIDO */}
                <div className="inv-acceso-denegado" id="accesoDenegado" hidden>
                    <h2>🔒 Acceso restringido</h2>
                    <p>Esta sección es exclusiva para asesores y administradores de CE-Web Constructora.</p>
                    <a href="/" className="btn-volver">Volver al inicio</a>
                </div>

                {/* CONTENIDO */}
                <div className="inv-container" id="invContainer" hidden>
                    <nav className="inv-tabs" id="invTabs">
                        <button className="inv-tab-btn active" data-tab="maquinaria" type="button">
                            🚜 Maquinaria
                        </button>
                        <button className="inv-tab-btn" data-tab="herramientas" type="button">
                            🛠️ Herramientas
                        </button>
                    </nav>

                    {/* TAB: MAQUINARIA */}
                    <section className="inv-tab-panel active" id="tab-maquinaria">
                        <div className="inv-panel-header">
                            <h2>Maquinaria</h2>
                            <p>Registra la maquinaria pesada disponible para alquiler.</p>
                        </div>

                        <form id="formMaquinaria" className="inv-form" noValidate>
                            <input type="hidden" id="maquinariaId" />

                            <div className="inv-form-grid">
                                <div className="inv-form-group">
                                    <label htmlFor="maqCodigo">Código</label>
                                    <input type="text" id="maqCodigo" placeholder="Ej: MAQ-001" required />
                                </div>
                                <div className="inv-form-group">
                                    <label htmlFor="maqNombre">Nombre</label>
                                    <input type="text" id="maqNombre" placeholder="Ej: Excavadora Oruga 340D2 L" required />
                                </div>
                                <div className="inv-form-group">
                                    <label htmlFor="maqMarca">Marca</label>
                                    <input type="text" id="maqMarca" placeholder="Ej: Caterpillar" />
                                </div>
                                <div className="inv-form-group">
                                    <label htmlFor="maqModelo">Modelo</label>
                                    <input type="text" id="maqModelo" placeholder="Ej: 340D2 L" />
                                </div>
                                <div className="inv-form-group">
                                    <label htmlFor="maqPrecio">Precio por mes (COP)</label>
                                    <input type="number" id="maqPrecio" min="0" step="1000" placeholder="Ej: 850000" required />
                                </div>
                                <div className="inv-form-group">
                                    <label htmlFor="maqEstado">Estado</label>
                                    <select id="maqEstado">
                                        <option value="disponible">Disponible</option>
                                        <option value="alquilada">Alquilada</option>
                                        <option value="mantenimiento">En mantenimiento</option>
                                    </select>
                                </div>
                                <div className="inv-form-group inv-form-group-full">
                                    <label htmlFor="maqImagen">URL de imagen (opcional)</label>
                                    <input type="text" id="maqImagen" placeholder="https://..." />
                                </div>
                                <div className="inv-form-group inv-form-group-full">
                                    <label htmlFor="maqDescripcion">Descripción</label>
                                    <textarea id="maqDescripcion" rows="3" placeholder="Detalles técnicos, capacidad, uso recomendado..."></textarea>
                                </div>
                            </div>

                            <span className="inv-error-msg" id="errMaquinaria"></span>

                            <div className="inv-form-actions">
                                <button type="submit" className="inv-btn-guardar" id="btnGuardarMaquinaria">Agregar maquinaria</button>
                                <button type="button" className="inv-btn-cancelar" id="btnCancelarMaquinaria" hidden>Cancelar edición</button>
                            </div>
                        </form>

                        <div className="inv-lista-wrap">
                            <table className="inv-tabla">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Nombre</th>
                                        <th>Marca / Modelo</th>
                                        <th>Precio / Mes</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="listaMaquinaria"></tbody>
                            </table>
                            <p className="inv-vacio" id="maquinariaVacio" hidden>Aún no has agregado maquinaria.</p>
                        </div>
                    </section>

                    {/* TAB: HERRAMIENTAS */}
                    <section className="inv-tab-panel" id="tab-herramientas">
                        <div className="inv-panel-header">
                            <h2>Herramientas</h2>
                            <p>Registra las herramientas disponibles para alquiler.</p>
                        </div>

                        <form id="formHerramienta" className="inv-form" noValidate>
                            <input type="hidden" id="herramientaId" />

                            <div className="inv-form-grid">
                                <div className="inv-form-group">
                                    <label htmlFor="herCodigo">Código</label>
                                    <input type="text" id="herCodigo" placeholder="Ej: HER-001" required />
                                </div>
                                <div className="inv-form-group">
                                    <label htmlFor="herNombre">Nombre</label>
                                    <input type="text" id="herNombre" placeholder="Ej: Taladro Percutor 12V" required />
                                </div>
                                <div className="inv-form-group">
                                    <label htmlFor="herCategoria">Categoría</label>
                                    <input type="text" id="herCategoria" placeholder="Ej: Eléctricas, Manuales..." />
                                </div>
                                <div className="inv-form-group">
                                    <label htmlFor="herCantidad">Cantidad disponible</label>
                                    <input type="number" id="herCantidad" min="0" step="1" placeholder="Ej: 10" required />
                                </div>
                                <div className="inv-form-group">
                                    <label htmlFor="herPrecio">Precio (COP)</label>
                                    <input type="number" id="herPrecio" min="0" step="1000" placeholder="Ej: 45000" required />
                                </div>
                                <div className="inv-form-group inv-form-group-full">
                                    <label htmlFor="herImagen">URL de imagen (opcional)</label>
                                    <input type="text" id="herImagen" placeholder="https://..." />
                                </div>
                                <div className="inv-form-group inv-form-group-full">
                                    <label htmlFor="herDescripcion">Descripción</label>
                                    <textarea id="herDescripcion" rows="3" placeholder="Detalles, uso recomendado..."></textarea>
                                </div>
                            </div>

                            <span className="inv-error-msg" id="errHerramienta"></span>

                            <div className="inv-form-actions">
                                <button type="submit" className="inv-btn-guardar" id="btnGuardarHerramienta">Agregar herramienta</button>
                                <button type="button" className="inv-btn-cancelar" id="btnCancelarHerramienta" hidden>Cancelar edición</button>
                            </div>
                        </form>

                        <div className="inv-lista-wrap">
                            <table className="inv-tabla">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Nombre</th>
                                        <th>Categoría</th>
                                        <th>Cantidad</th>
                                        <th>Precio</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="listaHerramientas"></tbody>
                            </table>
                            <p className="inv-vacio" id="herramientasVacio" hidden>Aún no has agregado herramientas.</p>
                        </div>
                    </section>
                </div>
            </main>

            <footer>
                <p>© 2026 CE Constructora | Todos los derechos reservados</p>
            </footer>

            <div id="toast" className="toast"></div>
        </div>
    );
}