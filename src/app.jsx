import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importa tus componentes de vistas
import Catalogo from './components/catalogo';
import Cotizaciones from './components/cotizaciones';
import Inventario from './components/inventario';

// Componente rápido para la página de inicio (puedes adaptarlo si ya tienes uno)
function Home() {
    return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <h1>CE-Web Constructora</h1>
            <p>Bienvenido al sistema de gestión y alquiler de maquinaria.</p>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <a href="/catalogo" className="btn">Ver Catálogo</a>
                <a href="/cotizaciones" className="btn">Ir a Cotizaciones</a>
                <a href="/inventario" className="btn">Ir a Inventario</a>
            </div>
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