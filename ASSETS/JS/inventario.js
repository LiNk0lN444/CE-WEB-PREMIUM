/* =========================================================
   INVENTARIO.JS - Gestión de Maquinaria y Herramientas
   (CE-Web Constructora)
   Acceso exclusivo para usuarios con rol "Asesor" o
   "Administrador". Persistencia local (localStorage)
   simulando las tablas "maquinaria" y "herramientas" del
   esquema de base de datos.
   ========================================================= */

const CE_INV_MAQUINARIA_KEY = "ce_inventario_maquinaria";
const CE_INV_HERRAMIENTAS_KEY = "ce_inventario_herramientas";

// =========================
// GUARDIA DE ACCESO
// =========================

const usuarioSesion = ceObtenerSesion();

if(!usuarioSesion){
    window.location.href = "/VISTAS/login.html";
    throw new Error("Sesión no iniciada");
}

const accesoPermitido = ceEsAsesorOAdministrador(usuarioSesion);

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("accesoDenegado").hidden = accesoPermitido;
    document.getElementById("invContainer").hidden = !accesoPermitido;
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

document.querySelectorAll(".inv-tab-btn").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".inv-tab-btn").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".inv-tab-panel").forEach(p => p.classList.remove("active"));

        tab.classList.add("active");
        document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
    });
});

// =========================
// UTILIDADES DE ALMACENAMIENTO
// =========================

function ceLeerLista(clave){
    const guardado = localStorage.getItem(clave);
    if(!guardado) return [];
    try{
        return JSON.parse(guardado);
    }catch(e){
        return [];
    }
}

function ceGuardarLista(clave, lista){
    localStorage.setItem(clave, JSON.stringify(lista));
}

