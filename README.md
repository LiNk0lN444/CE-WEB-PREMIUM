🛠️ CE-Web
Sistema web integral para la gestión de inventario, alquiler de maquinaria pesada, herramientas y recursos. Desarrollado como proyecto de formación del SENA. La aplicación cuenta con una arquitectura desacoplada (Backend + Frontend), control de acceso basado en roles, automatización de procesos y está contenedorizada con Docker.

📌 Características Principales
Gestión de Inventario: Control de stock automático, alertas de productos agotados y módulo de mantenimiento.

Sistema de Reservas: Cotizaciones por meses con validación de fechas y stock en tiempo real.

Roles de Usuario: Control de acceso para Clientes, Administradores y Asesores Comerciales.

Flujo de Aprobación: Panel administrativo para aprobar/rechazar reservas pendientes.

Asignación Automática: Sistema inteligente que asigna asesores a compras superiores a $30.000.000 COP.

Notificaciones Automáticas: Envío de correos electrónicos para confirmación de reservas, aprobaciones, rechazos y avisos de vencimiento (3 días antes).

Auditoría: Triggers en la base de datos para registrar cada movimiento en el sistema.

Diseño UI/UX: Interfaz moderna, responsiva y adaptable a modo claro/oscuro.

Contenedorización: Despliegue rápido del entorno completo mediante Docker.

🚀 Tecnologías
Backend
Python 3

FastAPI

SQLAlchemy

Uvicorn

Passlib & Bcrypt (Encriptación de contraseñas)

APScheduler (Tareas programadas en segundo plano)

Frontend
React.js

Vite

HTML5 / CSS3

JavaScript (ES6+)

Base de Datos
PostgreSQL (Gestión de datos, triggers, funciones almacenadas y vistas)

Herramientas y Despliegue
Git & GitHub

Docker & Docker Compose

Swagger UI (Pruebas de API)

📂 Estructura del proyecto
text
CE-WEB-PREMIUM/
│
├── FAST-API/               # Código del Backend (Python/FastAPI)
│   ├── config/
│   ├── model/
│   ├── schema/
│   ├── main.py
│   └── requirements.txt
│
├── src/                    # Código del Frontend (React/Vite)
│   ├── components/
│   ├── services/
│   └── App.jsx
│
├── DATABASE/               # Scripts SQL (Creación de tablas, funciones, triggers)
│   └── ce_web_db.sql
│
├── docker-compose.yml      # Orquestación de contenedores
├── Dockerfile              # Configuración de Docker
├── package.json            # Dependencias del frontend
└── README.md
🐳 Ejecución con Docker (Recomendado)
La forma más rápida de ejecutar el proyecto completo (Base de datos + Backend + Frontend) es usando Docker.

Asegúrate de tener instalado Docker y Docker Compose.

En la raíz del proyecto, ejecuta:

bash
docker-compose up --build
El sistema estará disponible en:

Frontend: http://localhost:3000

Backend API (Swagger): http://localhost:8000/docs

Base de Datos: localhost:5432

Para detener los contenedores:

bash
docker-compose down
⚙️ Instalación Manual (Entorno de Desarrollo Local)
Si prefieres ejecutar el proyecto sin Docker, sigue estos pasos:

1. Clonar el repositorio
bash
git clone https://github.com/sanntiagoperez/Proyecto-CE-Web.git
cd CE-WEB-PREMIUM
2. Configurar el Backend
bash
cd FAST-API
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
Variables de entorno:
Crea un archivo .env en la carpeta FAST-API/ con las credenciales de tu base de datos y correo:

env
DATABASE_URL=postgresql://usuario:password@localhost:5432/ce_web
GMAIL_USER=tu_correo@gmail.com
GMAIL_APP_PASSWORD=tu_contraseña_de_aplicacion
Ejecutar servidor:

bash
uvicorn main:app --reload
3. Configurar el Frontend
Abre otra terminal en la raíz del proyecto:

bash
npm install
npm run dev
🔒 Seguridad
Las contraseñas se almacenan encriptadas utilizando Bcrypt.

El acceso a los endpoints y vistas está protegido según el rol del usuario (client, admin, asesor).

Se implementan variables de entorno para proteger credenciales sensibles.

En desarrollo se utiliza HTTP (localhost). Para producción se recomienda encarecidamente el uso de HTTPS para cifrar el tráfico y proteger las credenciales.

📈 Estado del proyecto
✅ Completado y funcional (Fase de pruebas finales).
El sistema cubre el flujo completo desde la visualización del catálogo por parte del cliente, la creación de la reserva, la aprobación administrativa, la asignación de asesores comerciales y la notificación vía email.

👨‍💻 Autores
Joan Santiago Pérez Granados

Julian David Forero Tilagüi

Emily Mora Silva

David Samuel Pérez Culma

Lincoln Eduardo Castro Esquivel

Proyecto desarrollado como parte de la formación en el SENA.