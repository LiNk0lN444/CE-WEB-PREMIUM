// =========================================================
// CAMBIO DE TEMA (claro / oscuro)
// =========================================================

const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        themeBtn.textContent = "☀️";
        localStorage.setItem("theme", "dark");
    } else {
        themeBtn.textContent = "🌙";
        localStorage.setItem("theme", "light");
    }
});

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeBtn.textContent = "☀️";
}


// =========================================================
// PRODUCTOS DEL CATÁLOGO
// =========================================================
// Para agregar un producto nuevo, solo copia un objeto de este
// array y cambia sus datos. No es necesario tocar el HTML ni
// el CSS: la tarjeta, el filtro de categoría y el buscador se
// generan solos a partir de esta lista.
//
// Campos:
//  - id          : identificador único (texto o número)
//  - nombre      : nombre del producto (se usa también en el buscador)
//  - categoria   : texto de la categoría (ej: "Maquinaria", "Herramientas").
//                  Si usas una categoría nueva, el botón de filtro
//                  correspondiente aparece automáticamente.
//  - imagen      : ruta de la imagen del producto
//  - descripcion : texto descriptivo
//  - link        : URL del botón "Leer más" (puede ser "" si no hay ficha)
// =========================================================

const productos = [
// ============== Maquinaria ==============
    {
        id: "excavadora-340d2l",
        nombre: "Excavadora Oruga 340D2 L",
        categoria: "Maquinaria",
        imagen: "../ASSETS/IMG/ex.png",
        descripcion: "Excavadora hidráulica sobre orugas Caterpillar, modelo Cat 340D2 L. Pertenece a la categoría de excavadoras grandes, diseñadas para proyectos de gran magnitud que requieren alta potencia, fiabilidad y durabilidad.",
        link: "https://www.plmcat.com/docs/default-source/hydraulic-excavators/349-aexq2493-01.pdf?sfvrsn=54ae0258_4"
    },
    {
        id: "tractor-orugas-d10",
        nombre: "Tractores Sobre Orugas",
        categoria: "Maquinaria",
        imagen: "../ASSETS/IMG/pal.png",
        descripcion: "Resultado de una constante evolución, diseñado para ofrecer un rendimiento superior en cada proyecto. Gracias a innovaciones como el nuevo convertidor de par, el D10 es más eficiente, fácil de mantener y más duradero que sus predecesores.",
        link: "https://static.ferreyros.com.pe/fcsaprdferreyros01/2024/09/TRACTOR-D7.pdf?_gl=1*19qyyuo*_gcl_au*OTQyNjM0NTgxLjE3ODIyMjc0MDA."
    },
    {
        id: "camion-cat798ac",
        nombre: "CAT®798 AC",
        categoria: "Maquinaria",
        imagen: "../ASSETS/IMG/vol.png",
        descripcion: "Diseñado para acarrear más, con más eficiencia, capacidad de control y confiabilidad que cualquier otro camión de mando eléctrico en el mercado. Ofrece el mismo rendimiento potente y comprobado que puede esperar de un camión Cat.",
        link: "https://s7d2.scene7.com/is/content/Caterpillar/CM20220325-25240-c3600"
    },
    {
        id: "excavadora-340d2l",
        nombre: "Motoniveladora CAT 140 GC",
        categoria: "Maquinaria",
        imagen: "../ASSETS/IMG/mot.png",
        descripcion: "La Motoniveladora 140 GC Cat® proporciona rendimiento fiable y eficiencia del combustible para trabajos en carreteras, preparación de sitios y nivelación. Las características de fácil acceso para el servicio y comodidad del operador aumentan la productividad y reducen los costos de operación.",
        link: "https://www.finning.com/content/dam/finning/es/Documents/PDF/ficha-tecnica/motoniveladora/140GC.pdf"
    },
    {
        id: "excavadora-340d2l",
        nombre: "Motoniveladora CAT 150 AWD",
        categoria: "Maquinaria",
        imagen: "../ASSETS/IMG/mot150.png",
        descripcion: "Con un legendario historial de motoniveladoras Cat®, los modelos 150/150 AWD ofrecen máximo rendimiento, eficiencia, vida útil prolongada y comodidad para el operador. Disponible con un gran conjunto de tecnologías para disminuir la carga sobre los operadores y mejorar el rendimiento en los trabajos de nivelación, el modelo 150 es una máquina de alta productividad.",
        link: "https://www.finning.com/content/dam/finning/es/Documents/PDF/ficha-tecnica/motoniveladora/140.pdf"
    },
    {
        id: "excavadora-340d2l",
        nombre: "Cargador frontal CAT 950 GC",
        categoria: "Maquinaria",
        imagen: "../ASSETS/IMG/car.png",
        descripcion: "El nuevo Cargador de Ruedas 950 GC Cat® se diseñó específicamente para realizar todos los trabajos en el sitio, desde la manipulación de materiales y la carga de camiones, hasta la construcción general y el apilamiento. El gran rendimiento de la máquina junto con los bajos costos de posesión y operación hacen que el 950 GC sea la mejor opción para su negocio.",
        link: "https://www.kellytractor.com/esp/imagenes/pdf/demolicion_desechos/cargadores_ruedas/950h.pdf"
    },
    {
        id: "excavadora-340d2l",
        nombre: "Cargador frontal CAT 966 GC",
        categoria: "Maquinaria",
        imagen: "../ASSETS/IMG/car.png",
        descripcion: "El cargador frontal Cat 966H es una máquina mediana de ruedas fabricada entre 2006 y 2011. Cuenta con un motor Cat C11 ACERT de aproximadamente 262 hp netos, un peso operativo cercano a las 23.1 toneladas y una capacidad de cucharón estándar de 3.4 a 4.2 m³, ideal para construcción, minería y manipulación de áridos.",
        link: "https://www.kellytractor.com/esp/imagenes/pdf/demolicion_desechos/cargadores_ruedas/966h.pdf"
    },
    {
        id: "excavadora-340d2l",
        nombre: "Retroexcavadora CAT 420",
        categoria: "Maquinaria",
        imagen: "../ASSETS/IMG/re.png",
        descripcion: "Las Retroexcavadoras Cargadoras Cat® 420 proporcionan rendimiento, una mayor eficiencia del combustible, un sistema hidráulico superior, versatilidad y una estación del operador renovada.",
        link: "https://www.finning.com/content/dam/finning/es/Documents/PDF/420SmallSpecalog(ASHQ8334-00).pdf"
    },
    {
        id: "excavadora-340d2l",
        nombre: "Minicargador CAT 262D3",
        categoria: "Maquinaria",
        imagen: "../ASSETS/IMG/mini.png",
        descripcion: "El Minicargador 262D3 Cat®, con su diseño de levantamiento vertical, proporciona mayor alcance y altura de levantamiento para facilitar y agilizar la carga de camiones. Su estabilidad y rendimiento de levantamiento proporciona una excelente manipulación de materiales.",
        link: "https://s7d2.scene7.com/is/content/Caterpillar/CM20200501-b9bdf-a0f9c"
    },
    {
        id: "excavadora-340d2l",
        nombre: "Excavadora de ruedas CAT M320",
        categoria: "Maquinaria",
        imagen: "../ASSETS/IMG/ca.png",
        descripcion: "La Excavadora de Ruedas Cat® M320 ofrece un rendimiento excepcional gracias a su elevado par de giro, que permite realizar el trabajo con rapidez. Con unos costes de mantenimiento reducidos, unos intervalos de servicio amplios y la posibilidad de realizar el 100 % de las comprobaciones diarias a nivel del suelo, la M320 le ayuda a ahorrar tiempo y dinero. La cabina, diseñada pensando en la comodidad del operador, le permite trabajar de forma rápida y eficiente.",
        link: "https://s7d2.scene7.com/is/content/Caterpillar/CM20251021-b0eb1-cbc58"
    },
    {
        id: "excavadora-340d2l",
        nombre: "Tractor de ruedas CAT 824",
        categoria: "Maquinaria",
        imagen: "../ASSETS/IMG/tra.png",
        descripcion: "Los tractores topadores de ruedas Cat® combinan la potencia de un tractor topador de cadenas con la facilidad de movimiento de una máquina sobre ruedas. De esta manera, ofrecen mayor producción con un costo de operación bajo en una variedad de aplicaciones, desde la limpieza para el sector de la minería en superficie hasta el apilamiento de carbón y el mantenimiento y la recuperación de carreteras.",
        link: "https://www.finning.com/content/dam/finning/es/Documents/PDF/fichas-tectinas/27-octubre/CS10GC.pdf"
    },
    {
        id: "excavadora-340d2l",
        nombre: "Rodillo vibratorio CAT CS11 GC",
        categoria: "Maquinaria",
        imagen: "../ASSETS/IMG/ro.png",
        descripcion: "Los Compactadores de Suelos Vibratorios Cat® CS11 GC son ideales para aplicaciones en suelos granulares o cohesivos mediante el uso de un kit de revestimiento de pisones optativo. Un sistema vibratorio confiable, una comodidad excepcional para el operador y facilidad de uso que proporcionan una producción confiable y económica con un rendimiento que supera las expectativas.",
        link: "https://s7d2.scene7.com/is/content/Caterpillar/CM20240318-c9169-09e20"
    },
    // ============== Herramientas ==============
    {
        id: "atornillador-gdr18v215",
        nombre: "Atornillador de Impacto Brushless 18V 215 Nm GDR 18V-215 Bosch",
        categoria: "Herramientas",
        imagen: "../ASSETS/IMG/ato.png",
        descripcion: "Potencia y rapidez para tus proyectos más exigentes. Su motor Brushless garantiza mayor durabilidad, mientras que sus 3.300 RPM y 215 Nm de torque permiten atornillar con facilidad en materiales densos y metales de hasta 3 mm.",
        link: "https://docs.rs-online.com/0ad5/A700000015628384.pdf"
    },
    {
        id: "pulidora-bauker",
        nombre: "Kit Pulidora 4-1/2 pulg 1010W + 3 Discos de Corte Bauker",
        categoria: "Herramientas",
        imagen: "../ASSETS/IMG/pul.png",
        descripcion: "La herramienta ideal para trabajos profesionales. Con su potente motor de 1010W y un diámetro de disco de 4-1/2 pulgadas, permite realizar cortes precisos y eficientes. Incluye 3 discos de corte para empezar a trabajar de inmediato.",
        link: "https://www.bauker.com/wp-content/uploads/2021/05/AG820E-AG820EK-AG820EK2-AG820EK4-AG820EK16-AG820EK20_manual_preview.pdf"
    },
    {
        id: "taladro-bauker",
        nombre: "Taladro Percutor 3/8-pulg 12V 1.3Ah I-L Bauker",
        categoria: "Herramientas",
        imagen: "../ASSETS/IMG/ta.png",
        descripcion: "Tu mejor aliado para trabajos profesionales. Con su potente motor de 12V y un mandril de 10 mm, permite realizar perforaciones con precisión y eficiencia. Su diseño ergonómico y ligero brinda comodidad durante el uso.",
        link: "https://www.bauker.com/wp-content/uploads/2021/05/SD-GS1041_manual_preview.pdf"
    },
    {
        id: "Sierra Circular 7-1/4 1.800 W",
        nombre: "Sierra Circular 7-1/4 1.800 W",
        categoria: "Herramientas",
        imagen: "../ASSETS/IMG/cie.png",
        descripcion: "Dale un impulso a tus proyectos con la Sierra Circular Bauker de 7 1/4, ¡la herramienta ideal para cortes precisos y eficientes! Con una potencia de 1800W y una velocidad de 5500 RPM, esta sierra circular te permitirá trabajar madera con facilidad y rapidez. Su diseño ergonómico y bloqueo de seguridad te brindan comodidad y seguridad durante su uso. ¡No esperes más para obtener resultados profesionales!",
        link: "https://f.epaenlinea.com/cr/documentos/100010308.pdf"
    },
    {
        id: "Sierra Caladora 650 W",
        nombre: "Sierra Caladora 650 W",
        categoria: "Herramientas",
        imagen: "../ASSETS/IMG/cal.png",
        descripcion: "La Sierra caladora cuenta con una potencia de 650w y es una herramienta de corte eléctrica que permite cortar con precisión ciertos materiales, con cortes rectos, curvos o biselados, dependiendo de la hoja que se emplee. Para cortar con la caladora pueden usarse diseños de plantilla y otras formas en una pieza de madera, chapado, aglomerado, melamina, cartón, cuero, corcho, etc.",
        link: "https://www.truper.com/ficha_tecnica_pdf/views/ficha-print.php?id=3595"
    },
    {
        id: "Sierra Sable Inalámbrica 20 V",
        nombre: "Sierra Sable Inalámbrica 20 V",
        categoria: "Herramientas",
        imagen: "../ASSETS/IMG/sab.png",
        descripcion: "¡Potencia tus proyectos con la Sierra Sable Dewalt 20V! Diseñada para ofrecer un rendimiento excepcional, esta herramienta inalámbrica te brinda la libertad de movimiento que necesitas para cortar con precisión y rapidez en cualquier lugar. Su diseño ergonómico y su potencia te permitirán abordar tareas exigentes con total comodidad y control, haciendo que cada corte sea más eficiente.",
        link: "https://www.dwmx.mx/image/catalog/pdf/06295dc85cc2421c78b65bf594e97a7d-DCS380B%20-FT.pdf"
    },
    {
        id: "Rotomartillo SDS Plus 2.6 J Einhell",
        nombre: "Rotomartillo SDS Plus 2.6 J Einhell",
        categoria: "Herramientas",
        imagen: "../ASSETS/IMG/roto.png",
        descripcion: "Cuando las cosas se ponen difíciles, el Rotomartillo SDS Plus 2.6 J Einhell es tu solución. Este rotomartillo industrial, con una potencia de 800 W y una fuerza de impacto de 2.6 J, está diseñado para perforar y martillar materiales duros como piedra y hormigón. ¡Prepárate para enfrentar cualquier proyecto de construcción o reforma!",
        link: "https://www.dwmx.mx/image/catalog/pdf/06295dc85cc2421c78b65bf594e97a7d-DCS380B%20-FT.pdf"
    },
    {
        id: "Lijadora Orbital 300 W",
        nombre: "Lijadora Orbital 300 W",
        categoria: "Herramientas",
        imagen: "../ASSETS/IMG/puli.png",
        descripcion: "Lijadora orbital con potencia de 300 watts marca Elite para uso profesional.; Ideal para desbaste, lijado, matizado y pulido de superficies de madera, metal, acrílico, drywall, entre otros.",
        link: "https://files.plytix.com/api/v1.1/file/public_files/pim/assets/03/61/ac/62/62ac6103bb3a1aaaf0e8f798/texts/48/6b/65/63/63656b480afd3071e84c9697/Ficha_tecnica_comercial_PS300_ELITE.pdf"
    },
    {
        id: "Lijadora de Banda 950 W",
        nombre: "Lijadora de Banda 950 W",
        categoria: "Herramientas",
        imagen: "../ASSETS/IMG/li.png",
        descripcion: "Dale el acabado perfecto a tus proyectos de carpintería con la Lijadora Banda Ubermann EBS900H. Con una potencia de 900W y una velocidad variable de hasta 300 m/min, esta herramienta te permitirá lijar de manera eficiente y precisa, logrando resultados profesionales. Su diseño ergonómico con mango delantero regulable te brindará comodidad y control durante el trabajo. ¡No esperes más para obtener resultados impecables",
        link: "https://www.ubermann.com/wp-content/uploads/2021/05/LIJADORA-DE-BANDA-MODELO-2221-UBERMANN.pdf"
    },
    {
        id: "Cepillo Eléctrico 750 W",
        nombre: "Cepillo Eléctrico 750 W",
        categoria: "Herramientas",
        imagen: "../ASSETS/IMG/cep.png",
        descripcion: "¡Transforma tus proyectos de carpintería con el Cepillo Eléctrico Stanley de 750W! Diseñado para ofrecer versatilidad y precisión, este cepillo es tu aliado ideal para instalaciones de puertas, ajustes de cantos y marcos, y para darle ese toque profesional a tus trabajos. Su potencia te garantiza una remoción de material eficiente, mientras que sus canales de biselado te permiten lograr acabados perfectos con facilidad.",
        link: "https://www.dwmx.mx/image/catalog/pdf/dd1f9a0047a3e2bec5754eb57c011619-STPP7502-B3%20-FT.pdf"
    },
    {
        id: "Pistola de Calor 2.000 W",
        nombre: "Pistola de Calor 2.000 W",
        categoria: "Herramientas",
        imagen: "../ASSETS/IMG/pis.png",
        descripcion: "La Pistola de Calor Digital 2000W es la herramienta perfecta para tus proyectos. Con su control de temperatura variable y pantalla LCD, podrás trabajar con precisión y obtener resultados profesionales. ¡Es duradera y potente!",
        link: "https://cdn.makitatools.com/apps/cms/doc/prod/HG6/addd2c17-e58a-4d37-bc73-2caa11705ea0_HG6530VK_NTFS.pdf"
    },
    {
        id: "Multiherramienta Oscilante 300 W",
        nombre: "Multiherramienta Oscilante 300 W",
        categoria: "Herramientas",
        imagen: "../ASSETS/IMG/mul.png",
        descripcion: "¡Transforma tus proyectos con la Multiherramienta Total de 300W! Diseñada para ofrecerte versatilidad y potencia, esta herramienta te permitirá realizar una amplia gama de tareas con facilidad y precisión. Su diseño ergonómico y su potencia de 300W la convierten en la aliada perfecta para profesionales y aficionados que buscan resultados impecables en cada trabajo.",
        link: "https://www.carbone-data.com/pdf/shopify/uts3006-flexible-multitool-oscil.pdf"
    },


    // 👉 Ejemplo de cómo agregar un producto nuevo:
    // {
    //     id: "mi-producto-nuevo",
    //     nombre: "Nombre del producto",
    //     categoria: "Maquinaria",
    //     imagen: "../ASSETS/IMG/mi-imagen.png",
    //     descripcion: "Descripción del producto...",
    //     link: "https://enlace-a-la-ficha.pdf"
    // },

];


