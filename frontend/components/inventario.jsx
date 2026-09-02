<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventario | CE-Web Constructora</title>
    <link rel="shortcut icon" href="/ASSETS/IMG/ce.png" type="image/x-icon">
    <link rel="stylesheet" href="/ASSETS/CSS/inventario.css">
</head>
<body>

    <header>
        <nav class="navbar">
            <div class="logo">CE-Web Constructora</div>

            <ul class="menu">
                <li><a href="/index.html">Inicio</a></li>
                <li><a href="/index.html#nosotros">Nosotros</a></li>
                <li><a href="/VISTAS/catalogo.html">Catalogo</a></li>
                <li><a href="/index.html#contacto">Contacto</a></li>
            </ul>

            <div class="acciones">
                <button id="themeBtn" title="Cambiar tema">🌙</button>
                <div class="nav-auth" id="navAuth"></div>
            </div>
        </nav>
    </header>

    <main class="inv-main">

        <div class="inv-titulo">
            <h1>Inventario</h1>
            <p>Administra la maquinaria y las herramientas disponibles para alquiler.</p>
        </div>

        <!-- ===================== ACCESO RESTRINGIDO ===================== -->
        <div class="inv-acceso-denegado" id="accesoDenegado" hidden>
            <h2>🔒 Acceso restringido</h2>
            <p>Esta sección es exclusiva para asesores y administradores de CE-Web Constructora.</p>
            <a href="/index.html" class="btn-volver">Volver al inicio</a>
        </div>

        <!-- ===================== CONTENIDO (asesor / admin) ===================== -->
        <div class="inv-container" id="invContainer" hidden>

            <nav class="inv-tabs" id="invTabs">
                <button class="inv-tab-btn active" data-tab="maquinaria" type="button">
                    🚜 Maquinaria
                </button>
                <button class="inv-tab-btn" data-tab="herramientas" type="button">
                    🛠️ Herramientas
                </button>
            </nav>

            <!-- ---- TAB: MAQUINARIA ---- -->
            <section class="inv-tab-panel active" id="tab-maquinaria">

                <div class="inv-panel-header">
                    <h2>Maquinaria</h2>
                    <p>Registra la maquinaria pesada disponible para alquiler.</p>
                </div>

                <form id="formMaquinaria" class="inv-form" novalidate>

                    <input type="hidden" id="maquinariaId">

                    <div class="inv-form-grid">

                        <div class="inv-form-group">
                            <label for="maqCodigo">Código</label>
                            <input type="text" id="maqCodigo" placeholder="Ej: MAQ-001" required>
                        </div>

                        <div class="inv-form-group">
                            <label for="maqNombre">Nombre</label>
                            <input type="text" id="maqNombre" placeholder="Ej: Excavadora Oruga 340D2 L" required>
                        </div>

                        <div class="inv-form-group">
                            <label for="maqMarca">Marca</label>
                            <input type="text" id="maqMarca" placeholder="Ej: Caterpillar">
                        </div>

                        <div class="inv-form-group">
                            <label for="maqModelo">Modelo</label>
                            <input type="text" id="maqModelo" placeholder="Ej: 340D2 L">
                        </div>

                        <div class="inv-form-group">
                            <label for="maqPrecio">Precio por mes (COP)</label>
                            <input type="number" id="maqPrecio" min="0" step="1000" placeholder="Ej: 850000" required>
                        </div>

                        <div class="inv-form-group">
                            <label for="maqEstado">Estado</label>
                            <select id="maqEstado">
                                <option value="disponible">Disponible</option>
                                <option value="alquilada">Alquilada</option>
                                <option value="mantenimiento">En mantenimiento</option>
                            </select>
                        </div>

                        <div class="inv-form-group inv-form-group-full">
                            <label for="maqImagen">URL de imagen (opcional)</label>
                            <input type="text" id="maqImagen" placeholder="https://...">
                        </div>

                        <div class="inv-form-group inv-form-group-full">
                            <label for="maqDescripcion">Descripción</label>
                            <textarea id="maqDescripcion" rows="3" placeholder="Detalles técnicos, capacidad, uso recomendado..."></textarea>
                        </div>

                    </div>

                    <span class="inv-error-msg" id="errMaquinaria"></span>

                    <div class="inv-form-actions">
                        <button type="submit" class="inv-btn-guardar" id="btnGuardarMaquinaria">Agregar maquinaria</button>
                        <button type="button" class="inv-btn-cancelar" id="btnCancelarMaquinaria" hidden>Cancelar edición</button>
                    </div>

                </form>

                <div class="inv-lista-wrap">
                    <table class="inv-tabla">
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
                        <tbody id="listaMaquinaria">
                            <!-- Filas generadas por inventario.js -->
                        </tbody>
                    </table>
                    <p class="inv-vacio" id="maquinariaVacio" hidden>Aún no has agregado maquinaria.</p>
                </div>

            </section>

            <!-- ---- TAB: HERRAMIENTAS ---- -->
            <section class="inv-tab-panel" id="tab-herramientas">

                <div class="inv-panel-header">
                    <h2>Herramientas</h2>
                    <p>Registra las herramientas disponibles para alquiler.</p>
                </div>

                <form id="formHerramienta" class="inv-form" novalidate>

                    <input type="hidden" id="herramientaId">

                    <div class="inv-form-grid">

                        <div class="inv-form-group">
                            <label for="herCodigo">Código</label>
                            <input type="text" id="herCodigo" placeholder="Ej: HER-001" required>
                        </div>

                        <div class="inv-form-group">
                            <label for="herNombre">Nombre</label>
                            <input type="text" id="herNombre" placeholder="Ej: Taladro Percutor 12V" required>
                        </div>

                        <div class="inv-form-group">
                            <label for="herCategoria">Categoría</label>
                            <input type="text" id="herCategoria" placeholder="Ej: Eléctricas, Manuales...">
                        </div>

                        <div class="inv-form-group">
                            <label for="herCantidad">Cantidad disponible</label>
                            <input type="number" id="herCantidad" min="0" step="1" placeholder="Ej: 10" required>
                        </div>

                        <div class="inv-form-group">
                            <label for="herPrecio">Precio (COP)</label>
                            <input type="number" id="herPrecio" min="0" step="1000" placeholder="Ej: 45000" required>
                        </div>

                        <div class="inv-form-group inv-form-group-full">
                            <label for="herImagen">URL de imagen (opcional)</label>
                            <input type="text" id="herImagen" placeholder="https://...">
                        </div>

                        <div class="inv-form-group inv-form-group-full">
                            <label for="herDescripcion">Descripción</label>
                            <textarea id="herDescripcion" rows="3" placeholder="Detalles, uso recomendado..."></textarea>
                        </div>

                    </div>

                    <span class="inv-error-msg" id="errHerramienta"></span>

                    <div class="inv-form-actions">
                        <button type="submit" class="inv-btn-guardar" id="btnGuardarHerramienta">Agregar herramienta</button>
                        <button type="button" class="inv-btn-cancelar" id="btnCancelarHerramienta" hidden>Cancelar edición</button>
                    </div>

                </form>

                <div class="inv-lista-wrap">
                    <table class="inv-tabla">
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
                        <tbody id="listaHerramientas">
                            <!-- Filas generadas por inventario.js -->
                        </tbody>
                    </table>
                    <p class="inv-vacio" id="herramientasVacio" hidden>Aún no has agregado herramientas.</p>
                </div>

            </section>

        </div>

    </main>

    <footer>
        <p>© 2026 CE Constructora | Todos los derechos reservados</p>
    </footer>

    <!-- ===================== TOAST ===================== -->
    <div id="toast" class="toast"></div>

    <script src="/ASSETS/JS/auth.js"></script>
    <script src="/ASSETS/JS/inventario.js"></script>

</body>
</html>