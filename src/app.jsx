import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importa tus componentes (ajusta la ruta según dónde los hayas guardado)
import Catalogo from './components/catalogo';
import Cotizaciones from './components/cotizaciones';
import Inventario from './components/inventario';

// Si tienes un componente para el Inicio, impórtalo también. Si no, puedes crear uno rápido.
function Home() {
    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Bienvenido a CE-Web Constructora</h1>
            <p>Usa la barra de navegación o los enlaces para probar las vistas.</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                <li><a href="/catalogo">Ir al Catálogo</a></li>
                <li><a href="/cotizaciones">Ir a Cotizaciones</a></li>
                <li><a href="/inventario">Ir al Inventario</a></li>
            </ul>
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalogo" element={<Catalogo />} />
                <Route path="/cotizaciones" element={<Cotizaciones />} />
                <Route path="/inventario" element={<Inventario />} />
            </Routes>
        </Router>
    );
}