import React from 'react';
import '../assests/css/cotizaciones.css';

export default function Cotizaciones() {
    return (
        <div className="cotizaciones-page">
            <header>
                <nav className="navbar">
                    <div className="logo">CE-Web Constructora</div>
                    <ul className="menu">
                        <li><a href="/">Inicio</a></li>
                        <li><a href="/#nosotros">Nosotros</a></li>
                        <li><a href="/catalogo">Catálogo</a></li>
                        <li><a href="/inventario">Inventario</a></li>
                        <li><a href="/cotizaciones">Cotizaciones</a></li>
                        <li><a href="/#contacto">Contacto</a></li>
                    </ul>
                    <div className="acciones">
                        <button id="themeBtn" title="Cambiar tema">🌙</button>
                        <div className="nav-auth" id="navAuth"></div>
                    </div>
                </nav>
            </header>

            <main className="cot-main">
                <div className="cot-titulo">
                    <h1>Cotizaciones</h1>
                    <p>Arma una cotización con la maquinaria y herramientas disponibles y llévale el control.</p>
                </div>

                {/* ACCESO RESTRINGIDO */}
                <div className="cot-acceso-denegado" id="accesoDenegado" hidden>
                    <h2>🔒 Inicia sesión</h2>
                    <p>Debes iniciar sesión para crear y consultar cotizaciones.</p>
                    <a href="/login" className="btn-volver">Iniciar sesión</a>
                </div>

                {/* CONTENIDO */}
                <div className="cot-container" id="cotContainer" hidden>
                    <nav className="cot-tabs" id="cotTabs">
                        <button className="cot-tab-btn active" data-tab="nueva" type="button">
                            🧾 Nueva cotización
                        </button>
                        <button className="cot-tab-btn" data-tab="listado" type="button">
                            📋 <span id="labelListado">Mis cotizaciones</span>
                        </button>
                    </nav>

                    {/* TAB: NUEVA COTIZACIÓN */}
                    <section className="cot-tab-panel active" id="tab-nueva">
                        <div className="cot-bloque">
                            <h2>Datos del cliente</h2>
                            <p className="cot-sub">Información de la persona o empresa a la que se le cotiza.</p>

                            <form id="formCliente" className="cot-form-grid" noValidate>
                                <div className="cot-form-group">
                                    <label htmlFor="cliNombre">Nombre y apellido</label>
                                    <input type="text" id="cliNombre" placeholder="Ej: Juan Rodríguez" required />
                                </div>
                                <div className="cot-form-group">
                                    <label htmlFor="cliDocumento">Documento</label>
                                    <input type="text" id="cliDocumento" placeholder="Ej: 1030600123" />
                                </div>
                                <div className="cot-form-group">
                                    <label htmlFor="cliEmpresa">Empresa (opcional)</label>
                                    <input type="text" id="cliEmpresa" placeholder="Ej: Constructora ABC" />
                                </div>
                                <div className="cot-form-group">
                                    <label htmlFor="cliTelefono">Teléfono</label>
                                    <input type="text" id="cliTelefono" placeholder="Ej: 3001234567" />
                                </div>
                                <div className="cot-form-group cot-form-group-full">
                                    <label htmlFor="cliCorreo">Correo</label>
                                    <input type="email" id="cliCorreo" placeholder="Ej: cliente@correo.com" required />
                                </div>
                            </form>
                        </div>

                        {/* Selector de maquinaria */}
                        <div className="cot-bloque">
                            <h2>Agregar ítems</h2>
                            <p className="cot-sub">Selecciona maquinaria o herramientas del inventario disponible.</p>

                            <div className="cot-selector-grid">
                                <div className="cot-form-group">
                                    <label htmlFor="itemTipo">Tipo</label>
                                    <select id="itemTipo">
                                        <option value="maquinaria">🚜 Maquinaria (precio por mes)</option>
                                        <option value="herramienta">🛠️ Herramienta (precio por mes de alquiler)</option>
                                    </select>
                                </div>

                                <div className="cot-form-group cot-form-group-full">
                                    <label htmlFor="itemSelect">Ítem</label>
                                    <select id="itemSelect"></select>
                                    <span className="cot-precio-preview" id="itemPrecioPreview"></span>
                                </div>

                                <div className="cot-form-group">
                                    <label htmlFor="itemCantidad">Cantidad</label>
                                    <input type="number" id="itemCantidad" min="1" step="1" defaultValue="1" />
                                </div>

                                <div className="cot-form-group">
                                    <label htmlFor="itemDias">Meses de alquiler</label>
                                    <input type="number" id="itemDias" min="1" step="1" defaultValue="1" />
                                </div>

                                <button type="button" className="cot-btn" id="btnAgregarItem">Agregar</button>
                            </div>
                            <span className="cot-error-msg" id="errItem"></span>
                        </div>

                        {/* Carrito */}
                        <div className="cot-bloque">
                            <h2>Ítems de la cotización</h2>
                            <p className="cot-sub">Revisa y ajusta los ítems antes de guardar.</p>

                            <div className="cot-lista-wrap">
                                <table className="cot-tabla">
                                    <thead>
                                        <tr>
                                            <th>Tipo</th>
                                            <th>Ítem</th>
                                            <th>Cant.</th>
                                            <th>Días</th>
                                            <th>Valor unitario</th>
                                            <th>Subtotal</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="carritoBody"></tbody>
                                </table>
                                <p className="cot-vacio" id="carritoVacio">Aún no has agregado ítems a esta cotización.</p>
                            </div>

                            <div className="cot-totales">
                                <div className="cot-totales-fila">
                                    <span>Subtotal</span>
                                    <span id="totalSubtotal">$0</span>
                                </div>
                                <div className="cot-totales-fila">
                                    <span>IVA (19%)</span>
                                    <span id="totalIva">$0</span>
                                </div>
                                <div className="cot-totales-fila cot-total-final">
                                    <span>Total</span>
                                    <span id="totalTotal">$0</span>
                                </div>
                            </div>
                        </div>

                        {/* Observaciones */}
                        <div className="cot-bloque">
                            <h2>Observaciones</h2>
                            <div className="cot-form-grid">
                                <div className="cot-form-group cot-form-group-full">
                                    <label htmlFor="cotObservaciones">Notas adicionales (opcional)</label>
                                    <textarea id="cotObservaciones" rows="3" placeholder="Condiciones especiales, tiempos de entrega, etc."></textarea>
                                </div>
                            </div>
                            <span className="cot-error-msg" id="errCotizacion"></span>

                            <div className="cot-form-actions">
                                <button type="button" className="cot-btn" id="btnGuardarCotizacion">Guardar cotización</button>
                                <button type="button" className="cot-btn-secundario" id="btnLimpiarCotizacion">Limpiar todo</button>
                            </div>
                        </div>
                    </section>

                    {/* TAB: LISTADO */}
                    <section className="cot-tab-panel" id="tab-listado">
                        <div className="cot-bloque">
                            <h2 id="tituloListado">Cotizaciones</h2>
                            <p className="cot-sub" id="subListado">Historial de cotizaciones guardadas.</p>

                            <div className="cot-filtros">
                                <input type="text" id="filtroBuscar" placeholder="Buscar por número, cliente o correo..." />
                                <select id="filtroEstado">
                                    <option value="todos">Todos los estados</option>
                                    <option value="borrador">Borrador</option>
                                    <option value="enviada">Enviada</option>
                                    <option value="aprobada">Aprobada</option>
                                    <option value="rechazada">Rechazada</option>
                                </select>
                            </div>

                            <div className="cot-lista-wrap">
                                <table className="cot-tabla">
                                    <thead>
                                        <tr>
                                            <th>Número</th>
                                            <th>Fecha</th>
                                            <th>Cliente</th>
                                            <th>Total</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="listadoBody"></tbody>
                                </table>
                                <p className="cot-vacio" id="listadoVacio" hidden>No hay cotizaciones que coincidan.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <footer>
                <p>© 2026 CE Constructora | Todos los derechos reservados</p>
            </footer>

            <div className="cot-modal-overlay" id="modalOverlay" hidden>
                <div className="cot-modal cot-imprimible" id="modalContenido"></div>
            </div>

            <div id="toast" className="toast"></div>
        </div>
    );
}