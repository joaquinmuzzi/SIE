const mysql = require('mysql2/promise');

const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

const pool = mysql.createPool(
  dbUrl
    ? { uri: dbUrl, waitForConnections: true, connectionLimit: 10, queueLimit: 0 }
    : {
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306', 10),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'sistema_informes',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      }
);

async function connectDB() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('MySQL conectado correctamente');
  } catch (error) {
    console.error(`Error conectando a MySQL: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { pool, connectDB };