// =========================================================
// ESTADO ACTUAL DE FILTRO Y BÚSQUEDA
// =========================================================

let filtroActivo = "todos";
let textoBusqueda = "";


// =========================================================
// REFERENCIAS AL DOM
// =========================================================

const filtrosContenedor = document.getElementById("filtros");
const gridContenedor = document.getElementById("gridProductos");
const buscadorInput = document.getElementById("buscadorInput");
const sinResultados = document.getElementById("sinResultados");


// =========================================================
// CONSTRUIR LOS BOTONES DE FILTRO A PARTIR DE LAS CATEGORÍAS
// =========================================================

function construirFiltros() {

    const categorias = ["todos", ...new Set(productos.map(p => p.categoria))];

    filtrosContenedor.innerHTML = "";

    categorias.forEach((categoria) => {

        const boton = document.createElement("button");

        boton.textContent = categoria === "todos" ? "Todos" : categoria;
        boton.dataset.filtro = categoria;

        if (categoria === filtroActivo) {
            boton.classList.add("activo");
        }

        boton.addEventListener("click", () => {
            filtroActivo = categoria;

            // Marcar visualmente el botón activo
            filtrosContenedor
                .querySelectorAll("button")
                .forEach(b => b.classList.remove("activo"));
            boton.classList.add("activo");

            renderizarProductos();
        });

        filtrosContenedor.appendChild(boton);
    });
}


