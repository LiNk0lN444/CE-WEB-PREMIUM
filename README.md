# CE-Web

Sistema web para la gestión de maquinaria, herramientas y recursos, desarrollado como proyecto de formación del SENA. La aplicación permite administrar información mediante una API REST construida con FastAPI y una interfaz web.

## 📌 Características

- Gestión de maquinaria.
- Gestión de herramientas.
- Gestión de usuarios.
- Operaciones CRUD.
- API REST con FastAPI.
- Conexión a base de datos MySQL.
- Interfaz web desarrollada con HTML, CSS y JavaScript.

---

## 🚀 Tecnologías

### Backend
- Python
- FastAPI

### Frontend
- HTML5
- CSS3
- JavaScript

### Base de Datos
- Postgres

### Herramientas
- Git
- GitHub

---

## 📂 Estructura del proyecto

```text
Proyecto-CE-Web/
│
├── backend/
├── frontend/
├── database/
├── static/
├── templates/
├── requirements.txt
├── README.md
└── .gitignore
```

---

## ⚙️ Instalación

1. Clonar el repositorio.

```bash
git clone https://github.com/sanntiagoperez/Proyecto-CE-Web.git
```

2. Entrar al proyecto.

```bash
cd Proyecto-CE-Web
```

3. Crear el entorno virtual.

```bash
python -m venv .venv
```

4. Activar el entorno virtual.

### Windows

```bash
.venv\Scripts\activate
```

### Linux / macOS

```bash
source .venv/bin/activate
```

5. Instalar las dependencias.

```bash
pip install -r requirements.txt
```

6. Ejecutar el servidor.

```bash
fastapi dev main.py
```

o

```bash
uvicorn main:app --reload
```

---

## 🔒 Seguridad

Durante el desarrollo el proyecto utiliza **HTTP**, ya que se ejecuta en un entorno local (`localhost`).

Para un entorno de producción se recomienda implementar **HTTPS**, ya que:

- Protege la información transmitida.
- Cifra las credenciales de los usuarios.
- Aumenta la seguridad de la aplicación.
- Cumple con las buenas prácticas para aplicaciones web.

---

## 📈 Estado del proyecto

🚧 En desarrollo.

Se continúa trabajando en nuevas funcionalidades, mejoras de rendimiento y optimización de la aplicación.

---

## 👨‍💻 Autores

**Joan Santiago Pérez Granados**
**Julian David Forero Tilagüi**
**Emily Mora Silva**
**David Samuel Pérez Culma**
**Lincoln Eduardo Castro Esquivel**

Proyecto desarrollado como parte de la formación en el **SENA**.