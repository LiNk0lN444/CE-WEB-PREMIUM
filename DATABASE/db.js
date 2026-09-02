// DATABASE/db.js (o en la raíz según prefieras)
const { Pool } = require('pg');

const pool = new Pool({
    user: 'tu_usuario',
    host: 'localhost',
    database: 'ce_web_db', // El nombre de tu base de datos en Postgres
    password: 'tu_password',
    port: 5432,
});

module.exports = pool;