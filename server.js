const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = 3000;

app.use(express.json());


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres', 
    password: '1508',
    port: 5432,
});


app.get('/api/clientes', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM clientes');
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clientes', async (req, res) => {
    const { nombre, correo } = req.body;
    try {
        const nuevo = await pool.query(
            'INSERT INTO clientes (nombre, correo) VALUES ($1, $2) RETURNING *',
            [nombre, correo]
        );
        res.status(201).json(nuevo.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(PORT, () => {
    console.log(` Servidor backend corriendo en http://localhost:${PORT}`);
});