// =========================================================
// CREAR LA TARJETA HTML DE UN PRODUCTO
// =========================================================

function crearTarjeta(producto) {

    const card = document.createElement("div");
    card.className = "card";

    const enlace = producto.link
        ? `<a href="${producto.link}" class="btn-pro" target="_blank" rel="noopener">Leer más</a>`
        : "";

    card.innerHTML = `
        <div class="img-pro">
            <span class="categoria-tag">${producto.categoria}</span>
            <div class="img-placeholder">
                <img src="${producto.imagen}" alt="${producto.nombre}">
            </div>
            <h4 class="title">${producto.nombre}</h4>
            <p class="text">${producto.descripcion}</p>
            <br>
            ${enlace}
        </div>
    `;

    return card;
}


// =========================================================
// RENDERIZAR PRODUCTOS SEGÚN FILTRO + BÚSQUEDA ACTUALES
// =========================================================

function renderizarProductos() {

    const busqueda = textoBusqueda.trim().toLowerCase();

    const productosFiltrados = productos.filter((producto) => {

        const coincideCategoria =
            filtroActivo === "todos" || producto.categoria === filtroActivo;

        const coincideBusqueda =
            busqueda === "" || producto.nombre.toLowerCase().includes(busqueda);

        return coincideCategoria && coincideBusqueda;
    });

    gridContenedor.innerHTML = "";

    productosFiltrados.forEach((producto) => {
        gridContenedor.appendChild(crearTarjeta(producto));
    });

    sinResultados.style.display = productosFiltrados.length === 0 ? "block" : "none";
}


// =========================================================
// BUSCADOR EN VIVO
// =========================================================

buscadorInput.addEventListener("input", (evento) => {
    textoBusqueda = evento.target.value;
    renderizarProductos();
});


// =========================================================
// INICIALIZAR CATÁLOGO
// =========================================================

construirFiltros();
renderizarProductos();