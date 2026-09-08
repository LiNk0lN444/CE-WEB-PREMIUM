import { Link } from 'react-router-dom';

function Navbar() {
    // Verificamos si el usuario ha iniciado sesión (puedes cambiar 'token' por el nombre de tu variable de sesión)
    const isAuthenticated = Boolean(localStorage.getItem('token') || sessionStorage.getItem('token'));

    return (
        <header className="header-principal"> {/* Ajusta esta clase según tu CSS actual */}
            <div className="logo">
                <span className="icon">🛠️</span> CE-Web
            </div>
            <nav className="navbar">
                <Link to="/">Inicio</Link>
                <Link to="/catalogo">Catálogo</Link>

                {/* El botón de Inventario solo se muestra si el usuario está logueado */}
                {isAuthenticated && (
                    <Link to="/inventario">Inventario</Link>
                )}

                <Link to="/cotizaciones">Cotizaciones</Link>

                {/* Botón dinámico de Iniciar o Cerrar Sesión */}
                {isAuthenticated ? (
                    <Link to="/logout" className="btn-login">Cerrar Sesión</Link>
                ) : (
                    <Link to="/login" className="btn-login">Iniciar Sesión</Link>
                )}
            </nav>
        </header>
    );
}

export default Navbar;