function ceGenerarIdItem(){
    return "i_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatearPrecio(valor){
    const numero = Number(valor) || 0;
    return numero.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function escaparHtml(texto){
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

// =========================
// MAQUINARIA
// =========================

const formMaquinaria = document.getElementById("formMaquinaria");
const maquinariaIdInput = document.getElementById("maquinariaId");
const maqCodigo = document.getElementById("maqCodigo");
const maqNombre = document.getElementById("maqNombre");
const maqMarca = document.getElementById("maqMarca");
const maqModelo = document.getElementById("maqModelo");
const maqPrecio = document.getElementById("maqPrecio");
const maqEstado = document.getElementById("maqEstado");
const maqImagen = document.getElementById("maqImagen");
const maqDescripcion = document.getElementById("maqDescripcion");
const errMaquinaria = document.getElementById("errMaquinaria");
const listaMaquinaria = document.getElementById("listaMaquinaria");
const maquinariaVacio = document.getElementById("maquinariaVacio");
const btnGuardarMaquinaria = document.getElementById("btnGuardarMaquinaria");
const btnCancelarMaquinaria = document.getElementById("btnCancelarMaquinaria");

const ESTADOS_MAQUINARIA = {
    disponible: "Disponible",
    alquilada: "Alquilada",
    mantenimiento: "En mantenimiento"
};

function renderMaquinaria(){
    const lista = ceLeerLista(CE_INV_MAQUINARIA_KEY);

    maquinariaVacio.hidden = lista.length !== 0;

    listaMaquinaria.innerHTML = lista.map(item => `
        <tr data-id="${item.id}">
            <td>${escaparHtml(item.codigo)}</td>
            <td>${escaparHtml(item.nombre)}</td>
            <td>${escaparHtml(item.marca)} ${escaparHtml(item.modelo)}</td>
            <td>${formatearPrecio(item.precioDia)}</td>
            <td><span class="inv-badge inv-badge-${item.estado}">${ESTADOS_MAQUINARIA[item.estado] || item.estado}</span></td>
            <td>
                <button type="button" class="inv-btn-editar" data-accion="editar-maquinaria" data-id="${item.id}">✏️</button>
                <button type="button" class="inv-btn-eliminar" data-accion="eliminar-maquinaria" data-id="${item.id}">🗑️</button>
            </td>
        </tr>
    `).join("");
}

function limpiarFormMaquinaria(){
    formMaquinaria.reset();
    maquinariaIdInput.value = "";
    errMaquinaria.textContent = "";
    btnGuardarMaquinaria.textContent = "Agregar maquinaria";
    btnCancelarMaquinaria.hidden = true;
}

formMaquinaria.addEventListener("submit", (e) => {
    e.preventDefault();
    errMaquinaria.textContent = "";

    const codigo = maqCodigo.value.trim();
    const nombre = maqNombre.value.trim();
    const precio = maqPrecio.value;

    if(!codigo || !nombre || precio === ""){
        errMaquinaria.textContent = "Completa al menos el código, el nombre y el precio por día";
        return;
    }

    if(Number(precio) < 0){
        errMaquinaria.textContent = "El precio no puede ser negativo";
        return;
    }

    const lista = ceLeerLista(CE_INV_MAQUINARIA_KEY);
    const idEditando = maquinariaIdInput.value;

    const codigoDuplicado = lista.some(
        item => item.codigo.toLowerCase() === codigo.toLowerCase() && item.id !== idEditando
    );

    if(codigoDuplicado){
        errMaquinaria.textContent = "Ya existe una máquina con ese código";
        return;
    }

    const datos = {
        codigo,
        nombre,
        marca: maqMarca.value.trim(),
        modelo: maqModelo.value.trim(),
        precioDia: Number(precio),
        estado: maqEstado.value,
        imagen: maqImagen.value.trim(),
        descripcion: maqDescripcion.value.trim()
    };

    if(idEditando){
        const idx = lista.findIndex(item => item.id === idEditando);
        if(idx !== -1){
            lista[idx] = { ...lista[idx], ...datos };
        }
        mostrarToast("Maquinaria actualizada correctamente", "success");
    }else{
        lista.push({ id: ceGenerarIdItem(), ...datos });
        mostrarToast("Maquinaria agregada correctamente", "success");
    }

    ceGuardarLista(CE_INV_MAQUINARIA_KEY, lista);
    limpiarFormMaquinaria();
    renderMaquinaria();
});

btnCancelarMaquinaria.addEventListener("click", limpiarFormMaquinaria);

listaMaquinaria.addEventListener("click", (e) => {
    const boton = e.target.closest("button");
    if(!boton) return;

    const id = boton.dataset.id;
    const lista = ceLeerLista(CE_INV_MAQUINARIA_KEY);
    const item = lista.find(m => m.id === id);
    if(!item) return;

    if(boton.dataset.accion === "editar-maquinaria"){
        maquinariaIdInput.value = item.id;
        maqCodigo.value = item.codigo;
        maqNombre.value = item.nombre;
        maqMarca.value = item.marca || "";
        maqModelo.value = item.modelo || "";
        maqPrecio.value = item.precioDia;
        maqEstado.value = item.estado || "disponible";
        maqImagen.value = item.imagen || "";
        maqDescripcion.value = item.descripcion || "";

        btnGuardarMaquinaria.textContent = "Guardar cambios";
        btnCancelarMaquinaria.hidden = false;
        formMaquinaria.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if(boton.dataset.accion === "eliminar-maquinaria"){
        const nuevaLista = lista.filter(m => m.id !== id);
        ceGuardarLista(CE_INV_MAQUINARIA_KEY, nuevaLista);
        renderMaquinaria();
        mostrarToast("Maquinaria eliminada", "success");
    }
});

// =========================
// HERRAMIENTAS
// =========================

const formHerramienta = document.getElementById("formHerramienta");
const herramientaIdInput = document.getElementById("herramientaId");
const herCodigo = document.getElementById("herCodigo");
const herNombre = document.getElementById("herNombre");
const herCategoria = document.getElementById("herCategoria");
const herCantidad = document.getElementById("herCantidad");
const herPrecio = document.getElementById("herPrecio");
const herImagen = document.getElementById("herImagen");
const herDescripcion = document.getElementById("herDescripcion");
const errHerramienta = document.getElementById("errHerramienta");
const listaHerramientas = document.getElementById("listaHerramientas");
const herramientasVacio = document.getElementById("herramientasVacio");
const btnGuardarHerramienta = document.getElementById("btnGuardarHerramienta");
const btnCancelarHerramienta = document.getElementById("btnCancelarHerramienta");

function renderHerramientas(){
    const lista = ceLeerLista(CE_INV_HERRAMIENTAS_KEY);

    herramientasVacio.hidden = lista.length !== 0;

    listaHerramientas.innerHTML = lista.map(item => `
        <tr data-id="${item.id}">
            <td>${escaparHtml(item.codigo)}</td>
            <td>${escaparHtml(item.nombre)}</td>
            <td>${escaparHtml(item.categoria) || "—"}</td>
            <td>${Number(item.cantidad) || 0}</td>
            <td>${formatearPrecio(item.precio)}</td>
            <td>
                <button type="button" class="inv-btn-editar" data-accion="editar-herramienta" data-id="${item.id}">✏️</button>
                <button type="button" class="inv-btn-eliminar" data-accion="eliminar-herramienta" data-id="${item.id}">🗑️</button>
            </td>
        </tr>
    `).join("");
}

function limpiarFormHerramienta(){
    formHerramienta.reset();
    herramientaIdInput.value = "";
    errHerramienta.textContent = "";
    btnGuardarHerramienta.textContent = "Agregar herramienta";
    btnCancelarHerramienta.hidden = true;
}

formHerramienta.addEventListener("submit", (e) => {
    e.preventDefault();
    errHerramienta.textContent = "";

    const codigo = herCodigo.value.trim();
    const nombre = herNombre.value.trim();
    const cantidad = herCantidad.value;
    const precio = herPrecio.value;

    if(!codigo || !nombre || cantidad === "" || precio === ""){
        errHerramienta.textContent = "Completa al menos el código, el nombre, la cantidad y el precio";
        return;
    }

    if(Number(cantidad) < 0 || Number(precio) < 0){
        errHerramienta.textContent = "La cantidad y el precio no pueden ser negativos";
        return;
    }

    const lista = ceLeerLista(CE_INV_HERRAMIENTAS_KEY);
    const idEditando = herramientaIdInput.value;

    const codigoDuplicado = lista.some(
        item => item.codigo.toLowerCase() === codigo.toLowerCase() && item.id !== idEditando
    );

    if(codigoDuplicado){
        errHerramienta.textContent = "Ya existe una herramienta con ese código";
        return;
    }

    const datos = {
        codigo,
        nombre,
        categoria: herCategoria.value.trim(),
        cantidad: Number(cantidad),
        precio: Number(precio),
        imagen: herImagen.value.trim(),
        descripcion: herDescripcion.value.trim()
    };

    if(idEditando){
        const idx = lista.findIndex(item => item.id === idEditando);
        if(idx !== -1){
            lista[idx] = { ...lista[idx], ...datos };
        }
        mostrarToast("Herramienta actualizada correctamente", "success");
    }else{
        lista.push({ id: ceGenerarIdItem(), ...datos });
        mostrarToast("Herramienta agregada correctamente", "success");
    }

    ceGuardarLista(CE_INV_HERRAMIENTAS_KEY, lista);
    limpiarFormHerramienta();
    renderHerramientas();
});

btnCancelarHerramienta.addEventListener("click", limpiarFormHerramienta);

listaHerramientas.addEventListener("click", (e) => {
    const boton = e.target.closest("button");
    if(!boton) return;

    const id = boton.dataset.id;
    const lista = ceLeerLista(CE_INV_HERRAMIENTAS_KEY);
    const item = lista.find(h => h.id === id);
    if(!item) return;

    if(boton.dataset.accion === "editar-herramienta"){
        herramientaIdInput.value = item.id;
        herCodigo.value = item.codigo;
        herNombre.value = item.nombre;
        herCategoria.value = item.categoria || "";
        herCantidad.value = item.cantidad;
        herPrecio.value = item.precio;
        herImagen.value = item.imagen || "";
        herDescripcion.value = item.descripcion || "";

        btnGuardarHerramienta.textContent = "Guardar cambios";
        btnCancelarHerramienta.hidden = false;
        formHerramienta.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if(boton.dataset.accion === "eliminar-herramienta"){
        const nuevaLista = lista.filter(h => h.id !== id);
        ceGuardarLista(CE_INV_HERRAMIENTAS_KEY, nuevaLista);
        renderHerramientas();
        mostrarToast("Herramienta eliminada", "success");
    }
});

// =========================
// INICIALIZAR
// =========================

renderMaquinaria();
renderHerramientas();