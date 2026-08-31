/* =========================================================
   COTIZACIONES.JS - Creación y gestión de cotizaciones
   (CE-Web Constructora)
   Requiere sesión iniciada. Toma la maquinaria y las
   herramientas del inventario (localStorage) para armar cada
   cotización, calcula subtotal/IVA/total y la guarda como un
   registro más de la lista de cotizaciones (localStorage),
   simulando las tablas "cotizaciones" y "detalle_cotizacion"
   del esquema de base de datos.
   ========================================================= */

const CE_INV_MAQUINARIA_KEY = "ce_inventario_maquinaria";
const CE_INV_HERRAMIENTAS_KEY = "ce_inventario_herramientas";
const CE_COTIZACIONES_KEY = "ce_cotizaciones";
const CE_IVA = 0.19;

// =========================
// UTILIDADES
// =========================

function ceLeerLista(clave){
    const guardado = localStorage.getItem(clave);
    if(!guardado) return [];
    try{
        const lista = JSON.parse(guardado);
        return Array.isArray(lista) ? lista : [];
    }catch(e){
        return [];
    }
}

function ceGuardarLista(clave, lista){
    localStorage.setItem(clave, JSON.stringify(lista));
}

function ceGenerarIdItem(prefijo){
    return (prefijo || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatearPrecio(valor){
    const numero = Number(valor) || 0;
    return numero.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function formatearFecha(iso){
    const fecha = new Date(iso);
    if(isNaN(fecha.getTime())) return "—";
    return fecha.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

function escaparHtml(texto){
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

// =========================
// SEMILLA DE INVENTARIO DE DEMOSTRACIÓN
// (solo si no hay ninguna maquinaria ni herramienta cargada,
//  para que la cotización se pueda probar de inmediato sin
//  tener que pasar antes por Inventario)
// =========================

function ceSemillaInventarioSiVacio(){
    const maquinaria = ceLeerLista(CE_INV_MAQUINARIA_KEY);
    const herramientas = ceLeerLista(CE_INV_HERRAMIENTAS_KEY);

    if(maquinaria.length === 0 && herramientas.length === 0){

        const maquinariaDemo = [
            { id: ceGenerarIdItem("i"), codigo: "MAQ-001", nombre: "Excavadora Oruga 340D2 L", marca: "Caterpillar", modelo: "340D2 L", precioDia: 850000, estado: "disponible", imagen: "", descripcion: "Excavadora hidráulica sobre orugas para proyectos de gran magnitud." },
            { id: ceGenerarIdItem("i"), codigo: "MAQ-002", nombre: "Retroexcavadora CAT 420", marca: "Caterpillar", modelo: "420", precioDia: 620000, estado: "disponible", imagen: "", descripcion: "Retroexcavadora cargadora versátil para obra civil." },
            { id: ceGenerarIdItem("i"), codigo: "MAQ-003", nombre: "Motoniveladora CAT 140 GC", marca: "Caterpillar", modelo: "140 GC", precioDia: 780000, estado: "disponible", imagen: "", descripcion: "Nivelación y preparación de vías." },
            { id: ceGenerarIdItem("i"), codigo: "MAQ-004", nombre: "Minicargador CAT 262D3", marca: "Caterpillar", modelo: "262D3", precioDia: 450000, estado: "disponible", imagen: "", descripcion: "Minicargador de levantamiento vertical." },
            { id: ceGenerarIdItem("i"), codigo: "MAQ-005", nombre: "Rodillo Vibratorio CAT CS11 GC", marca: "Caterpillar", modelo: "CS11 GC", precioDia: 390000, estado: "disponible", imagen: "", descripcion: "Compactación de suelos granulares y cohesivos." }
        ];

        const herramientasDemo = [
            { id: ceGenerarIdItem("i"), codigo: "HER-001", nombre: "Taladro Percutor 12V", categoria: "Eléctricas", cantidad: 8, precio: 25000, imagen: "", descripcion: "Perforaciones de precisión en trabajos livianos." },
            { id: ceGenerarIdItem("i"), codigo: "HER-002", nombre: "Atornillador de Impacto 18V", categoria: "Eléctricas", cantidad: 6, precio: 30000, imagen: "", descripcion: "Atornillado en materiales densos y metales." },
            { id: ceGenerarIdItem("i"), codigo: "HER-003", nombre: "Pulidora 4-1/2 1010W", categoria: "Eléctricas", cantidad: 5, precio: 28000, imagen: "", descripcion: "Cortes y pulido de precisión." },
            { id: ceGenerarIdItem("i"), codigo: "HER-004", nombre: "Sierra Circular 7-1/4 1800W", categoria: "Eléctricas", cantidad: 4, precio: 35000, imagen: "", descripcion: "Cortes rectos en madera." },
            { id: ceGenerarIdItem("i"), codigo: "HER-005", nombre: "Rotomartillo SDS Plus 2.6J", categoria: "Eléctricas", cantidad: 4, precio: 32000, imagen: "", descripcion: "Perforación y martillado en piedra y hormigón." }
        ];

        ceGuardarLista(CE_INV_MAQUINARIA_KEY, maquinariaDemo);
        ceGuardarLista(CE_INV_HERRAMIENTAS_KEY, herramientasDemo);
    }
}

ceSemillaInventarioSiVacio();

// =========================
// GUARDIA DE ACCESO (requiere sesión)
// =========================

const usuarioSesion = ceObtenerSesion();
const puedeVerTodas = ceEsAsesorOAdministrador(usuarioSesion);

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("accesoDenegado").hidden = !!usuarioSesion;
    document.getElementById("cotContainer").hidden = !usuarioSesion;

    if(usuarioSesion){
        document.getElementById("labelListado").textContent = puedeVerTodas ? "Todas las cotizaciones" : "Mis cotizaciones";
        document.getElementById("tituloListado").textContent = puedeVerTodas ? "Todas las cotizaciones" : "Mis cotizaciones";
        document.getElementById("subListado").textContent = puedeVerTodas
            ? "Historial de cotizaciones creadas por todo el equipo."
            : "Historial de las cotizaciones que has creado.";

        precargarDatosCliente();
        renderSelectorItems();
        actualizarPrecioPreview();
        renderCarrito();
        renderListado();
    }
});

// =========================
// TEMA (claro / oscuro)
// =========================

const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    if(document.body.classList.contains("dark-mode")){
        themeBtn.textContent = "☀️";
        localStorage.setItem("theme", "dark");
    }else{
        themeBtn.textContent = "🌙";
        localStorage.setItem("theme", "light");
    }
});

if(localStorage.getItem("theme") === "dark"){
    document.body.classList.add("dark-mode");
    themeBtn.textContent = "☀️";
}

// =========================
// TOAST
// =========================

const toast = document.getElementById("toast");
let toastTimeout;

function mostrarToast(mensaje, tipo){
    clearTimeout(toastTimeout);

    toast.textContent = mensaje;
    toast.className = "toast show";

    if(tipo === "success") toast.classList.add("toast-success");
    if(tipo === "error") toast.classList.add("toast-error");

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// =========================
// TABS
// =========================

document.querySelectorAll(".cot-tab-btn").forEach(tab => {
    tab.addEventListener("click", () => cambiarTab(tab.dataset.tab));
});

function cambiarTab(nombre){
    document.querySelectorAll(".cot-tab-btn").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".cot-tab-panel").forEach(p => p.classList.remove("active"));

    document.querySelector(`.cot-tab-btn[data-tab="${nombre}"]`).classList.add("active");
    document.getElementById("tab-" + nombre).classList.add("active");

    if(nombre === "listado") renderListado();
}

// =========================
// DATOS DEL CLIENTE
// =========================

const cliNombre = document.getElementById("cliNombre");
const cliDocumento = document.getElementById("cliDocumento");
const cliEmpresa = document.getElementById("cliEmpresa");
const cliTelefono = document.getElementById("cliTelefono");
const cliCorreo = document.getElementById("cliCorreo");

function precargarDatosCliente(){
    if(!usuarioSesion) return;

    cliNombre.value = `${usuarioSesion.nombre || ""} ${usuarioSesion.apellido || ""}`.trim();
    cliTelefono.value = usuarioSesion.telefono || "";
    cliCorreo.value = usuarioSesion.email || "";
}

// =========================
// SELECTOR DE ÍTEMS (maquinaria / herramientas)
// =========================

const itemTipo = document.getElementById("itemTipo");
const itemSelect = document.getElementById("itemSelect");
const itemPrecioPreview = document.getElementById("itemPrecioPreview");
const itemCantidad = document.getElementById("itemCantidad");
const itemDias = document.getElementById("itemDias");
const errItem = document.getElementById("errItem");
const btnAgregarItem = document.getElementById("btnAgregarItem");

function obtenerItemsDisponibles(tipo){
    if(tipo === "maquinaria"){
        return ceLeerLista(CE_INV_MAQUINARIA_KEY).map(m => ({
            id: m.id, codigo: m.codigo, nombre: m.nombre, precio: Number(m.precioDia) || 0
        }));
    }
    return ceLeerLista(CE_INV_HERRAMIENTAS_KEY).map(h => ({
        id: h.id, codigo: h.codigo, nombre: h.nombre, precio: Number(h.precio) || 0
    }));
}

function renderSelectorItems(){
    const items = obtenerItemsDisponibles(itemTipo.value);

    if(items.length === 0){
        itemSelect.innerHTML = `<option value="">No hay ítems disponibles</option>`;
    }else{
        itemSelect.innerHTML = items.map(it =>
            `<option value="${it.id}">${escaparHtml(it.codigo)} — ${escaparHtml(it.nombre)}</option>`
        ).join("");
    }

    actualizarPrecioPreview();
}

function itemSeleccionado(){
    const items = obtenerItemsDisponibles(itemTipo.value);
    return items.find(it => it.id === itemSelect.value) || null;
}

function actualizarPrecioPreview(){
    const item = itemSeleccionado();
    itemPrecioPreview.textContent = item
        ? `Precio por día: ${formatearPrecio(item.precio)}`
        : "";
}

itemTipo.addEventListener("change", renderSelectorItems);
itemSelect.addEventListener("change", actualizarPrecioPreview);

// =========================
// CARRITO DE LA COTIZACIÓN ACTUAL
// =========================

let carritoActual = [];

const carritoBody = document.getElementById("carritoBody");
const carritoVacio = document.getElementById("carritoVacio");
const totalSubtotal = document.getElementById("totalSubtotal");
const totalIva = document.getElementById("totalIva");
const totalTotal = document.getElementById("totalTotal");

function calcularTotalesCarrito(){
    const subtotal = carritoActual.reduce((acc, it) => acc + it.subtotal, 0);
    const iva = subtotal * CE_IVA;
    const total = subtotal + iva;
    return { subtotal, iva, total };
}

function renderCarrito(){
    carritoVacio.hidden = carritoActual.length !== 0;

    carritoBody.innerHTML = carritoActual.map(it => `
        <tr data-item-id="${it.itemId}">
            <td>${it.tipo === "maquinaria" ? "🚜 Maquinaria" : "🛠️ Herramienta"}</td>
            <td>${escaparHtml(it.codigo)} — ${escaparHtml(it.nombre)}</td>
            <td>${it.cantidad}</td>
            <td>${it.dias}</td>
            <td>${formatearPrecio(it.valorUnitario)}</td>
            <td>${formatearPrecio(it.subtotal)}</td>
            <td>
                <button type="button" class="cot-btn-chico" data-accion="eliminar-item" data-id="${it.itemId}">🗑️ Quitar</button>
            </td>
        </tr>
    `).join("");

    const { subtotal, iva, total } = calcularTotalesCarrito();
    totalSubtotal.textContent = formatearPrecio(subtotal);
    totalIva.textContent = formatearPrecio(iva);
    totalTotal.textContent = formatearPrecio(total);
}

btnAgregarItem.addEventListener("click", () => {
    errItem.textContent = "";

    const item = itemSeleccionado();
    const cantidad = Number(itemCantidad.value);
    const dias = Number(itemDias.value);

    if(!item){
        errItem.textContent = "No hay un ítem válido seleccionado. Agrega maquinaria o herramientas en Inventario.";
        return;
    }

    if(!cantidad || cantidad < 1){
        errItem.textContent = "La cantidad debe ser al menos 1";
        return;
    }

    if(!dias || dias < 1){
        errItem.textContent = "Los días de alquiler deben ser al menos 1";
        return;
    }

    const subtotal = item.precio * cantidad * dias;

    carritoActual.push({
        itemId: ceGenerarIdItem("ci"),
        tipo: itemTipo.value,
        refId: item.id,
        codigo: item.codigo,
        nombre: item.nombre,
        valorUnitario: item.precio,
        cantidad,
        dias,
        subtotal
    });

    itemCantidad.value = 1;
    itemDias.value = 1;

    renderCarrito();
    mostrarToast("Ítem agregado a la cotización", "success");
});

carritoBody.addEventListener("click", (e) => {
    const boton = e.target.closest("button");
    if(!boton || boton.dataset.accion !== "eliminar-item") return;

    carritoActual = carritoActual.filter(it => it.itemId !== boton.dataset.id);
    renderCarrito();
});

// =========================
// GUARDAR / LIMPIAR COTIZACIÓN
// =========================

const cotObservaciones = document.getElementById("cotObservaciones");
const errCotizacion = document.getElementById("errCotizacion");
const btnGuardarCotizacion = document.getElementById("btnGuardarCotizacion");
const btnLimpiarCotizacion = document.getElementById("btnLimpiarCotizacion");

function generarNumeroCotizacion(){
    const anio = new Date().getFullYear();
    const lista = ceLeerLista(CE_COTIZACIONES_KEY);
    const prefijo = `COT-${anio}-`;

    const consecutivo = lista
        .map(c => c.numero)
        .filter(n => typeof n === "string" && n.startsWith(prefijo))
        .map(n => parseInt(n.slice(prefijo.length), 10))
        .filter(n => !isNaN(n))
        .reduce((max, n) => Math.max(max, n), 0) + 1;

    return prefijo + String(consecutivo).padStart(4, "0");
}

function limpiarFormularioNueva(){
    carritoActual = [];
    cotObservaciones.value = "";
    errCotizacion.textContent = "";
    precargarDatosCliente();
    cliDocumento.value = "";
    cliEmpresa.value = "";
    renderCarrito();
}

btnGuardarCotizacion.addEventListener("click", () => {
    errCotizacion.textContent = "";

    const nombre = cliNombre.value.trim();
    const correo = cliCorreo.value.trim();

    if(!nombre || !correo){
        errCotizacion.textContent = "Completa al menos el nombre y el correo del cliente";
        return;
    }

    if(carritoActual.length === 0){
        errCotizacion.textContent = "Agrega al menos un ítem antes de guardar la cotización";
        return;
    }

    const { subtotal, iva, total } = calcularTotalesCarrito();

    const nuevaCotizacion = {
        id: ceGenerarIdItem("c"),
        numero: generarNumeroCotizacion(),
        fecha: new Date().toISOString(),
        cliente: {
            nombre,
            documento: cliDocumento.value.trim(),
            empresa: cliEmpresa.value.trim(),
            telefono: cliTelefono.value.trim(),
            correo
        },
        creadoPor: {
            id: usuarioSesion.id,
            nombre: `${usuarioSesion.nombre} ${usuarioSesion.apellido}`.trim(),
            rol: usuarioSesion.rol
        },
        items: carritoActual,
        subtotal,
        iva,
        total,
        estado: "borrador",
        observaciones: cotObservaciones.value.trim()
    };

    const lista = ceLeerLista(CE_COTIZACIONES_KEY);
    lista.push(nuevaCotizacion);
    ceGuardarLista(CE_COTIZACIONES_KEY, lista);

    limpiarFormularioNueva();
    mostrarToast(`Cotización ${nuevaCotizacion.numero} guardada correctamente`, "success");
    cambiarTab("listado");
});

btnLimpiarCotizacion.addEventListener("click", () => {
    if(carritoActual.length === 0 && !cotObservaciones.value.trim()){
        limpiarFormularioNueva();
        return;
    }

    if(confirm("¿Seguro que quieres limpiar la cotización actual? Se perderán los ítems agregados.")){
        limpiarFormularioNueva();
        mostrarToast("Cotización actual limpiada", "success");
    }
});

// =========================
// LISTADO DE COTIZACIONES
// =========================

const listadoBody = document.getElementById("listadoBody");
const listadoVacio = document.getElementById("listadoVacio");
const filtroBuscar = document.getElementById("filtroBuscar");
const filtroEstado = document.getElementById("filtroEstado");

const ESTADOS_COTIZACION = {
    borrador: "Borrador",
    enviada: "Enviada",
    aprobada: "Aprobada",
    rechazada: "Rechazada"
};

function obtenerCotizacionesVisibles(){
    const lista = ceLeerLista(CE_COTIZACIONES_KEY);

    if(puedeVerTodas) return lista;

    return lista.filter(c => c.creadoPor && c.creadoPor.id === usuarioSesion.id);
}

function renderListado(){
    const busqueda = filtroBuscar.value.trim().toLowerCase();
    const estado = filtroEstado.value;

    const cotizaciones = obtenerCotizacionesVisibles()
        .filter(c => {
            const coincideEstado = estado === "todos" || c.estado === estado;

            const coincideBusqueda = busqueda === "" ||
                c.numero.toLowerCase().includes(busqueda) ||
                (c.cliente.nombre || "").toLowerCase().includes(busqueda) ||
                (c.cliente.correo || "").toLowerCase().includes(busqueda) ||
                (c.cliente.empresa || "").toLowerCase().includes(busqueda);

            return coincideEstado && coincideBusqueda;
        })
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    listadoVacio.hidden = cotizaciones.length !== 0;

    listadoBody.innerHTML = cotizaciones.map(c => {
        const puedeEliminar = puedeVerTodas || (c.creadoPor.id === usuarioSesion.id && c.estado === "borrador");

        const celdaEstado = puedeVerTodas
            ? `<select class="cot-select-estado" data-accion="cambiar-estado" data-id="${c.id}">
                ${Object.entries(ESTADOS_COTIZACION).map(([valor, texto]) =>
                    `<option value="${valor}" ${c.estado === valor ? "selected" : ""}>${texto}</option>`
                ).join("")}
               </select>`
            : `<span class="cot-badge cot-badge-${c.estado}">${ESTADOS_COTIZACION[c.estado] || c.estado}</span>`;

        return `
            <tr data-id="${c.id}">
                <td>${escaparHtml(c.numero)}</td>
                <td>${formatearFecha(c.fecha)}</td>
                <td>${escaparHtml(c.cliente.nombre)}</td>
                <td>${formatearPrecio(c.total)}</td>
                <td>${celdaEstado}</td>
                <td>
                    <button type="button" class="cot-btn-chico" data-accion="ver-detalle" data-id="${c.id}">👁️ Ver</button>
                    ${puedeEliminar ? `<button type="button" class="cot-btn-chico" data-accion="eliminar-cotizacion" data-id="${c.id}">🗑️ Eliminar</button>` : ""}
                </td>
            </tr>
        `;
    }).join("");
}

filtroBuscar.addEventListener("input", renderListado);
filtroEstado.addEventListener("change", renderListado);

listadoBody.addEventListener("click", (e) => {
    const boton = e.target.closest("button");
    if(!boton) return;

    const id = boton.dataset.id;

    if(boton.dataset.accion === "ver-detalle"){
        abrirDetalle(id);
    }

    if(boton.dataset.accion === "eliminar-cotizacion"){
        if(!confirm("¿Eliminar esta cotización? Esta acción no se puede deshacer.")) return;

        const lista = ceLeerLista(CE_COTIZACIONES_KEY).filter(c => c.id !== id);
        ceGuardarLista(CE_COTIZACIONES_KEY, lista);
        renderListado();
        mostrarToast("Cotización eliminada", "success");
    }
});

listadoBody.addEventListener("change", (e) => {
    const select = e.target.closest("select[data-accion='cambiar-estado']");
    if(!select) return;

    const lista = ceLeerLista(CE_COTIZACIONES_KEY);
    const idx = lista.findIndex(c => c.id === select.dataset.id);
    if(idx === -1) return;

    lista[idx].estado = select.value;
    ceGuardarLista(CE_COTIZACIONES_KEY, lista);
    renderListado();
    mostrarToast("Estado de la cotización actualizado", "success");
});

// =========================
// MODAL DE DETALLE
// =========================

const modalOverlay = document.getElementById("modalOverlay");
const modalContenido = document.getElementById("modalContenido");

function abrirDetalle(id){
    const cotizacion = ceLeerLista(CE_COTIZACIONES_KEY).find(c => c.id === id);
    if(!cotizacion) return;

    modalContenido.innerHTML = `
        <div class="cot-modal-header">
            <h3>Cotización ${escaparHtml(cotizacion.numero)}</h3>
            <button type="button" class="cot-modal-cerrar" id="btnCerrarModal">✕</button>
        </div>

        <div class="cot-modal-seccion cot-modal-datos">
            <h4>Cliente</h4>
            <p>
                ${escaparHtml(cotizacion.cliente.nombre)}<br>
                ${cotizacion.cliente.empresa ? escaparHtml(cotizacion.cliente.empresa) + "<br>" : ""}
                ${cotizacion.cliente.documento ? "Documento: " + escaparHtml(cotizacion.cliente.documento) + "<br>" : ""}
                ${cotizacion.cliente.telefono ? "Tel: " + escaparHtml(cotizacion.cliente.telefono) + "<br>" : ""}
                Correo: ${escaparHtml(cotizacion.cliente.correo)}
            </p>
        </div>

        <div class="cot-modal-seccion cot-modal-datos">
            <h4>Cotización</h4>
            <p>
                Fecha: ${formatearFecha(cotizacion.fecha)}<br>
                Estado: <span class="cot-badge cot-badge-${cotizacion.estado}">${ESTADOS_COTIZACION[cotizacion.estado] || cotizacion.estado}</span><br>
                Creada por: ${escaparHtml(cotizacion.creadoPor.nombre)}
            </p>
        </div>

        <div class="cot-modal-seccion">
            <h4>Ítems</h4>
            <div class="cot-lista-wrap">
                <table class="cot-tabla">
                    <thead>
                        <tr>
                            <th>Ítem</th>
                            <th>Cant.</th>
                            <th>Días</th>
                            <th>Valor unit.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cotizacion.items.map(it => `
                            <tr>
                                <td>${escaparHtml(it.codigo)} — ${escaparHtml(it.nombre)}</td>
                                <td>${it.cantidad}</td>
                                <td>${it.dias}</td>
                                <td>${formatearPrecio(it.valorUnitario)}</td>
                                <td>${formatearPrecio(it.subtotal)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>

            <div class="cot-totales">
                <div class="cot-totales-fila"><span>Subtotal</span><span>${formatearPrecio(cotizacion.subtotal)}</span></div>
                <div class="cot-totales-fila"><span>IVA (19%)</span><span>${formatearPrecio(cotizacion.iva)}</span></div>
                <div class="cot-totales-fila cot-total-final"><span>Total</span><span>${formatearPrecio(cotizacion.total)}</span></div>
            </div>
        </div>

        ${cotizacion.observaciones ? `
            <div class="cot-modal-seccion">
                <h4>Observaciones</h4>
                <p>${escaparHtml(cotizacion.observaciones)}</p>
            </div>
        ` : ""}

        <div class="cot-modal-footer">
            <button type="button" class="cot-btn" id="btnImprimirDetalle">🖨️ Imprimir</button>
            <button type="button" class="cot-btn-secundario" id="btnCerrarModal2">Cerrar</button>
        </div>
    `;

    modalOverlay.hidden = false;

    document.getElementById("btnCerrarModal").addEventListener("click", cerrarDetalle);
    document.getElementById("btnCerrarModal2").addEventListener("click", cerrarDetalle);
    document.getElementById("btnImprimirDetalle").addEventListener("click", () => window.print());
}

function cerrarDetalle(){
    modalOverlay.hidden = true;
    modalContenido.innerHTML = "";
}

modalOverlay.addEventListener("click", (e) => {
    if(e.target === modalOverlay) cerrarDetalle();
});

document.addEventListener("keydown", (e) => {
    if(e.key === "Escape" && !modalOverlay.hidden) cerrarDetalle();
});