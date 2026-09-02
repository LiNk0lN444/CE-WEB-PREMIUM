<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cotizaciones | CE-Web Constructora</title>
    <link rel="shortcut icon" href="/ASSETS/IMG/ce.png" type="image/x-icon">
    <link rel="stylesheet" href="/ASSETS/CSS/cotizaciones.css">
</head>
<body>

    <header>
        <nav class="navbar">
            <div class="logo">CE-Web Constructora</div>

            <ul class="menu">
                <li><a href="/index.html">Inicio</a></li>
                <li><a href="/index.html#nosotros">Nosotros</a></li>
                <li><a href="/VISTAS/catalogo.html">Catalogo</a></li>
                <li><a href="/VISTAS/inventario.html">Inventario</a></li>
                <li><a href="/VISTAS/cotizaciones.html">Cotizaciones</a></li>
                <li><a href="/index.html#contacto">Contacto</a></li>
            </ul>

            <div class="acciones">
                <button id="themeBtn" title="Cambiar tema">🌙</button>
                <div class="nav-auth" id="navAuth"></div>
            </div>
        </nav>
    </header>

    <main class="cot-main">

        <div class="cot-titulo">
            <h1>Cotizaciones</h1>
            <p>Arma una cotización con la maquinaria y herramientas disponibles y llévale el control.</p>
        </div>

        <!-- ===================== ACCESO RESTRINGIDO (sin sesión) ===================== -->
        <div class="cot-acceso-denegado" id="accesoDenegado" hidden>
            <h2>🔒 Inicia sesión</h2>
            <p>Debes iniciar sesión para crear y consultar cotizaciones.</p>
            <a href="/VISTAS/login.html" class="btn-volver">Iniciar sesión</a>
        </div>

        <!-- ===================== CONTENIDO (con sesión) ===================== -->
        <div class="cot-container" id="cotContainer" hidden>

            <nav class="cot-tabs" id="cotTabs">
                <button class="cot-tab-btn active" data-tab="nueva" type="button">
                    🧾 Nueva cotización
                </button>
                <button class="cot-tab-btn" data-tab="listado" type="button">
                    📋 <span id="labelListado">Mis cotizaciones</span>
                </button>
            </nav>

            <!-- ---- TAB: NUEVA COTIZACIÓN ---- -->
            <section class="cot-tab-panel active" id="tab-nueva">

                <!-- Datos del cliente -->
                <div class="cot-bloque">
                    <h2>Datos del cliente</h2>
                    <p class="cot-sub">Información de la persona o empresa a la que se le cotiza.</p>

                    <form id="formCliente" class="cot-form-grid" novalidate>

                        <div class="cot-form-group">
                            <label for="cliNombre">Nombre y apellido</label>
                            <input type="text" id="cliNombre" placeholder="Ej: Juan Rodríguez" required>
                        </div>

                        <div class="cot-form-group">
                            <label for="cliDocumento">Documento</label>
                            <input type="text" id="cliDocumento" placeholder="Ej: 1030600123">
                        </div>

                        <div class="cot-form-group">
                            <label for="cliEmpresa">Empresa (opcional)</label>
                            <input type="text" id="cliEmpresa" placeholder="Ej: Constructora ABC">
                        </div>

                        <div class="cot-form-group">
                            <label for="cliTelefono">Teléfono</label>
                            <input type="text" id="cliTelefono" placeholder="Ej: 3001234567">
                        </div>

                        <div class="cot-form-group cot-form-group-full">
                            <label for="cliCorreo">Correo</label>
                            <input type="email" id="cliCorreo" placeholder="Ej: cliente@correo.com" required>
                        </div>

                    </form>
                </div>

                <!-- Selector de maquinaria / herramientas -->
                <div class="cot-bloque">
                    <h2>Agregar ítems</h2>
                    <p class="cot-sub">Selecciona maquinaria o herramientas del inventario disponible.</p>

                    <div class="cot-selector-grid">

                        <div class="cot-form-group">
                            <label for="itemTipo">Tipo</label>
                            <select id="itemTipo">
                                <option value="maquinaria">🚜 Maquinaria (precio por mes)</option>
                                <option value="herramienta">🛠️ Herramienta (precio por mes de alquiler)</option>
                            </select>
                        </div>

                        <div class="cot-form-group cot-form-group-full">
                            <label for="itemSelect">Ítem</label>
                            <select id="itemSelect"></select>
                            <span class="cot-precio-preview" id="itemPrecioPreview"></span>
                        </div>

                        <div class="cot-form-group">
                            <label for="itemCantidad">Cantidad</label>
                            <input type="number" id="itemCantidad" min="1" step="1" value="1">
                        </div>

                        <div class="cot-form-group">
                            <label for="itemDias">Meses de alquiler</label>
                            <input type="number" id="itemDias" min="1" step="1" value="1">
                        </div>

                        <button type="button" class="cot-btn" id="btnAgregarItem">Agregar</button>

                    </div>

                    <span class="cot-error-msg" id="errItem"></span>
                </div>

                <!-- Carrito de la cotización -->
                <div class="cot-bloque">
                    <h2>Ítems de la cotización</h2>
                    <p class="cot-sub">Revisa y ajusta los ítems antes de guardar.</p>

                    <div class="cot-lista-wrap">
                        <table class="cot-tabla">
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
                        <p class="cot-vacio" id="carritoVacio">Aún no has agregado ítems a esta cotización.</p>
                    </div>

                    <div class="cot-totales">
                        <div class="cot-totales-fila">
                            <span>Subtotal</span>
                            <span id="totalSubtotal">$0</span>
                        </div>
                        <div class="cot-totales-fila">
                            <span>IVA (19%)</span>
                            <span id="totalIva">$0</span>
                        </div>
                        <div class="cot-totales-fila cot-total-final">
                            <span>Total</span>
                            <span id="totalTotal">$0</span>
                        </div>
                    </div>
                </div>

                <!-- Observaciones y guardado -->
                <div class="cot-bloque">
                    <h2>Observaciones</h2>

                    <div class="cot-form-grid">
                        <div class="cot-form-group cot-form-group-full">
                            <label for="cotObservaciones">Notas adicionales (opcional)</label>
                            <textarea id="cotObservaciones" rows="3" placeholder="Condiciones especiales, tiempos de entrega, etc."></textarea>
                        </div>
                    </div>

                    <span class="cot-error-msg" id="errCotizacion"></span>

                    <div class="cot-form-actions">
                        <button type="button" class="cot-btn" id="btnGuardarCotizacion">Guardar cotización</button>
                        <button type="button" class="cot-btn-secundario" id="btnLimpiarCotizacion">Limpiar todo</button>
                    </div>
                </div>

            </section>

            <!-- ---- TAB: LISTADO ---- -->
            <section class="cot-tab-panel" id="tab-listado">

                <div class="cot-bloque">
                    <h2 id="tituloListado">Cotizaciones</h2>
                    <p class="cot-sub" id="subListado">Historial de cotizaciones guardadas.</p>

                    <div class="cot-filtros">
                        <input type="text" id="filtroBuscar" placeholder="Buscar por número, cliente o correo...">
                        <select id="filtroEstado">
                            <option value="todos">Todos los estados</option>
                            <option value="borrador">Borrador</option>
                            <option value="enviada">Enviada</option>
                            <option value="aprobada">Aprobada</option>
                            <option value="rechazada">Rechazada</option>
                        </select>
                    </div>

                    <div class="cot-lista-wrap">
                        <table class="cot-tabla">
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
                        <p class="cot-vacio" id="listadoVacio" hidden>No hay cotizaciones que coincidan.</p>
                    </div>
                </div>

            </section>

        </div>

    </main>

    <footer>
        <p>© 2026 CE Constructora | Todos los derechos reservados</p>
    </footer>

    <!-- ===================== MODAL DETALLE ===================== -->
    <div class="cot-modal-overlay" id="modalOverlay" hidden>
        <div class="cot-modal cot-imprimible" id="modalContenido"></div>
    </div>

    <!-- ===================== TOAST ===================== -->
    <div id="toast" class="toast"></div>

    <script src="/ASSETS/JS/auth.js"></script>
    <script src="/ASSETS/JS/cotizaciones.js"></script>

</body>
</html>