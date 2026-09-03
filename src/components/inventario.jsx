import React, { useState, useEffect } from 'react';
import { obtenerHerramientas } from '../services/api';
import '../assests/css/inventario.css'; // Ajusta la ruta de tu CSS según corresponda

export default function Inventario() {
    const [herramientas, setHerramientas] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Cargar los datos cuando el componente se monte
    useEffect(() => {
        obtenerHerramientas()
            .then(data => {
                setHerramientas(data);
                setCargando(false);
            })
            .catch(err => {
                console.error(err);
                setCargando(false);
            });
    }, []);

    return (
        <div className="inventario-container" style={{ padding: '20px' }}>
            <h2>Gestión de Inventario y Herramientas</h2>
            
            {cargando ? (
                <p>Cargando datos desde el servidor...</p>
            ) : (
                <table border="1" cellPadding="10" style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {herramientas.length > 0 ? (
                            herramientas.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.codigo}</td>
                                    <td>{item.nombre}</td>
                                    <td>{item.descripcion}</td>
                                    <td>{item.cantidad_disponible}</td>
                                    <td>${item.precio}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center' }}>No hay herramientas registradas.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}